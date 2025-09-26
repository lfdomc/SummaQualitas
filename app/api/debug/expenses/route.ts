import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Usar service role para bypass RLS y verificar datos
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({
        error: 'projectId requerido',
        projectId: null,
        expenses: []
      });
    }

    // Obtener gastos usando service role (bypass RLS)
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        *,
        suppliers (name)
      `)
      .eq('project_id', projectId)
      .order('expense_date', { ascending: false });
    
    // Verificar si el proyecto existe
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .single();

    return NextResponse.json({
      projectId,
      project: projectData,
      projectError,
      expenses: expensesData || [],
      expensesError,
      expensesCount: expensesData?.length || 0,
      message: `Gastos encontrados: ${expensesData?.length || 0}`
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}