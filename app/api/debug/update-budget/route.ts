import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

interface OrderDetail {
  id: string;
  title: string;
  impact_amount: number;
  impact_type: string;
  calculated_impact: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { project_id } = await request.json();

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Updating budget for project
    
    // Obtener el proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json({ 
        error: 'Proyecto no encontrado',
        details: projectError 
      }, { status: 404 });
    }
    
    // Current project data retrieved
    
    // Obtener órdenes de cambio aprobadas
    const { data: changeOrders, error: changeOrdersError } = await supabase
      .from('change_orders')
      .select('*')
      .eq('project_id', project_id)
      .eq('status', 'approved');
    
    if (changeOrdersError) {
      return NextResponse.json({ 
        error: 'Error al obtener órdenes de cambio',
        details: changeOrdersError 
      }, { status: 500 });
    }
    
    // Change orders found
    
    // Calcular el impacto total de las órdenes de cambio
    let totalImpact = 0;
    
    if (changeOrders && changeOrders.length > 0) {
      for (const order of changeOrders) {
        let impact = 0;
        
        if (order.impact_type === 'increase') {
          impact = order.cost_impact || 0;
        } else if (order.impact_type === 'decrease') {
          impact = -(order.cost_impact || 0);
        }
        
        // Order impact calculated
        totalImpact += impact;
      }
    }
    
    // Total change order impact calculated
    
    const originalBudget = project.presupuesto_original || project.presupuesto_inicial || project.budget || 0;
    const newFinalBudget = originalBudget + totalImpact;
    
    // Budget calculation completed
    
    // Actualizar el presupuesto final del proyecto
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        presupuesto_final: newFinalBudget,
        updated_at: new Date().toISOString()
      })
      .eq('id', project_id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json({ 
        error: 'Error al actualizar el presupuesto',
        details: updateError 
      }, { status: 500 });
    }
    
    // Project budget updated successfully

    return NextResponse.json({
      success: true,
      project: {
        before: project,
        after: updatedProject
      },
      changeOrders: {
        total: changeOrders?.length || 0
      },
      calculations: {
        originalBudget,
        totalImpact,
        newFinalBudget,
        previousFinalBudget: project.presupuesto_final
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}