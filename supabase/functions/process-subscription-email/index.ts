import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import PostalMime from 'npm:postal-mime@2.4.6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { username, from, subject, rawEmail, receivedAt } = await req.json();

    console.log('Processing email for username:', username);

    // Find user by username
    const { data: userData, error: userError } = await supabase
      .from('profiles') // Or wherever you store usernames
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.error('User not found:', username);
      return new Response(
        JSON.stringify({ error: 'User not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.id;

    // Parse email with PostalMime
    const parser = new PostalMime();
    const email = await parser.parse(rawEmail);

    const emailText = email.text || '';
    const emailHtml = email.html || '';
    const fullText = `${subject} ${emailText}`.toLowerCase();

    // Parse subscription details
    const subscription = parseSubscriptionFromEmail({
      from,
      subject,
      text: emailText,
      html: emailHtml,
    });

    if (!subscription) {
      console.log('No subscription detected in email');
      return new Response(
        JSON.stringify({ message: 'No subscription detected' }), 
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('vendor', subscription.vendor)
      .eq('raw_email_subject', subject)
      .maybeSingle();

    if (existing) {
      // Update existing subscription
      await supabase
        .from('subscriptions')
        .update({
          ...subscription,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      console.log('Updated existing subscription:', existing.id);
    } else {
      // Insert new subscription
      const { data: newSub, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          ...subscription,
          raw_email_subject: subject,
          raw_email_body: emailText,
          original_email_date: receivedAt,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Created new subscription:', newSub.id);

      // Schedule reminder
      if (subscription.next_billing_date && newSub) {
        await scheduleReminder(
          supabase, 
          userId, 
          newSub.id, 
          subscription.next_billing_date
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription processed',
        subscription 
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing subscription email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function parseSubscriptionFromEmail(email: any) {
  const fullText = `${email.subject} ${email.text}`.toLowerCase();
  
  // Subscription keywords
  const keywords = [
    'subscription', 'auto-renew', 'trial ends', 'invoice', 'receipt',
    'price increase', 'renewal', 'billing', 'payment', 'charged', 'membership'
  ];
  
  const hasKeywords = keywords.some(k => fullText.includes(k));
  if (!hasKeywords) return null;

  const vendor = extractVendor(email.from);
  const { amount, currency } = extractAmount(fullText);
  const billingCycle = extractBillingCycle(fullText);
  const nextBillingDate = extractDate(fullText);
  const status = detectStatus(fullText);
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
  const match = from.match(/@([\w-]+)\./);
  if (match) {
    return match[1];
  }
  return from.split('@')[0] || 'Unknown';
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
  if (/\b(month|monthly|\/mo)\b/i.test(text)) return 'monthly';
  if (/\b(year|annual|yearly|\/yr)\b/i.test(text)) return 'yearly';
  if (/\b(quarter|quarterly)\b/i.test(text)) return 'quarterly';
  if (/\b(week|weekly)\b/i.test(text)) return 'weekly';
  return null;
}

function extractDate(text: string): string | null {
  const patterns = [
    /(?:renews?|next billing|due|charge|bill)(?:\s+on|\s+date)?[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:renews?|next billing|due|charge)(?:\s+on|\s+date)?[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{4}-\d{2}-\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime()) && date > new Date()) {
          return date.toISOString().split('T')[0];
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
    streaming: ['netflix', 'spotify', 'hulu', 'disney', 'youtube', 'prime', 'apple music', 'hbo', 'max'],
    software: ['adobe', 'microsoft', 'github', 'notion', 'slack', 'zoom', 'dropbox', 'figma', 'canva'],
    fitness: ['peloton', 'gym', 'fitness', 'yoga', 'planet fitness', 'equinox', 'classpass'],
    news: ['nytimes', 'wsj', 'medium', 'substack', 'washington post'],
    utilities: ['internet', 'phone', 'mobile', 'electricity', 'gas', 'verizon', 'att', 't-mobile'],
    insurance: ['insurance', 'geico', 'progressive', 'state farm', 'allstate'],
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

async function scheduleReminder(
  supabase: any, 
  userId: string, 
  subscriptionId: string, 
  nextBillingDate: string
) {
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('reminder_days_before')
    .eq('user_id', userId)
    .single();

  const daysBefore = prefs?.reminder_days_before || 3;
  const billingDate = new Date(nextBillingDate);
  const reminderDate = new Date(billingDate);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);

  if (reminderDate > new Date()) {
    await supabase
      .from('reminder_emails')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        reminder_type: 'payment_upcoming',
        next_reminder_at: reminderDate.toISOString(),
      });
  }
}
