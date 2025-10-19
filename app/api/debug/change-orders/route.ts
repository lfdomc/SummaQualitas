import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Listar todas las órdenes de cambio para debug
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener todas las órdenes de cambio
    const { data: changeOrders, error } = await supabase
      .from('change_orders')
      .select('id, title, project_id, status, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching change orders for debug:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener las órdenes de cambio', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: changeOrders,
      count: changeOrders?.length || 0
    });
    
  } catch (error) {
    console.error('Error in debug change orders API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}