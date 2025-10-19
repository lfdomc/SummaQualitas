import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserService } from '@/lib/supabase/database';

// Ensure this route is always treated as dynamic and never prerendered/cached at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Validar variables de entorno críticas para el cliente de Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Falta configuración de Supabase: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
      // No lanzar error de build: responder que no está autenticado
      return NextResponse.json({
        user: null,
        profile: null,
        error: 'Configuración de Supabase incompleta en el entorno',
        isAuthenticated: false
      }, { status: 200 });
    }

    const supabase = await createClient();
    const userService = new UserService();

    // Obtener la sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({
        user: null,
        profile: null,
        error: sessionError.message,
        isAuthenticated: false
      });
    }

    if (!session?.user) {
      return NextResponse.json({
        user: null,
        profile: null,
        error: null,
        isAuthenticated: false
      });
    }

    // Obtener el perfil del usuario
    try {
      const profile = await userService.getUserProfile(session.user.id);
      
      return NextResponse.json({
        user: {
          id: session.user.id,
          email: session.user.email,
          email_confirmed_at: session.user.email_confirmed_at,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at
        },
        profile,
        error: null,
        isAuthenticated: true
      });
    } catch (profileError) {
      // Devolver usuario sin perfil si hay error
      return NextResponse.json({
        user: {
          id: session.user.id,
          email: session.user.email,
          email_confirmed_at: session.user.email_confirmed_at,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at
        },
        profile: null,
        error: null,
        isAuthenticated: true
      });
    }
  } catch (error) {
    console.error('❌ Error en /api/auth/status:', error);
    return NextResponse.json({
      user: null,
      profile: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
      isAuthenticated: false
    }, { status: 500 });
  }
}