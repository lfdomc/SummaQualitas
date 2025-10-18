import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Obtener la sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({
        success: false,
        error: sessionError.message
      }, { status: 400 });
    }

    if (!session) {
      // No hay sesión activa, pero consideramos esto como éxito
      return NextResponse.json({
        success: true,
        message: 'No hay sesión activa'
      });
    }

    // Cerrar sesión en Supabase
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      return NextResponse.json({
        success: false,
        error: signOutError.message
      }, { status: 400 });
    }

    // Crear respuesta exitosa
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

    // Limpiar cookies de autenticación
    response.cookies.set('sb-access-token', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    response.cookies.set('sb-refresh-token', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Sesión cerrada exitosamente
    console.log('✅ [API Auth Logout] Sesión cerrada exitosamente');
    return response;

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Método GET para compatibilidad (redirige a POST)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Método no permitido. Use POST para cerrar sesión.'
  }, { status: 405 });
}