import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Intentar obtener suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (suppliersError) {
      return NextResponse.json(
        { 
          error: 'Error al obtener proveedores',
          details: suppliersError.message,
          code: suppliersError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: suppliers || [],
      count: suppliers?.length || 0
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const admin = createAdminClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener perfil/rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: 'No se pudo verificar el perfil del usuario' }, { status: 403 });
    }

    const allowedRoles = ['gerencia', 'administrativo'];
    if (!profile || !allowedRoles.includes(String(profile.role))) {
      return NextResponse.json({ error: 'Permisos insuficientes para crear proveedores' }, { status: 403 });
    }

    const body = await request.json();

    // Validación básica
    const required = ['name', 'contact_person'];
    for (const field of required) {
      if (!body?.[field] || String(body[field]).trim() === '') {
        return NextResponse.json({ error: `Campo requerido: ${field}` }, { status: 400 });
      }
    }

    // Construir payload sólo con columnas reales de la tabla suppliers
    // Usar contact_person (columna real en BD) y mapear status -> is_active
    const status = (body.status ?? 'ACTIVO') as string;
    const allowedSupplierTypes = ['MATERIALES', 'SERVICIOS', 'EQUIPOS', 'SUBCONTRATISTA'] as const;
    const bodySupplierType = String(body.supplier_type || '').toUpperCase();
    const supplier_type = allowedSupplierTypes.includes(bodySupplierType as any) ? bodySupplierType : null;
    const payload: Record<string, any> = {
      name: String(body.name).trim(),
      contact_person: String(body.contact_person).trim(),
      email: body.email ? String(body.email).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      address: body.address ? String(body.address).trim() : null,
      tax_id: body.tax_id ? String(body.tax_id).trim() : null,
      status: status?.toUpperCase(),
      notes: body.notes ? String(body.notes).trim() : null,
      supplier_type,
    };

    // Validar supplier_type si la columna es NOT NULL
    if (!payload.supplier_type) {
      return NextResponse.json({ error: 'Campo requerido: supplier_type (MATERIALES | SERVICIOS | EQUIPOS | SUBCONTRATISTA)' }, { status: 400 });
    }

    // Insertar usando Service Role (bypass RLS), pero con rol validado arriba
    const { data, error } = await admin
      .from('suppliers')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Intentar detectar columnas desconocidas
      const errMsg = error.message || 'Error al crear proveedor';
      return NextResponse.json({ error: errMsg, details: error }, { status: 400 });
    }

    // Transformar datos a forma esperada por el frontend (compatibilidad)
    const clientData = {
      ...data,
      status: data.status ?? 'ACTIVO',
    };

    return NextResponse.json({ success: true, data: clientData }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error interno' }, { status: 500 });
  }
}