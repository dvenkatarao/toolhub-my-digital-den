// supabase/functions/add-verified-email/index.ts

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

    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if email already exists for this user
    const { data: existing } = await supabaseClient
      .from('verified_destination_emails')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', email)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'This email is already added' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add destination address to Cloudflare
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')

    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/email/routing/addresses`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }
    )

    const cloudflareData = await cloudflareResponse.json()

    if (!cloudflareData.success) {
      console.error('Cloudflare API error:', cloudflareData)
      
      // Check if email already exists in Cloudflare
      if (cloudflareData.errors?.some((e: any) => e.message?.includes('already exists'))) {
        // Get existing Cloudflare email ID
        const listResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/email/routing/addresses`,
          {
            headers: {
              'Authorization': `Bearer ${cloudflareApiToken}`,
            },
          }
        )
        const listData = await listResponse.json()
        const existingEmail = listData.result?.find((e: any) => e.email === email)
        
        if (existingEmail) {
          // Insert into our database with existing Cloudflare ID
          const { data: verifiedEmail, error: insertError } = await supabaseClient
            .from('verified_destination_emails')
            .insert({
              user_id: user.id,
              email: email,
              cloudflare_email_id: existingEmail.id,
              is_verified: existingEmail.verified || false,
            })
            .select()
            .single()

          if (insertError) throw insertError

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Email added (already exists in Cloudflare)',
              email: verifiedEmail,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      return new Response(
        JSON.stringify({ error: 'Failed to add email to Cloudflare', details: cloudflareData.errors }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cloudflareEmailId = cloudflareData.result.id
    const isVerified = cloudflareData.result.verified || false

    // Insert into our database
    const { data: verifiedEmail, error: insertError } = await supabaseClient
      .from('verified_destination_emails')
      .insert({
        user_id: user.id,
        email: email,
        cloudflare_email_id: cloudflareEmailId,
        is_verified: isVerified,
      })
      .select()
      .single()

    if (insertError) {
      // Rollback: Try to delete from Cloudflare
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/email/routing/addresses/${cloudflareEmailId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${cloudflareApiToken}`,
          },
        }
      )
      throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification email sent. Check your inbox.',
        email: verifiedEmail,
      }),
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
