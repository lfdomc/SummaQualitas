import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Llamar a la función RPC get_dashboard_kpis
    const { data, error } = await supabase.rpc('get_dashboard_kpis');
    
    if (error) {
      console.error('Error fetching dashboard KPIs:', error);
      return NextResponse.json(
        { error: 'Error al obtener KPIs del dashboard', details: error.message },
        { status: 500 }
      );
    }

    // La función RPC devuelve un array, tomamos el primer elemento
    const kpis = data && data.length > 0 ? data[0] : {
      total_projects: 0,
      active_projects: 0,
      total_expenses: 0,
      total_incomes: 0,
      pending_payments: 0,
      monthly_expenses: 0,
      monthly_incomes: 0
    };

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Error in dashboard KPIs API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}