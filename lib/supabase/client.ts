import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente para el navegador (anon key) con optimizaciones
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'supabase-js-web'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  );
}

// Cliente administrativo para operaciones del servidor (service role key)
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient solo debe usarse en el servidor');
  }
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'supabase-js-server'
        }
      }
    }
  );
}
