import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_ROLES = new Set(['gerencia', 'administrativo', 'operativo', 'cliente']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || (!body.email && !body.id) || !body.role) {
      return NextResponse.json({ error: 'Parámetros inválidos. Enviar { email o id, role }' }, { status: 400 });
    }

    const role: string = String(body.role);
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: `Rol inválido: ${role}. Permitidos: ${Array.from(ALLOWED_ROLES).join(', ')}` }, { status: 400 });
    }

    const admin = createAdminClient();

    // Obtener el usuario objetivo por email o id
    let targetId: string | null = null;

    if (body.id) {
      targetId = String(body.id);
    } else if (body.email) {
      const { data: userRow, error: findErr } = await admin
        .from('users')
        .select('id, email, role')
        .eq('email', String(body.email))
        .maybeSingle();

      if (findErr) {
        return NextResponse.json({ error: `Error buscando usuario: ${findErr.message}` }, { status: 500 });
      }
      if (!userRow) {
        return NextResponse.json({ error: `Usuario con email ${String(body.email)} no encontrado` }, { status: 404 });
      }
      targetId = userRow.id as string;
    }

    if (!targetId) {
      return NextResponse.json({ error: 'No se pudo determinar el ID del usuario' }, { status: 400 });
    }

    // Actualizar rol (service role evita RLS)
    const { data: updated, error: updErr } = await admin
      .from('users')
      .update({ role })
      .eq('id', targetId)
      .select('id, email, role')
      .maybeSingle();

    if (updErr) {
      return NextResponse.json({ error: `Error actualizando rol: ${updErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error inesperado' }, { status: 500 });
  }
}