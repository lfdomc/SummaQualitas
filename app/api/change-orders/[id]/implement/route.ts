import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST - Implementar una orden de cambio
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient(request);
    const { id } = await params;
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener la orden de cambio
    const { data: changeOrder, error: fetchError } = await supabase
      .from('change_orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !changeOrder) {
      return NextResponse.json(
        { success: false, error: 'Orden de cambio no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar que la orden esté en estado 'aprobado'
    if (changeOrder.status !== 'aprobado') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden implementar órdenes de cambio aprobadas' },
        { status: 400 }
      );
    }
    
    // Verificar que no esté ya implementada
    if (changeOrder.status === 'implementado') {
      return NextResponse.json(
        { success: false, error: 'Esta orden de cambio ya está implementada' },
        { status: 400 }
      );
    }
    
    // Obtener información del proyecto por separado
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, presupuesto_original, presupuesto_final, estimated_start_date, estimated_end_date')
      .eq('id', changeOrder.project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Proyecto asociado no encontrado' },
        { status: 404 }
      );
    }
    
    // Calcular nuevo presupuesto final
    const currentBudget = project.presupuesto_final || project.presupuesto_original || 0;
    const impactAmount = changeOrder.cost_impact_crc || changeOrder.cost_impact || 0;
    const budgetImpact = changeOrder.impact_type === 'positivo' ? impactAmount : -impactAmount;
    const newBudget = currentBudget + budgetImpact;
    
    // Calcular nuevas fechas si hay impacto en cronograma
    let newEndDate = project.estimated_end_date;
    if (changeOrder.schedule_impact && changeOrder.schedule_impact !== 0 && project.estimated_end_date) {
      const currentEndDate = new Date(project.estimated_end_date);
      currentEndDate.setDate(currentEndDate.getDate() + changeOrder.schedule_impact);
      newEndDate = currentEndDate.toISOString().split('T')[0];
    }
    
    // Iniciar transacción para actualizar tanto la orden como el proyecto
    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from('change_orders')
      .update({
        status: 'implementado',
        implementation_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (orderUpdateError) {
      console.error('Error updating change order status:', orderUpdateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el estado de la orden de cambio' },
        { status: 500 }
      );
    }
    
    // Actualizar el proyecto con el nuevo presupuesto y fechas
    const projectUpdateData: any = {
      presupuesto_final: newBudget,
      updated_at: new Date().toISOString()
    };
    
    if (newEndDate && newEndDate !== project.estimated_end_date) {
      projectUpdateData.estimated_end_date = newEndDate;
    }
    
    const { data: updatedProject, error: projectUpdateError } = await supabase
      .from('projects')
      .update(projectUpdateData)
      .eq('id', project.id)
      .select()
      .single();
    
    if (projectUpdateError) {
      console.error('Error updating project:', projectUpdateError);
      // Revertir el cambio en la orden de cambio
      await supabase
        .from('change_orders')
        .update({
          status: 'aprobado',
          implementation_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el proyecto' },
        { status: 500 }
      );
    }
    
    // Obtener la orden actualizada
    const { data: finalOrder, error: finalFetchError } = await supabase
      .from('change_orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (finalFetchError) {
      console.error('Error fetching updated change order:', finalFetchError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        changeOrder: finalOrder || updatedOrder,
        project: updatedProject,
        budgetChange: changeOrder.budget_impact,
        scheduleChange: changeOrder.schedule_impact,
        newBudget: newBudget,
        newEndDate: newEndDate
      },
      message: 'Orden de cambio implementada exitosamente'
    });
    
  } catch (error) {
    console.error('Error in change order implementation API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}