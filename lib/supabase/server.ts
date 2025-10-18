import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";
import { cookies } from "next/headers";

/**
 * Supabase server client para SSR, Server Components y Route Handlers.
 * Usa cookies() de next/headers de forma síncrona para evitar problemas
 * con el Edge Runtime y el análisis estático del build.
 */
export function createClient(_request?: NextRequest) {
  if (typeof window !== "undefined") {
    // No se debe usar en el cliente
    throw new Error("createClient from server.ts should not be used on the client side");
  }

  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
              });
            } catch (error) {
              console.warn(`Failed to set cookie ${name}:`, error);
            }
          });
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Deshabilitado en server-side
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
