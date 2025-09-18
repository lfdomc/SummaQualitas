import { createServerClient } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Create a Supabase client for server-side operations
 * This version is compatible with both server components and middleware
 * Optimized for performance and better error handling
 */
export function createClient(request?: NextRequest, response?: NextResponse) {
  if (typeof window !== 'undefined') {
    // Client-side fallback
    throw new Error('createClient from server.ts should not be used on the client side');
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          if (response) {
            return response.cookies.getAll();
          }
          // Fallback para server components
          try {
            const cookieStore = await cookies();
            return cookieStore.getAll();
          } catch (error) {
            console.warn('Failed to get cookies:', error);
            return [];
          }
        },
        async setAll(cookiesToSet) {
          if (response) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                response.cookies.set(name, value, {
                  ...options,
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax'
                });
              } catch (error) {
                console.warn(`Failed to set cookie ${name}:`, error);
              }
            });
          } else {
            // Fallback para server components
            try {
              const cookieStore = await cookies();
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, {
                  ...options,
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax'
                });
              });
            } catch (error) {
              console.warn('Failed to set cookies in server component:', error);
            }
          }
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false // Disabled for server-side
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'supabase-js-server'
        }
      }
    },
  );
}
