import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug change orders structure API called');
    
    const supabase = createAdminClient();
    
    // Obtener información de la estructura de la tabla
    const { data: tableInfo, error: tableError } = await supabase
      .from('change_orders')
      .select('*')
      .limit(1);
    
    console.log('📊 Table info:', tableInfo);
    console.log('❌ Table error:', tableError);
    
    // Intentar obtener todas las órdenes de cambio para ver qué columnas existen
    const { data: changeOrders, error: changeOrdersError } = await supabase
      .from('change_orders')
      .select('*');
    
    console.log('📋 Change orders:', changeOrders);
    console.log('❌ Change orders error:', changeOrdersError);
    
    return NextResponse.json({
      success: true,
      tableInfo,
      tableError,
      changeOrders,
      changeOrdersError
    });
    
  } catch (error) {
    console.error('❌ Debug change orders structure error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}