import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [DEBUG] Obteniendo orden de cambio:', params.id);
    
    const supabase = await createClient();
    
    // Obtener la orden de cambio SIN autenticación para debugging
    const { data: changeOrder, error } = await supabase
      .from('change_orders')
      .select(`
        *,
        projects (
          id,
          name,
          budget,
          currency,
          start_date,
          end_date,
          estimated_end_date
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('❌ [DEBUG] Error obteniendo orden de cambio:', error);
      
      // Si es un error de "no rows", intentar listar todas las órdenes
      if (error.code === 'PGRST116') {
        console.log('🔍 [DEBUG] No se encontró la orden específica, listando todas...');
        
        const { data: allChangeOrders, error: listError } = await supabase
          .from('change_orders')
          .select('id, title, status, created_at')
          .limit(10);
        
        if (listError) {
          console.error('❌ [DEBUG] Error listando órdenes:', listError);
          return NextResponse.json(
            { 
              success: false, 
              error: 'Error accediendo a la tabla change_orders',
              details: listError 
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: `Orden de cambio con ID ${params.id} no encontrada`,
            availableChangeOrders: allChangeOrders || [],
            totalFound: allChangeOrders?.length || 0,
            requestedId: params.id
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo orden de cambio',
          details: error 
        },
        { status: 500 }
      );
    }

    if (!changeOrder) {
      console.log('❌ [DEBUG] Orden de cambio no encontrada, listando todas las disponibles...');
      
      // Listar todas las órdenes de cambio disponibles
      const { data: allChangeOrders, error: listError } = await supabase
        .from('change_orders')
        .select('id, title, status, created_at')
        .limit(10);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Orden de cambio no encontrada',
          availableChangeOrders: allChangeOrders || [],
          requestedId: params.id
        },
        { status: 404 }
      );
    }

    console.log('✅ [DEBUG] Orden de cambio encontrada:', {
      id: changeOrder.id,
      title: changeOrder.title,
      designer: changeOrder.designer,
      cost_impact: changeOrder.cost_impact,
      cost_impact_crc: changeOrder.cost_impact_crc,
      schedule_impact_days: changeOrder.schedule_impact_days,
      currency: changeOrder.currency,
      exchange_rate: changeOrder.exchange_rate,
      // Mostrar todas las columnas disponibles
      allColumns: Object.keys(changeOrder)
    });

    return NextResponse.json({
      success: true,
      data: changeOrder,
      debug: {
        availableColumns: Object.keys(changeOrder),
        problematicFields: {
          designer: changeOrder.designer,
          cost_impact: changeOrder.cost_impact,
          cost_impact_crc: changeOrder.cost_impact_crc,
          schedule_impact_days: changeOrder.schedule_impact_days,
          currency: changeOrder.currency,
          exchange_rate: changeOrder.exchange_rate
        }
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error inesperado:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}