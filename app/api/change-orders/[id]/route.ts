import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateChangeOrderData } from '@/types/database';

interface RouteParams {
  params: {
    id: string;
  };
}

// Nota: Usamos UpdateChangeOrderData directamente en la construcción del objeto
// de actualización para evitar desalineaciones con el esquema tipado.

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
  // PUT request received
  
  try {
    const supabase = createClient(request);
    const { id } = await params;
    // PUT request for ID processed
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // Auth error or no user
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Authenticated user verified
    
  const body = await request.json();
    // Request body processed
    
    // Validar que el ID sea válido
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { success: false, error: 'ID de orden de cambio inválido' },
        { status: 400 }
      );
    }

    // Construir objeto de actualización solo con campos definidos
  const updateData: Partial<UpdateChangeOrderData> = {};
  
  if (body.project_id !== undefined) updateData.project_id = body.project_id;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.cost_impact !== undefined) updateData.cost_impact = body.cost_impact;
  if (body.currency !== undefined) updateData.currency = body.currency; // 'CRC' | 'USD'
  if (body.status !== undefined) updateData.status = body.status; // 'pendiente' | 'aprobado' | 'rechazado' | 'implementado'
  if (body.impact_type !== undefined) updateData.impact_type = body.impact_type; // 'positivo' | 'negativo'
  if (body.change_type !== undefined) updateData.change_type = body.change_type; // 'accion_correctiva' | 'accion_preventiva' | 'extras'
  if (body.designer !== undefined) updateData.designer = body.designer;
  if (body.approved_by !== undefined) updateData.approved_by = body.approved_by;
  // Aceptar ambos nombres por compatibilidad, pero mapear al nombre correcto del esquema
  if (body.requested_date !== undefined) updateData.requested_date = body.requested_date;
  if (body.request_date !== undefined) updateData.requested_date = body.request_date;
  if (body.approved_at !== undefined) updateData.approved_at = body.approved_at;
  if (body.approval_date !== undefined) updateData.approved_at = body.approval_date;
  if (body.implementation_date !== undefined) updateData.implementation_date = body.implementation_date;
  if (body.general_comments !== undefined) updateData.general_comments = body.general_comments;

  // 'updated_at' es manejado por triggers en BD; no lo establecemos aquí para mantener el tipado

    // Update data being prepared
    
    // Verificar que la orden existe antes de actualizar
    const { data: existingOrder, error: fetchError } = await supabase
      .from('change_orders')
      .select('id')
      .eq('id', id)
      .single();

    // Existing order fetch result processed
    
    if (fetchError || !existingOrder) {
      // Change order not found or fetch error
      return NextResponse.json(
        { success: false, error: 'Orden de cambio no encontrada' },
        { status: 404 }
      );
    }

    // About to update with validated ID
    
    // Realizar la actualización
  const { data: updatedOrder, error: updateError } = await supabase
      .from('change_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // Update result processed
    
    if (updateError) {
      console.error('Error updating change order:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar la orden de cambio', details: updateError },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      // No rows updated - this is causing the 404
      return NextResponse.json(
        { success: false, error: 'No se pudo actualizar la orden de cambio' },
        { status: 404 }
      );
    }

    // Update successful
    
    return NextResponse.json({
      success: true,
      data: updatedOrder
    });

  } catch (error) {
    console.error('Error in PUT /api/change-orders/[id]:', error);
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