import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    console.log('🔧 Iniciando corrección del trigger de órdenes de cambio...');
    
    console.log('📋 Nota: No podemos modificar triggers directamente desde la API de Supabase.');
    console.log('📋 Procediendo solo con el recálculo de presupuestos finales...');
    
    // 4. Recalcular presupuestos finales para todos los proyectos
    console.log('📋 Recalculando presupuestos finales...');
    
    // Primero obtener todos los proyectos
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, presupuesto_original, presupuesto_inicial, budget');
    
    if (projectsError) {
      console.error('❌ Error obteniendo proyectos:', projectsError);
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo proyectos',
        details: projectsError
      }, { status: 500 });
    }
    
    let updatedProjects = 0;
    
    for (const project of projects || []) {
      // Obtener órdenes de cambio aprobadas para este proyecto
      const { data: changeOrders, error: coError } = await supabase
        .from('change_orders')
        .select('cost_impact_crc, cost_impact, impact_type')
        .eq('project_id', project.id)
        .eq('status', 'aprobado');
      
      if (coError) {
        console.error(`❌ Error obteniendo órdenes de cambio para proyecto ${project.id}:`, coError);
        continue;
      }
      
      // Calcular el impacto total
      const totalImpact = (changeOrders || []).reduce((total, co) => {
        const impact = co.cost_impact_crc || co.cost_impact || 0;
        return total + (co.impact_type === 'positivo' ? impact : -impact);
      }, 0);
      
      // Calcular el nuevo presupuesto final
      const originalBudget = project.presupuesto_original || project.presupuesto_inicial || project.budget || 0;
      const newFinalBudget = originalBudget + totalImpact;
      
      // Actualizar el proyecto
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          presupuesto_final: newFinalBudget,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);
      
      if (updateError) {
        console.error(`❌ Error actualizando proyecto ${project.id}:`, updateError);
      } else {
        updatedProjects++;
        console.log(`✅ Proyecto ${project.id} actualizado: ${originalBudget} + ${totalImpact} = ${newFinalBudget}`);
      }
    }
    
    console.log(`🎉 Recálculo completado. ${updatedProjects} proyectos actualizados.`);
    
    return NextResponse.json({
      success: true,
      message: 'Presupuestos finales recalculados exitosamente',
      note: 'El trigger debe ser corregido manualmente en la base de datos para usar "aprobado" en lugar de "approved"',
      data: {
        projectsUpdated: updatedProjects,
        totalProjects: projects?.length || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error en la corrección del trigger:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}