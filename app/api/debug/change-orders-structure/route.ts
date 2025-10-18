import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Debug change orders structure API called
    const supabase = createAdminClient();
    
    // Get table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('change_orders')
      .select('*')
      .limit(1);
    
    // Table info retrieved
    
    // Get all change orders
    const { data: changeOrders, error: changeOrdersError } = await supabase
      .from('change_orders')
      .select('*');
    
    // Change orders retrieved
    
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