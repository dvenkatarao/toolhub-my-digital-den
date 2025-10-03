// supabase/functions/cleanup-expired-forwards/index.ts

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
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting cleanup of expired forwards...')

    // Get expired forwards
    const { data: expiredForwards, error: fetchError } = await supabaseAdmin
      .rpc('get_expired_forwards')

    if (fetchError) {
      console.error('Error fetching expired forwards:', fetchError)
      throw fetchError
    }

    if (!expiredForwards || expiredForwards.length === 0) {
      console.log('No expired forwards to clean up')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired forwards found',
          deleted: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiredForwards.length} expired forwards to clean up`)

    const cloudflareZoneId = Deno.env.get('CLOUDFLARE_ZONE_ID')
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')

    let deletedCount = 0
    let failedCount = 0
    const errors = []

    // Delete each expired forward
    for (const forward of expiredForwards) {
      try {
        // Delete from Cloudflare
        if (forward.cloudflare_rule_id) {
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
            console.error(`Failed to delete Cloudflare rule ${forward.cloudflare_rule_id}:`, cloudflareData)
            errors.push({
              email: forward.temp_email_name,
              error: 'Cloudflare deletion failed',
              details: cloudflareData.errors
            })
            // Continue to delete from DB anyway
          }
        }

        // Delete from database
        const { error: deleteError } = await supabaseAdmin
          .rpc('delete_forward_record', { forward_id: forward.id })

        if (deleteError) {
          console.error(`Failed to delete forward ${forward.id} from database:`, deleteError)
          errors.push({
            email: forward.temp_email_name,
            error: 'Database deletion failed',
            details: deleteError.message
          })
          failedCount++
        } else {
          console.log(`Successfully deleted forward: ${forward.temp_email_name}@poofemail.com`)
          deletedCount++
        }
      } catch (error) {
        console.error(`Error processing forward ${forward.temp_email_name}:`, error)
        errors.push({
          email: forward.temp_email_name,
          error: error.message
        })
        failedCount++
      }
    }

    console.log(`Cleanup complete. Deleted: ${deletedCount}, Failed: ${failedCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cleanup completed',
        deleted: deletedCount,
        failed: failedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
