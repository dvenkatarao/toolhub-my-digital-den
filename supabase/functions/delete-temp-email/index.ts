// supabase/functions/delete-temp-email/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { forwardId } = await req.json()

    if (!forwardId) {
      return new Response(
        JSON.stringify({ error: 'Missing forward ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get forward details
    const { data: forward, error: fetchError } = await supabaseClient
      .from('temp_email_forwards')
      .select('*')
      .eq('id', forwardId)
      .eq('user_id', user.id) // Ensure user owns this forward
      .single()

    if (fetchError || !forward) {
      return new Response(
        JSON.stringify({ error: 'Forward not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete from Cloudflare
    if (forward.cloudflare_rule_id) {
      const cloudflareZoneId = Deno.env.get('CLOUDFLARE_ZONE_ID')
      const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')

      const cloudflareResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${cloudflareZoneId}/email/routing/rules/${forward.cloudflare_rule_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${cloudflareApiToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const cloudflareData = await cloudflareResponse.json()

      if (!cloudflareData.success) {
        console.error('Cloudflare deletion error:', cloudflareData)
        // Continue with DB deletion even if Cloudflare fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabaseClient
      .from('temp_email_forwards')
      .delete()
      .eq('id', forwardId)

    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Forward deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
