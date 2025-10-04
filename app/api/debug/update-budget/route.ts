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

    console.log('🔄 Updating budget for project:', project_id);

    // 1. Obtener el proyecto actual
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, presupuesto_original, presupuesto_final, budget')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      console.error('❌ Project fetch error:', projectError);
      return NextResponse.json(
        { error: 'Project not found', details: projectError },
        { status: 404 }
      );
    }

    console.log('📊 Current project:', project);

    // 2. Obtener órdenes de cambio implementadas
    const { data: changeOrders, error: changeOrdersError } = await supabase
      .from('change_orders')
      .select('id, title, cost_impact_crc, cost_impact, impact_type, status')
      .eq('project_id', project_id)
      .eq('status', 'implementado');

    if (changeOrdersError) {
      console.error('❌ Change orders fetch error:', changeOrdersError);
      return NextResponse.json(
        { error: 'Error fetching change orders', details: changeOrdersError },
        { status: 500 }
      );
    }

    console.log('📋 Change orders found:', changeOrders?.length || 0);

    // 3. Calcular el impacto total de las órdenes de cambio
    let totalImpact = 0;
    const orderDetails: OrderDetail[] = [];

    if (changeOrders && changeOrders.length > 0) {
      for (const order of changeOrders) {
        // Usar cost_impact_crc si está disponible, sino cost_impact
        const impactAmount = order.cost_impact_crc || order.cost_impact || 0;
        const impact = order.impact_type === 'positivo' ? impactAmount : -impactAmount;
        totalImpact += impact;

        orderDetails.push({
          id: order.id,
          title: order.title,
          impact_amount: impactAmount,
          impact_type: order.impact_type,
          calculated_impact: impact
        });

        console.log(`📋 Order "${order.title}": ${impact} (type: ${order.impact_type})`);
      }
    }

    console.log('💰 Total change order impact:', totalImpact);

    // 4. Calcular el nuevo presupuesto final
    const originalBudget = project.presupuesto_original || project.budget || 0;
    const newFinalBudget = originalBudget + totalImpact;

    console.log('🧮 Budget calculation:', {
      originalBudget,
      totalImpact,
      newFinalBudget,
      currentFinalBudget: project.presupuesto_final
    });

    // 5. Actualizar el presupuesto final en la base de datos
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        presupuesto_final: newFinalBudget,
        updated_at: new Date().toISOString()
      })
      .eq('id', project_id)
      .select('id, name, presupuesto_original, presupuesto_final, budget')
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return NextResponse.json(
        { error: 'Error updating project budget', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Project budget updated successfully:', updatedProject);

    return NextResponse.json({
      success: true,
      project: {
        before: project,
        after: updatedProject
      },
      changeOrders: {
        total: changeOrders?.length || 0,
        details: orderDetails
      },
      calculations: {
        originalBudget,
        totalImpact,
        newFinalBudget,
        previousFinalBudget: project.presupuesto_final
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}