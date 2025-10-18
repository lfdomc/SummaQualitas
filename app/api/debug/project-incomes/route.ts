import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id') || '64561c06-e646-468a-9112-24a600e7f8f0';
    const limitParam = parseInt(searchParams.get('limit') || '0', 10);

    // Verificando ingresos para el proyecto

    // Obtener todos los ingresos del proyecto (con límite opcional)
    let incomesQuery = supabase
      .from('incomes')
      .select('*')
      .eq('project_id', projectId);

    if (limitParam > 0) {
      incomesQuery = incomesQuery.limit(limitParam);
    }

    const { data: incomes, error: incomesError } = await incomesQuery;

    if (incomesError) {
      console.error('Error obteniendo ingresos:', incomesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo ingresos',
        details: incomesError 
      }, { status: 500 });
    }

    // Obtener el resumen de ingresos usando la función del servicio
    const { data: incomesSummary, error: summaryError } = await supabase
      .rpc('get_project_incomes_summary', { p_project_id: projectId });

    if (summaryError) {
      console.error('Error obteniendo resumen de ingresos:', summaryError);
    }

    // Calcular totales manualmente
    const totalConfirmed = incomes
      ?.filter(income => income.status === 'confirmed')
      ?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;

    const totalPending = incomes
      ?.filter(income => income.status === 'pending')
      ?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;

    const totalCancelled = incomes
      ?.filter(income => income.status === 'cancelled')
      ?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        project_id: projectId,
        incomes_count: incomes?.length || 0,
        incomes_raw: incomes,
        incomes_summary_from_function: incomesSummary,
        summary_function_error: summaryError ? (summaryError.message ?? summaryError) : null,
        manual_calculation: {
          total_confirmed: totalConfirmed,
          total_pending: totalPending,
          total_cancelled: totalCancelled,
          total_all: (incomes?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0)
        },
        analysis: {
          has_incomes: (incomes?.length || 0) > 0,
          has_confirmed_incomes: totalConfirmed > 0,
          summary_function_works: !summaryError
        }
      }
    });

  } catch (error) {
    console.error('Error en endpoint de verificación de ingresos:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}