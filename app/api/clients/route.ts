import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/client';
import * as z from 'zod';

const clientInsertSchema = z.object({
  name: z.string().min(2, 'El nombre del cliente debe tener al menos 2 caracteres'),
  contact_person: z.string().min(2, 'La persona de contacto debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  client_type: z.string().optional(),
  status: z.enum(['activo', 'inactivo']).optional(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Obtener rol del usuario desde la tabla users
    const { data: userProfile, error: userError } = await admin
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'No se pudo obtener el rol del usuario', details: userError.message }, { status: 500 });
    }

    const allowedRoles = ['gerencia', 'administrativo'];
    if (!userProfile || !allowedRoles.includes(userProfile.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes: solo gerencia o administrativo pueden crear clientes' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = clientInsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: parsed.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    // Normalizar campos vacíos opcionales
    const payload = Object.fromEntries(
      Object.entries(parsed.data).filter(([_, v]) => v !== '' && v !== undefined)
    );

    const { data: client, error: insertError } = await admin
      .from('clients')
      .insert(payload)
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json({
        error: 'Error al crear el cliente',
        details: insertError.message,
        code: insertError.code
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, client }, { status: 201 });

  } catch (error) {
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Lista de clientes (RLS permite a usuarios autenticados ver)
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        error: 'Error al obtener clientes',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: clients || [], count: clients?.length || 0 });

  } catch (error) {
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}