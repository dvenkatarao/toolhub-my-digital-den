import PostalMime from 'postal-mime';

export type SubscriptionItem = {
  id: string;
  vendor: string;
  amount?: number;
  currency?: string;
  nextChargeDate?: string;
  status: 'active' | 'trial';
  rawSubject?: string;
};

const SUBSCRIPTION_KEYWORDS = [
  'subscription', 'auto-renew', 'trial ends', 'invoice', 'receipt',
  'price increase', 'renewal', 'billing', 'payment', 'charged'
];

function extractVendor(from: string): string {
  const match = from.match(/<(.+?)@(.+?)>/);
  if (match) {
    const domain = match[2];
    return domain.split('.')[0];
  }
  return from.split('@')[0] || 'Unknown';
}

function extractAmount(text: string): { amount?: number; currency?: string } {
  const patterns = [
    /\$(\d+(?:\.\d{2})?)/,
    /€(\d+(?:\.\d{2})?)/,
    /£(\d+(?:\.\d{2})?)/,
    /(\d+(?:\.\d{2})?)\s*(USD|EUR|GBP)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      const currency = pattern.source.includes('$') ? 'USD' :
                      pattern.source.includes('€') ? 'EUR' :
                      pattern.source.includes('£') ? 'GBP' :
                      match[2]?.toUpperCase();
      return { amount, currency };
    }
  }
  return {};
}

function extractDate(text: string): string | undefined {
  const patterns = [
    /(?:renews? on|next billing date|due date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{4}-\d{2}-\d{2})/,
    /(?:on|date)[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (e) {
        continue;
      }
    }
  }
  return undefined;
}

function detectStatus(text: string): 'active' | 'trial' {
  const trialKeywords = ['trial', 'free trial', 'trial period'];
  const lowerText = text.toLowerCase();
  return trialKeywords.some(keyword => lowerText.includes(keyword)) ? 'trial' : 'active';
}

function generateHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function parseEmailFile(file: File): Promise<SubscriptionItem | null> {
  try {
    const text = await file.text();
    const parser = new PostalMime();
    const email = await parser.parse(text);

    const subject = email.subject || '';
    const body = email.text || email.html || '';
    const from = email.from?.address || '';
    
    const fullText = `${subject} ${body}`.toLowerCase();
    
    // Check if email contains subscription-related keywords
    const hasSubscriptionKeywords = SUBSCRIPTION_KEYWORDS.some(keyword => 
      fullText.includes(keyword)
    );

    if (!hasSubscriptionKeywords) {
      return null;
    }

    const vendor = extractVendor(from);
    const { amount, currency } = extractAmount(fullText);
    const nextChargeDate = extractDate(fullText);
    const status = detectStatus(fullText);
    
    return {
      id: generateHash(`${vendor}-${from}-${subject}`),
      vendor: vendor.charAt(0).toUpperCase() + vendor.slice(1),
      amount,
      currency,
      nextChargeDate,
      status,
      rawSubject: subject
    };
  } catch (error) {
    console.error('Error parsing email:', error);
    return null;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const files: File[] = e.data.files;
  const results: SubscriptionItem[] = [];

  for (const file of files) {
    const item = await parseEmailFile(file);
    if (item) {
      results.push(item);
    }
  }

  self.postMessage({ subscriptions: results });
};
