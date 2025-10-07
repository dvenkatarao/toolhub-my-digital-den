import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get all users with weekly summary enabled
    const { data: users } = await supabase
      .from('user_preferences')
      .select('user_id, notification_email')
      .eq('enable_weekly_summary', true);

    for (const user of users || []) {
      const stats = await getUserStats(supabase, user.user_id);
      await sendWeeklyStatsEmail(user.notification_email, stats);
    }

    return new Response('Stats emails sent', { status: 200 });
  } catch (error) {
    return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
});

async function getUserStats(supabase: any, userId: string) {
  const { data: stats } = await supabase
    .from('subscription_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('next_billing_date', { ascending: true });

  const { data: usage } = await supabase
    .from('subscription_usage')
    .select('subscription_id, last_used_date')
    .eq('user_id', userId);

  // Find underutilized subscriptions (not used in 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const underutilized = subscriptions?.filter((sub: any) => {
    const subUsage = usage?.find((u: any) => u.subscription_id === sub.id);
    if (!subUsage) return true;
    return new Date(subUsage.last_used_date) < thirtyDaysAgo;
  }) || [];

  return {
    ...stats,
    upcoming: subscriptions?.filter((s: any) => {
      const nextBilling = new Date(s.next_billing_date);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return nextBilling <= weekFromNow;
    }) || [],
    underutilized,
  };
}

async function sendWeeklyStatsEmail(email: string, stats: any) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>📊 Your Weekly Subscription Summary</h1>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0;">
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px;">
          <h3 style="margin: 0; color: #0369a1;">Total Subscriptions</h3>
          <p style="font-size: 32px; font-weight: bold; margin: 10px 0 0 0;">${stats.total_subscriptions || 0}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px;">
          <h3 style="margin: 0; color: #a16207;">Monthly Spend</h3>
          <p style="font-size: 32px; font-weight: bold; margin: 10px 0 0 0;">$${(stats.monthly_spend || 0).toFixed(2)}</p>
        </div>
        
        <div style="background: #fce7f3; padding: 20px; border-radius: 8px;">
          <h3 style="margin: 0; color: #9f1239;">Yearly Projection</h3>
          <p style="font-size: 32px; font-weight: bold; margin: 10px 0 0 0;">$${(stats.yearly_spend || 0).toFixed(2)}</p>
        </div>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px;">
          <h3 style="margin: 0; color: #166534;">Active</h3>
          <p style="font-size: 32px; font-weight: bold; margin: 10px 0 0 0;">${stats.active_count || 0}</p>
        </div>
      </div>

      ${stats.upcoming?.length > 0 ? `
        <h2>💳 Upcoming Payments (Next 7 Days)</h2>
        <div style="background: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid #ea580c;">
          ${stats.upcoming.map((sub: any) => `
            <div style="padding: 10px 0; border-bottom: 1px solid #fed7aa;">
              <strong>${sub.vendor}</strong> - $${sub.amount} on ${new Date(sub.next_billing_date).toLocaleDateString()}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${stats.underutilized?.length > 0 ? `
        <h2>⚠️ Potentially Underutilized</h2>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p>These subscriptions haven't been used recently. Consider if you still need them:</p>
          ${stats.underutilized.map((sub: any) => `
            <div style="padding: 10px 0;">
              <strong>${sub.vendor}</strong> - $${sub.amount}/${sub.billing_cycle}
            </div>
          `).join('')}
          <p style="margin-top: 15px;"><em>Potential savings: $${stats.underutilized.reduce((sum: number, s: any) => {
            const monthly = s.billing_cycle === 'yearly' ? s.amount / 12 : s.amount;
            return sum + monthly;
          }, 0).toFixed(2)}/month</em></p>
        </div>
      ` : ''}

      <a href="https://renewalradar.app/subscriptions" 
         style="display: inline-block; background: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 30px;">
        Manage Subscriptions
      </a>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Renewal Radar <insights@renewalradar.app>',
      to: email,
      subject: `📊 Your subscriptions cost $${(stats.monthly_spend || 0).toFixed(2)}/month`,
      html,
    }),
  });
}
