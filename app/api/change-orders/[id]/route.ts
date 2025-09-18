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
    
    // Obtener la orden de cambio
    const { data: changeOrder, error } = await supabase
      .from('change_orders')
      .select('*')
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
    
    const body = await request.json();
    
    // Preparar datos de actualización
    const updateData: any = {};
    
    // Mapear campos del frontend a la base de datos
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.designer !== undefined) updateData.designer = body.designer;
    if (body.change_type !== undefined) updateData.change_type = body.change_type;
    if (body.impact_type !== undefined) updateData.impact_type = body.impact_type;
    if (body.cost_impact !== undefined) updateData.cost_impact = body.cost_impact;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.exchange_rate !== undefined) updateData.exchange_rate = body.exchange_rate;
    if (body.cost_impact_crc !== undefined) updateData.cost_impact_crc = body.cost_impact_crc;
    if (body.schedule_impact_days !== undefined) updateData.schedule_impact_days = body.schedule_impact_days;
    // Mapear campos de comentarios del frontend a la base de datos (nombres correctos)
      if (body.cost_impact_details !== undefined) updateData.cost_impact_details = body.cost_impact_details;
      if (body.quality_impact !== undefined) updateData.quality_impact = body.quality_impact;
      if (body.schedule_details !== undefined) updateData.schedule_details = body.schedule_details;
      if (body.risk_assessment !== undefined) updateData.risk_assessment = body.risk_assessment;
      if (body.general_comments !== undefined) updateData.additional_comments = body.general_comments;
    if (body.status !== undefined) updateData.status = body.status;
    
    // Agregar timestamp de actualización
    updateData.updated_at = new Date().toISOString();
    
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
    
    // Actualizar la orden de cambio
    const { data: updatedOrder, error: updateError } = await supabase
      .from('change_orders')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error updating change order:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar la orden de cambio' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedOrder,
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
    if (existingOrder.status === 'implemented') {
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