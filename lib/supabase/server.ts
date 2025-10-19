import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";
import { cookies } from "next/headers";

/**
 * Supabase server client para SSR, Server Components y Route Handlers.
 * Usa cookies() de next/headers de forma asíncrona (Next 15+) y asegura
 * opciones de cookies apropiadas para producción.
 */
export async function createClient(_request?: NextRequest) {
  if (typeof window !== "undefined") {
    // No se debe usar en el cliente
    throw new Error("createClient from server.ts should not be used on the client side");
  }

  // En Next.js 15+, cookies() puede ser asíncrono y su tipo es ReadonlyRequestCookies
  const cookieStore = await cookies();

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
              // El tipo de cookies() es ReadonlyRequestCookies en compilación,
              // pero en Route Handlers admite mutación en tiempo de ejecución.
              // Usamos un cast para evitar errores de tipado.
              (cookieStore as any).set(name, value, {
                ...options,
                path: options?.path ?? '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
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
