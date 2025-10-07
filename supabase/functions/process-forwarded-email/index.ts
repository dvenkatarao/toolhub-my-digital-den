import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import PostalMime from 'npm:postal-mime@2.4.6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ParsedEmail {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  date: string;
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Parse incoming email (format depends on your email service)
    const formData = await req.formData();
    const emailRaw = formData.get('email') as string; // SendGrid format
    
    // Parse with PostalMime
    const parser = new PostalMime.default();
    const email = await parser.parse(emailRaw);
    
    const parsedEmail: ParsedEmail = {
      to: email.to?.[0]?.address || '',
      from: email.from?.address || '',
      subject: email.subject || '',
      text: email.text || '',
      html: email.html || '',
      date: email.date || new Date().toISOString(),
    };

    // Extract tracking email (e.g., u_abc123@renewalradar.app)
    const trackingEmail = parsedEmail.to.toLowerCase();
    
    // Find user by tracking email
    const { data: trackingData, error: trackingError } = await supabase
      .from('user_tracking_emails')
      .select('user_id')
      .eq('tracking_email', trackingEmail)
      .single();

    if (trackingError || !trackingData) {
      console.error('Unknown tracking email:', trackingEmail);
      return new Response('Email not recognized', { status: 404 });
    }

    const userId = trackingData.user_id;

    // Parse subscription details
    const subscription = parseSubscriptionFromEmail(parsedEmail);
    
    if (!subscription) {
      console.log('No subscription found in email');
      return new Response('No subscription detected', { status: 200 });
    }

    // Check for existing subscription (avoid duplicates)
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('vendor', subscription.vendor)
      .eq('raw_email_subject', parsedEmail.subject)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from('subscriptions')
        .update({
          ...subscription,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Insert new
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          ...subscription,
          raw_email_subject: parsedEmail.subject,
          raw_email_body: parsedEmail.text,
          original_email_date: parsedEmail.date,
        });
    }

    // Schedule reminder if needed
    if (subscription.next_billing_date) {
      await scheduleReminder(supabase, userId, subscription);
    }

    return new Response('Email processed', { status: 200 });
  } catch (error) {
    console.error('Error processing email:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});

function parseSubscriptionFromEmail(email: ParsedEmail) {
  const fullText = `${email.subject} ${email.text}`.toLowerCase();
  
  // Subscription keywords
  const keywords = [
    'subscription', 'auto-renew', 'trial ends', 'invoice', 'receipt',
    'price increase', 'renewal', 'billing', 'payment', 'charged'
  ];
  
  const hasKeywords = keywords.some(k => fullText.includes(k));
  if (!hasKeywords) return null;

  // Extract vendor
  const vendor = extractVendor(email.from);
  
  // Extract amount and currency
  const { amount, currency } = extractAmount(fullText);
  
  // Extract billing cycle
  const billingCycle = extractBillingCycle(fullText);
  
  // Extract next billing date
  const nextBillingDate = extractDate(fullText);
  
  // Detect status
  const status = detectStatus(fullText);
  
  // Categorize
  const category = categorizeVendor(vendor, fullText);

  return {
    vendor: vendor.charAt(0).toUpperCase() + vendor.slice(1),
    amount,
    currency,
    billing_cycle: billingCycle,
    next_billing_date: nextBillingDate,
    status,
    category,
  };
}

function extractVendor(from: string): string {
  const match = from.match(/@(.+?)$/);
  if (match) {
    const domain = match[1];
    return domain.split('.')[0];
  }
  return 'Unknown';
}

function extractAmount(text: string): { amount?: number; currency?: string } {
  const patterns = [
    { regex: /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/, currency: 'USD' },
    { regex: /€(\d+(?:,\d{3})*(?:\.\d{2})?)/, currency: 'EUR' },
    { regex: /£(\d+(?:,\d{3})*(?:\.\d{2})?)/, currency: 'GBP' },
    { regex: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(USD|EUR|GBP|CAD|AUD)/i, currency: null },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      const currency = pattern.currency || match[2]?.toUpperCase();
      return { amount, currency };
    }
  }
  return {};
}

function extractBillingCycle(text: string): string | null {
  if (/\b(month|monthly)\b/i.test(text)) return 'monthly';
  if (/\b(year|annual|yearly)\b/i.test(text)) return 'yearly';
  if (/\b(quarter|quarterly)\b/i.test(text)) return 'quarterly';
  if (/\b(week|weekly)\b/i.test(text)) return 'weekly';
  return null;
}

function extractDate(text: string): string | null {
  const patterns = [
    /(?:renews?|next billing|due|charge)(?:\s+on|\s+date)?[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:renews?|next billing|due|charge)(?:\s+on|\s+date)?[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{4}-\d{2}-\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]; // YYYY-MM-DD
        }
      } catch (e) {
        continue;
      }
    }
  }
  return null;
}

function detectStatus(text: string): string {
  if (/trial/i.test(text)) return 'trial';
  if (/cancel/i.test(text)) return 'cancelled';
  if (/expire/i.test(text)) return 'expired';
  return 'active';
}

function categorizeVendor(vendor: string, text: string): string {
  const categories = {
    streaming: ['netflix', 'spotify', 'hulu', 'disney', 'youtube', 'prime', 'apple music', 'hbo'],
    software: ['adobe', 'microsoft', 'github', 'notion', 'slack', 'zoom', 'dropbox'],
    fitness: ['peloton', 'gym', 'fitness', 'yoga', 'planet fitness'],
    news: ['nytimes', 'wsj', 'medium', 'substack'],
    utilities: ['internet', 'phone', 'mobile', 'electricity', 'gas'],
    insurance: ['insurance', 'geico', 'progressive'],
  };

  const vendorLower = vendor.toLowerCase();
  const textLower = text.toLowerCase();

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(k => vendorLower.includes(k) || textLower.includes(k))) {
      return category;
    }
  }

  return 'other';
}

async function scheduleReminder(supabase: any, userId: string, subscription: any) {
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('reminder_days_before')
    .eq('user_id', userId)
    .single();

  const daysBefore = prefs?.reminder_days_before || 3;
  const nextBillingDate = new Date(subscription.next_billing_date);
  const reminderDate = new Date(nextBillingDate);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);

  // Don't schedule if reminder date is in the past
  if (reminderDate > new Date()) {
    await supabase
      .from('reminder_emails')
      .insert({
        user_id: userId,
        subscription_id: subscription.id,
        reminder_type: 'payment_upcoming',
        next_reminder_at: reminderDate.toISOString(),
      });
  }
}
