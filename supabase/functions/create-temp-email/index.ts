// supabase/functions/create-temp-email/index.ts

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

    const { tempEmailName, destinationEmail } = await req.json()

    if (!tempEmailName || !destinationEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate and normalize email format (enhanced validation)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    const normalizedEmail = destinationEmail.toLowerCase().trim()
    
    if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 254) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate temp email name (alphanumeric and hyphens only, max 63 chars)
    const nameRegex = /^[a-z0-9-]+$/
    if (!nameRegex.test(tempEmailName) || tempEmailName.length > 63 || tempEmailName.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Temp email name must be 3-63 characters: lowercase letters, numbers, and hyphens only' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check total active forwards (Cloudflare limit: 200)
    const { data: totalCheck, error: totalError } = await supabaseClient
      .rpc('get_total_active_forwards')

    if (totalError) {
      console.error('Error checking total forwards:', totalError)
    }

    if (totalCheck && totalCheck >= 200) {
      return new Response(
        JSON.stringify({ error: 'Service at capacity. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID()

    // Check if temp email name already exists
    const { data: existing } = await supabaseClient
      .from('temp_email_forwards')
      .select('id')
      .eq('temp_email_name', tempEmailName)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'This email name is already taken. Please choose another.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Cloudflare Email Routing rule
    const cloudflareZoneId = Deno.env.get('CLOUDFLARE_ZONE_ID')
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')
    const domain = 'poofemail.com'

    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${cloudflareZoneId}/email/routing/rules`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchers: [
            {
              type: 'literal',
              field: 'to',
              value: `${tempEmailName}@${domain}`,
            },
          ],
          actions: [
            {
              type: 'forward',
              value: [destinationEmail],
            },
          ],
          enabled: true,
          name: `temp-${tempEmailName}`,
        }),
      }
    )

    const cloudflareData = await cloudflareResponse.json()

    if (!cloudflareData.success) {
      console.error('Cloudflare API error:', cloudflareData)
      return new Response(
        JSON.stringify({ error: 'Failed to configure email routing. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cloudflareRuleId = cloudflareData.result.id

    // Insert into database
    const { data: forward, error: insertError } = await supabaseClient
      .from('temp_email_forwards')
      .insert({
        user_id: user.id,
        temp_email_name: tempEmailName,
        destination_email: normalizedEmail,
        cloudflare_rule_id: cloudflareRuleId,
        verification_token: verificationToken,
        is_verified: false, // Will be verified via email
      })
      .select()
      .single()

    if (insertError) {
      // Rollback: Delete Cloudflare rule if database insert fails
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${cloudflareZoneId}/email/routing/rules/${cloudflareRuleId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${cloudflareApiToken}`,
          },
        }
      )

      throw insertError
    }

    // SECURITY FIX: Removed auto-verification
    // TODO: Implement proper email verification flow before enabling forwarding
    // Forwards will remain unverified until proper verification is implemented
    console.log('Forward created (unverified):', forward.id)

    return new Response(
      JSON.stringify({
        success: true,
        forward: {
          ...forward,
          full_email: `${tempEmailName}@${domain}`,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating temp email:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // Map specific errors to user-friendly messages
    let userMessage = 'Service temporarily unavailable. Please try again later.'
    let statusCode = 500
    
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      userMessage = 'This email name is already taken.'
      statusCode = 409
    }
    
    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
