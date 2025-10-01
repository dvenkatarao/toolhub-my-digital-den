import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YourlsResponse {
  url?: {
    keyword: string;
    url: string;
    title: string;
    date: string;
    ip: string;
  };
  shorturl?: string;
  status?: string;
  message?: string;
  statusCode?: number;
  links?: Array<{
    keyword: string;
    url: string;
    title: string;
    clicks: string;
    timestamp: string;
    ip: string;
  }>;
}

const YOURLS_API_URL = 'https://lnk.wazir.ai/yourls-api.php';
const YOURLS_SIGNATURE = Deno.env.get('YOURLS_API_SIGNATURE');

async function callYourlsApi(params: Record<string, string>): Promise<YourlsResponse> {
  const url = new URL(YOURLS_API_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  url.searchParams.append('signature', YOURLS_SIGNATURE!);
  url.searchParams.append('format', 'json');

  console.log('Calling YOURLS API:', url.toString().replace(YOURLS_SIGNATURE!, 'HIDDEN'));
  
  const response = await fetch(url.toString());
  const data = await response.json();
  
  console.log('YOURLS API Response:', JSON.stringify(data, null, 2));
  
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting yourls function...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('Getting user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication error', details: userError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!user) {
      console.error('No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - no user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Get user's plan
    console.log('Fetching profile for user:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }
    
    console.log('Profile data:', profile);

    const isPremium = profile?.plan === 'PREMIUM';

    const { action, url, keyword, title, stats } = await req.json();

    switch (action) {
      case 'shorten': {
        const params: Record<string, string> = {
          action: 'shorturl',
          url: url,
        };
        
        if (keyword && isPremium) {
          params.keyword = keyword;
        }
        
        if (title) {
          params.title = title;
        }

        const result = await callYourlsApi(params);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'stats': {
        if (!isPremium) {
          return new Response(
            JSON.stringify({ error: 'Premium feature' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const params: Record<string, string> = {
          action: 'stats',
          format: 'json',
        };

        if (keyword) {
          params.filter = 'shorturl';
          params.shorturl = keyword;
        }

        const result = await callYourlsApi(params);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'db-stats': {
        if (!isPremium) {
          return new Response(
            JSON.stringify({ error: 'Premium feature' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const result = await callYourlsApi({ action: 'db-stats' });
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in yourls function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
