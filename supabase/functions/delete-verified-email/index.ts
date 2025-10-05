// supabase/functions/delete-verified-email/index.ts
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
    const { emailId } = await req.json();
    if (!emailId) {
      return new Response(JSON.stringify({
        error: 'Email ID is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get email details
    const { data: verifiedEmail, error: fetchError } = await supabaseClient.from('verified_destination_emails').select('*').eq('id', emailId).eq('user_id', user.id).single();
    if (fetchError || !verifiedEmail) {
      return new Response(JSON.stringify({
        error: 'Email not found or access denied'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if email is being used in any active forwards
    const { data: activeForwards, error: forwardsError } = await supabaseClient.from('temp_email_forwards').select('id').eq('destination_email', verifiedEmail.email).gt('expires_at', new Date().toISOString());
    if (forwardsError) throw forwardsError;
    if (activeForwards && activeForwards.length > 0) {
      return new Response(JSON.stringify({
        error: `This email is being used by ${activeForwards.length} active forward(s). Delete those first.`
      }), {
        status: 409,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Delete from Cloudflare (optional - you may want to keep it there)
    // Uncomment if you want to remove from Cloudflare as well
    /*
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')

    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/email/routing/addresses/${verifiedEmail.cloudflare_email_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
        },
      }
    )
    */ // Delete from database
    const { error: deleteError } = await supabaseClient.from('verified_destination_emails').delete().eq('id', emailId);
    if (deleteError) throw deleteError;
    return new Response(JSON.stringify({
      success: true,
      message: 'Email removed successfully'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
