// supabase/functions/sync-verified-emails/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Also get user context
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Syncing emails for user: ${user.id}`);
    // Get user's emails from database
    const { data: userEmails, error: fetchError } = await supabaseAdmin.from('verified_destination_emails').select('*').eq('user_id', user.id);
    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      throw fetchError;
    }
    console.log(`Found ${userEmails?.length || 0} emails in database`);
    if (!userEmails || userEmails.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No emails to sync',
        updated: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get all destination addresses from Cloudflare
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    console.log('Fetching from Cloudflare...');
    const cloudflareResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/email/routing/addresses`, {
      headers: {
        'Authorization': `Bearer ${cloudflareApiToken}`,
        'Content-Type': 'application/json'
      }
    });
    const cloudflareData = await cloudflareResponse.json();
    if (!cloudflareData.success) {
      console.error('Cloudflare API error:', cloudflareData);
      throw new Error('Failed to fetch emails from Cloudflare');
    }
    console.log(`Cloudflare returned ${cloudflareData.result?.length || 0} addresses`);
    // Create a map of Cloudflare email statuses
    const cloudflareEmails = new Map();
    if (cloudflareData.result && Array.isArray(cloudflareData.result)) {
      cloudflareData.result.forEach((email)=>{
        console.log(`Cloudflare email: ${email.email}, ID: ${email.id}, Verified: ${email.verified}`);
        cloudflareEmails.set(email.id, {
          verified: email.verified || false,
          email: email.email
        });
      });
    }
    // Update each user email with Cloudflare status and collect updated records
    let updatedCount = 0;
    const updateResults = [];
    const updatedEmails = [];
    for (const userEmail of userEmails){
      const cloudflareEmail = cloudflareEmails.get(userEmail.cloudflare_email_id);
      console.log(`Checking ${userEmail.email}:`);
      console.log(`  DB verified: ${userEmail.is_verified}`);
      console.log(`  CF verified: ${cloudflareEmail?.verified}`);
      if (cloudflareEmail) {
        if (cloudflareEmail.verified !== userEmail.is_verified) {
          console.log(`  -> Updating to ${cloudflareEmail.verified}`);
          // Use service role to bypass RLS
          const { data: updated, error: updateError } = await supabaseAdmin.from('verified_destination_emails').update({
            is_verified: cloudflareEmail.verified
          }).eq('id', userEmail.id).select().single();
          if (updateError) {
            console.error(`Failed to update ${userEmail.email}:`, updateError);
            updateResults.push({
              email: userEmail.email,
              success: false,
              error: updateError.message
            });
            // Add original record even if update failed
            updatedEmails.push(userEmail);
          } else {
            console.log(`  -> Successfully updated`);
            updatedCount++;
            updateResults.push({
              email: userEmail.email,
              success: true
            });
            // Add the updated record
            updatedEmails.push(updated);
          }
        } else {
          console.log(`  -> No change needed`);
          updatedEmails.push(userEmail);
        }
      } else {
        console.log(`  -> Not found in Cloudflare`);
        updatedEmails.push(userEmail);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      message: `Synced ${userEmails.length} email(s), updated ${updatedCount}`,
      total: userEmails.length,
      updated: updatedCount,
      details: updateResults,
      emails: updatedEmails // Return the actual updated data
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
