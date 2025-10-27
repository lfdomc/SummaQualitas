import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * Endpoint estable para abrir/descargar un adjunto.
 * - Verifica autenticación y acceso al adjunto usando RLS (cliente normal).
 * - Genera un signed URL en tiempo real con Service Role y redirige (302).
 *
 * GET /api/sumitals/attachments/:id/open
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient(request);
    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Falta el id del adjunto' }, { status: 400 });
    }

    // Usar RLS (cliente normal) para asegurar que el usuario tiene acceso al adjunto
    const { data: attachment, error: attError } = await supabase
      .from('sumital_attachments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (attError) {
      console.error('Error al obtener adjunto con RLS:', attError);
      return NextResponse.json({ error: 'Acceso denegado al adjunto' }, { status: 403 });
    }
    if (!attachment) {
      return NextResponse.json({ error: 'Adjunto no encontrado' }, { status: 404 });
    }

    if (!attachment.file_path) {
      return NextResponse.json({ error: 'Adjunto sin ruta de archivo' }, { status: 400 });
    }

    // Generar signed URL con Service Role (preferido). Fallback al cliente normal si no disponible.
    const expiresIn = 60 * 60 * 24 * 7; // 7 días
    try {
      const { data, error } = adminSupabase
        ? await adminSupabase.storage.from('sumitals').createSignedUrl(attachment.file_path, expiresIn)
        : await supabase.storage.from('sumitals').createSignedUrl(attachment.file_path, expiresIn);

      if (error || !data?.signedUrl) {
        console.error('No se pudo crear signed URL del adjunto:', error?.message || error);
        return NextResponse.json({ error: 'No se pudo generar la URL de acceso' }, { status: 500 });
      }

      // Redirigir al signed URL
      return NextResponse.redirect(data.signedUrl, { status: 302 });
    } catch (e: any) {
      console.error('Error creando signed URL:', e?.message || e);
      return NextResponse.json({ error: 'Error al generar la URL de acceso' }, { status: 500 });
    }
  } catch (e: any) {
    console.error('Error en open attachment endpoint:', e?.message || e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}