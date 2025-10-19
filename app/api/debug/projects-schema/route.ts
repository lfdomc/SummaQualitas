import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/client';

// Dev/preview: intenta con service role si está disponible; si no, usa el cliente normal
export async function GET() {
  try {
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = hasServiceRole ? createAdminClient() : createClient();

    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'No se pudo inicializar el cliente de Supabase' }, { status: 500 });
    }

    // Intentar leer una fila para inferir columnas
    const { data, error } = await supabase.from('projects').select('*').limit(1);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message, code: (error as any)?.code }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ ok: true, columns: [], note: 'La tabla no tiene filas; no se pudo inferir columnas por contenido.' });
    }

    const row = data[0] as Record<string, unknown>;
    const columns = Object.keys(row);
    return NextResponse.json({ ok: true, columns });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error inesperado' }, { status: 500 });
  }
}