import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!; // Use Resend for sending emails

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get reminders due now
    const { data: reminders, error } = await supabase
      .from('reminder_emails')
      .select(`
        *,
        subscriptions (*),
        user_preferences (notification_email)
      `)
      .lte('next_reminder_at', new Date().toISOString())
      .is('sent_at', null)
      .limit(100);

    if (error) throw error;

    for (const reminder of reminders || []) {
      await sendReminderEmail(reminder);
      
      // Mark as sent
      await supabase
        .from('reminder_emails')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', reminder.id);
    }

    return new Response(
      JSON.stringify({ processed: reminders?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending reminders:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});

async function sendReminderEmail(reminder: any) {
  const subscription = reminder.subscriptions;
  const email = reminder.user_preferences.notification_email;

  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>💳 Upcoming Payment Reminder</h2>
      <p>Your <strong>${subscription.vendor}</strong> subscription will renew soon.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Amount:</strong> ${subscription.currency} ${subscription.amount}</p>
        <p style="margin: 5px 0;"><strong>Next Billing:</strong> ${new Date(subscription.next_billing_date).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Frequency:</strong> ${subscription.billing_cycle}</p>
      </div>

      <p>Make sure you have sufficient funds and that you're still using this service!</p>
      
      <a href="https://renewalradar.app/subscriptions" 
         style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
        View All Subscriptions
      </a>
    </div>
  `;

  // Send with Resend
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Renewal Radar <reminders@renewalradar.app>',
      to: email,
      subject: `💳 ${subscription.vendor} payment coming up`,
      html: emailHtml,
    }),
  });
}
