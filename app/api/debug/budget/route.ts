import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug budget API called');
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    console.log('📋 Project ID:', projectId);

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    console.log('🔗 Creating Supabase client...');
    const supabase = createAdminClient();

    console.log('📊 Fetching project data...');
    // Obtener datos del proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, presupuesto_original, presupuesto_final, budget')
      .eq('id', projectId)
      .single();

    console.log('📊 Project data:', project);
    console.log('❌ Project error:', projectError);

    if (projectError) {
      return NextResponse.json({ error: 'Error fetching project', details: projectError }, { status: 500 });
    }

    console.log('📋 Fetching change orders...');
    // Obtener órdenes de cambio
    const { data: changeOrders, error: changeOrdersError } = await supabase
      .from('change_orders')
      .select('id, title, amount, cost_impact, cost_impact_crc, status, impact_type')
      .eq('project_id', projectId);

    console.log('📋 Change orders data:', changeOrders);
    console.log('❌ Change orders error:', changeOrdersError);

    if (changeOrdersError) {
      return NextResponse.json({ error: 'Error fetching change orders', details: changeOrdersError }, { status: 500 });
    }

    // Filtrar órdenes implementadas
    const implementedOrders = changeOrders?.filter(order => order.status === 'implementado') || [];
    console.log('✅ Implemented orders:', implementedOrders);

    // Calcular el presupuesto final basado en las órdenes de cambio
    let calculatedFinalBudget = project.presupuesto_original || 0;
    
    if (changeOrders && changeOrders.length > 0) {
      const totalChangeOrderImpact = changeOrders.reduce((total, order) => {
        // Usar cost_impact_crc como el impacto principal
        let impact = order.cost_impact_crc || order.cost_impact || order.amount || 0;
        
        // Si es un impacto negativo, hacer el valor negativo
        if (order.impact_type === 'negativo') {
          impact = -Math.abs(impact);
        } else {
          impact = Math.abs(impact);
        }
        
        console.log(`📋 Order "${order.title}": ${impact} (type: ${order.impact_type})`);
        return total + impact;
      }, 0);
      
      calculatedFinalBudget += totalChangeOrderImpact;
      
      console.log('💰 Total change order impact:', totalChangeOrderImpact);
    }

    const originalBudget = project.presupuesto_original || project.budget || 0;
    const totalImpact = calculatedFinalBudget - originalBudget;

    console.log('🧮 Calculations:', {
      originalBudget,
      totalImpact,
      calculatedFinalBudget,
      currentFinalBudget: project.presupuesto_final
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        presupuesto_original: project.presupuesto_original,
        presupuesto_final: project.presupuesto_final,
        budget: project.budget
      },
      changeOrders: {
        total: changeOrders?.length || 0,
        implemented: implementedOrders.length,
        all: changeOrders,
        implementedDetails: implementedOrders
      },
      calculations: {
        originalBudget,
        totalImpact,
        calculatedFinalBudget,
        currentFinalBudget: project.presupuesto_final
      }
    });

  } catch (error) {
    console.error('❌ Debug budget error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}