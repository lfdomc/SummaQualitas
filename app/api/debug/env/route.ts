import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const urlOk = !!url && url.startsWith('https://');
    const anonOk = typeof anon === 'string' && anon.length > 40; // clave JWT larga
    const serviceOk = typeof service === 'string' && service.length > 40;

    // Extraer project-ref del URL si posible
    let projectRef: string | null = null;
    const m = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
    if (m) projectRef = m[1];

    return NextResponse.json({
      ok: true,
      supabaseUrlPresent: urlOk,
      anonKeyPresent: anonOk,
      serviceRolePresent: serviceOk,
      projectRef
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error inesperado' }, { status: 500 });
  }
}