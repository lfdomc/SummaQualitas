import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id') || '64561c06-e646-468a-9112-24a600e7f8f0';
    
    console.log(`🔍 Verificando estado del proyecto: ${projectId}`);
    
    // Primero obtener todos los proyectos para verificar qué hay disponible
    const { data: allProjects, error: allProjectsError } = await supabase
      .from('projects')
      .select('id, name, presupuesto_original, presupuesto_inicial, budget, presupuesto_final');
    
    if (allProjectsError) {
      console.error('❌ Error obteniendo proyectos:', allProjectsError);
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo proyectos',
        details: allProjectsError
      }, { status: 500 });
    }
    
    console.log(`📋 Proyectos disponibles: ${allProjects?.length || 0}`);
    allProjects?.forEach(p => {
      console.log(`   - ${p.id}: ${p.name}`);
    });
    
    // Obtener información del proyecto específico
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();
    
    if (projectError) {
      console.error('❌ Error obteniendo proyecto:', projectError);
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo proyecto',
        details: projectError,
        available_projects: allProjects?.map(p => ({ id: p.id, name: p.name })) || []
      }, { status: 500 });
    }
    
    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Proyecto no encontrado',
        project_id: projectId,
        available_projects: allProjects?.map(p => ({ id: p.id, name: p.name })) || []
      }, { status: 404 });
    }
    
    // Obtener órdenes de cambio del proyecto
    const { data: changeOrders, error: coError } = await supabase
      .from('change_orders')
      .select('*')
      .eq('project_id', projectId);
    
    if (coError) {
      console.error('❌ Error obteniendo órdenes de cambio:', coError);
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo órdenes de cambio',
        details: coError
      }, { status: 500 });
    }
    
    // Calcular el presupuesto que debería tener
    const originalBudget = project.presupuesto_original || project.presupuesto_inicial || project.budget || 0;
    
    const approvedChangeOrders = (changeOrders || []).filter(co => co.status === 'aprobado');
    const totalImpact = approvedChangeOrders.reduce((total, co) => {
      const impact = co.cost_impact_crc || co.cost_impact || 0;
      return total + (co.impact_type === 'positivo' ? impact : -impact);
    }, 0);
    
    const calculatedFinalBudget = originalBudget + totalImpact;
    
    console.log(`📊 Análisis del proyecto ${projectId}:`);
    console.log(`   - Presupuesto original: ${originalBudget}`);
    console.log(`   - Presupuesto final actual: ${project.presupuesto_final}`);
    console.log(`   - Presupuesto final calculado: ${calculatedFinalBudget}`);
    console.log(`   - Órdenes de cambio totales: ${changeOrders?.length || 0}`);
    console.log(`   - Órdenes de cambio aprobadas: ${approvedChangeOrders.length}`);
    console.log(`   - Impacto total: ${totalImpact}`);
    
    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          presupuesto_original: originalBudget,
          presupuesto_final_actual: project.presupuesto_final,
          presupuesto_final_calculado: calculatedFinalBudget,
          discrepancia: project.presupuesto_final - calculatedFinalBudget
        },
        change_orders: {
          total: changeOrders?.length || 0,
          aprobadas: approvedChangeOrders.length,
          impacto_total: totalImpact,
          detalles: changeOrders?.map(co => ({
            id: co.id,
            description: co.description,
            status: co.status,
            impact_type: co.impact_type,
            cost_impact: co.cost_impact,
            cost_impact_crc: co.cost_impact_crc,
            created_at: co.created_at
          })) || []
        },
        analysis: {
          budget_is_correct: Math.abs(project.presupuesto_final - calculatedFinalBudget) < 0.01,
          needs_recalculation: Math.abs(project.presupuesto_final - calculatedFinalBudget) >= 0.01
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error en el análisis del proyecto:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}