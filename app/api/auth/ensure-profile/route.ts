import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  try {
    // Identificar al usuario autenticado desde las cookies de la request
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    // Crear cliente administrativo (service role) para evitar RLS
    const admin = createAdminClient();

    // Verificar si ya existe el perfil
    const { data: existing, error: existingError } = await admin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existing) {
      const defaultName = (user.user_metadata?.name as string) || (user.email?.split('@')[0] ?? 'Usuario');
      const { error: insertError } = await admin
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          name: defaultName,
          role: 'operativo',
          company: (user.user_metadata?.company as string) || null,
          avatar_url: (user.user_metadata?.avatar_url as string) || null,
          is_active: true,
        })
        .select('id')
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error inesperado' }, { status: 500 });
  }
}