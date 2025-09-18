import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const rentalId = params.id;
    
    // Validaciones básicas
    if (!body.end_date) {
      return NextResponse.json(
        { success: false, error: 'La fecha de fin es requerida' },
        { status: 400 }
      );
    }
    
    // Obtener el alquiler actual
    const { data: rental, error: rentalError } = await supabase
      .from('equipment_rental')
      .select(`
        *,
        equipment:equipment_id(id, name, daily_rental_rate)
      `)
      .eq('id', rentalId)
      .eq('status', 'active')
      .single();
    
    if (rentalError || !rental) {
      return NextResponse.json(
        { success: false, error: 'Alquiler no encontrado o ya finalizado' },
        { status: 404 }
      );
    }
    
    // Calcular días reales y costo final
    const startDate = new Date(rental.start_date);
    const endDate = new Date(body.end_date);
    
    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, error: 'La fecha de fin no puede ser anterior a la fecha de inicio' },
        { status: 400 }
      );
    }
    
    const actualDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const finalCost = actualDays * rental.daily_rate;
    
    // Actualizar el alquiler
    const { data: updatedRental, error: updateError } = await supabase
      .from('equipment_rental')
      .update({
        end_date: body.end_date,
        actual_days: actualDays,
        final_cost: finalCost,
        status: 'completed',
        notes: body.notes ? `${rental.notes || ''}\n\nFinalización: ${body.notes}` : rental.notes
      })
      .eq('id', rentalId)
      .select(`
        *,
        equipment:equipment_id(id, name, category),
        project:project_id(id, name)
      `)
      .single();
    
    if (updateError) {
      console.error('Error updating rental:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al finalizar el alquiler' },
        { status: 500 }
      );
    }
    
    // Actualizar estado del equipo a 'available'
    const { error: equipmentUpdateError } = await supabase
      .from('equipment')
      .update({ status: 'available' })
      .eq('id', rental.equipment_id);
    
    if (equipmentUpdateError) {
      console.error('Error updating equipment status:', equipmentUpdateError);
      // No retornamos error aquí porque el alquiler ya se finalizó
    }
    
    return NextResponse.json({
      success: true,
      data: {
        rental: updatedRental,
        summary: {
          planned_days: rental.total_days,
          actual_days: actualDays,
          planned_cost: rental.total_cost,
          final_cost: finalCost,
          difference: finalCost - (rental.total_cost || 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Error in end rental endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}