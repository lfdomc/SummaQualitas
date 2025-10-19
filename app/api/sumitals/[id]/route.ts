import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateSumitalData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: sumital, error } = await supabase
      .from('sumitals')
      .select(`
        *,
        project:projects(id, name, client_id)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching sumital:', error);
      return NextResponse.json({ error: 'Sumital no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ sumital });

  } catch (error) {
    console.error('Error in GET /api/sumitals/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: UpdateSumitalData = await request.json();

    // Verificar que el sumital existe (RLS se encarga de los permisos)
    const { data: existingSumital, error: fetchError } = await supabase
      .from('sumitals')
      .select('id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingSumital) {
      return NextResponse.json({ error: 'Sumital no encontrado o sin acceso' }, { status: 404 });
    }

    // Preparar datos de actualización
    const updateData: any = {
      ...body,
      updated_by: user.id
    };

    // Si se está aprobando/rechazando, agregar fecha de revisión
    if (body.is_approved !== undefined && body.is_approved !== null) {
      updateData.review_date = new Date().toISOString().split('T')[0];
      if (!body.approver_name) {
        // Obtener el nombre del usuario actual si no se proporciona
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (profile?.name) {
          updateData.approver_name = profile.name;
        }
      }
    }

    const { data: sumital, error } = await supabase
      .from('sumitals')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        project:projects(id, name, client_id)
      `)
      .single();

    if (error) {
      console.error('Error updating sumital:', error);
      return NextResponse.json({ error: 'Error al actualizar sumital' }, { status: 500 });
    }

    return NextResponse.json({ sumital });

  } catch (error) {
    console.error('Error in PUT /api/sumitals/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el sumital existe antes de intentar eliminarlo
    const { data: existingSumital, error: fetchError } = await supabase
      .from('sumitals')
      .select('id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingSumital) {
      return NextResponse.json({ error: 'Sumital no encontrado' }, { status: 404 });
    }

    // Eliminar el sumital (RLS se encarga de los permisos)
    const { error } = await supabase
      .from('sumitals')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting sumital:', error);
      return NextResponse.json({ error: 'Error al eliminar sumital' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Sumital eliminado exitosamente' });

  } catch (error) {
    console.error('Error in DELETE /api/sumitals/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}