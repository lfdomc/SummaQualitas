import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateChangeOrderData } from '@/types/database';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Obtener una orden de cambio específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient(request);
    const { id } = await params;
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener la orden de cambio con información del proyecto
    const { data: changeOrder, error } = await supabase
      .from('change_orders')
      .select(`
        *,
        projects (
          id,
          name,
          description,
          location,
          status
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching change order:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Orden de cambio no encontrada' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Error al obtener la orden de cambio' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: changeOrder
    });
    
  } catch (error) {
    console.error('Error in change order GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una orden de cambio
export async function PUT(request: NextRequest, { params }: RouteParams) {
  console.log('=== PUT REQUEST RECEIVED ===');
  
  try {
    const supabase = createClient(request);
    const { id } = await params;
    console.log('PUT request for ID:', id);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Auth error or no user:', authError);
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    console.log('Authenticated user:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Preparar datos de actualización
    const updateData: any = {};
    
    // Mapear solo los campos que existen en el esquema actual de la tabla change_orders
    if (body.project_id !== undefined) updateData.project_id = body.project_id;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.requested_by !== undefined) updateData.requested_by = body.requested_by;
    if (body.approved_by !== undefined) updateData.approved_by = body.approved_by;
    if (body.request_date !== undefined) updateData.request_date = body.request_date;
    if (body.approval_date !== undefined) updateData.approval_date = body.approval_date;
    if (body.implementation_date !== undefined) updateData.implementation_date = body.implementation_date;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    // Campos de impacto (se agregarán una vez que se ejecute la migración)
    if (body.cost_impact !== undefined) updateData.cost_impact = body.cost_impact;
    if (body.cost_impact_crc !== undefined) updateData.cost_impact_crc = body.cost_impact_crc;
    if (body.schedule_impact_days !== undefined) updateData.schedule_impact_days = body.schedule_impact_days;
    if (body.cost_impact_level !== undefined) updateData.cost_impact_level = body.cost_impact_level;
    if (body.schedule_impact_level !== undefined) updateData.schedule_impact_level = body.schedule_impact_level;
    if (body.exchange_rate !== undefined) updateData.exchange_rate = body.exchange_rate;
    if (body.designer !== undefined) updateData.designer = body.designer;
    if (body.cost_comments !== undefined) updateData.cost_comments = body.cost_comments;
    if (body.schedule_comments !== undefined) updateData.schedule_comments = body.schedule_comments;
    
    // Agregar timestamp de actualización
    updateData.updated_at = new Date().toISOString();
    
    console.log('Update data being sent:', updateData);
    
    // Verificar que la orden de cambio existe
    const { data: existingOrder, error: fetchError } = await supabase
      .from('change_orders')
      .select('id, project_id, status')
      .eq('id', id)
      .single();
    
    console.log('Existing order fetch result:', { existingOrder, fetchError });
    
    if (fetchError || !existingOrder) {
      console.log('Change order not found or fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Orden de cambio no encontrada', details: fetchError?.message },
        { status: 404 }
      );
    }
    
    // Actualizar la orden de cambio
    console.log('About to update with ID:', id);
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    const { data: updatedOrder, error: updateError } = await supabase
      .from('change_orders')
      .update(updateData)
      .eq('id', id)
      .select('*');
    
    console.log('Update result:', { updatedOrder, updateError });
    
    if (updateError) {
      console.error('Error updating change order:', updateError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al actualizar la orden de cambio',
          details: updateError.message 
        },
        { status: 500 }
      );
    }
    
    // Verificar que se actualizó al menos una fila
    if (!updatedOrder || updatedOrder.length === 0) {
      console.log('No rows updated - this is causing the 404');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se pudo actualizar la orden de cambio. Verifique que el ID sea correcto y que tenga permisos.' 
        },
        { status: 404 }
      );
    }

    console.log('Update successful:', updatedOrder[0]);
    return NextResponse.json({
      success: true,
      data: updatedOrder[0],
      message: 'Orden de cambio actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Error in change order PUT API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una orden de cambio
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient(request);
    const { id } = await params;
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar que la orden de cambio existe
    const { data: existingOrder, error: fetchError } = await supabase
      .from('change_orders')
      .select('id, project_id, status')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Orden de cambio no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar que la orden no esté implementada
    if (existingOrder.status === 'implementado') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una orden de cambio implementada' },
        { status: 400 }
      );
    }
    
    // Eliminar la orden de cambio
    const { error: deleteError } = await supabase
      .from('change_orders')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting change order:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar la orden de cambio' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Orden de cambio eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error in change order DELETE API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}