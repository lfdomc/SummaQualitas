import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateEquipmentRentalData } from '@/types/database';

// GET - Obtener alquiler específico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(request);
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del alquiler es requerido' },
        { status: 400 }
      );
    }
    
    const { data: rental, error } = await supabase
      .from('equipment_rentals')
      .select(`
        *,
        equipment:equipment_id(
          id,
          name,
          category,
          brand,
          model,
          daily_rental_rate,
          status
        ),
        project:project_id(
          id,
          name,
          status,
          start_date,
          end_date
        ),
        created_by_user:created_by(
          id,
          email,
          full_name
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching equipment rental:', error);
      return NextResponse.json(
        { success: false, error: 'Alquiler no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: rental
    });
    
  } catch (error) {
    console.error('Error in equipment rental GET by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar alquiler específico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(request);
    const { id } = params;
    const body: UpdateEquipmentRentalData = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del alquiler es requerido' },
        { status: 400 }
      );
    }
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener alquiler actual
    const { data: currentRental, error: currentError } = await supabase
      .from('equipment_rentals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (currentError || !currentRental) {
      return NextResponse.json(
        { success: false, error: 'Alquiler no encontrado' },
        { status: 404 }
      );
    }
    
    // Recalcular costo total si se actualizan fechas o tarifa
    let updateData = { ...body };
    
    if (body.end_date || body.daily_rate || body.planned_end_date) {
      const startDate = new Date(currentRental.start_date);
      const endDate = new Date(
        body.end_date || 
        body.planned_end_date || 
        currentRental.planned_end_date || 
        new Date()
      );
      const dailyRate = body.daily_rate || currentRental.daily_rate;
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      updateData.total_days = totalDays;
      updateData.total_cost = totalDays * dailyRate;
    }
    
    const rentalData = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    const { data: rental, error } = await supabase
      .from('equipment_rentals')
      .update(rentalData)
      .eq('id', id)
      .select(`
        *,
        equipment:equipment_id(
          id,
          name,
          category,
          brand,
          model,
          daily_rental_rate,
          status
        ),
        project:project_id(
          id,
          name,
          status
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating equipment rental:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar alquiler' },
        { status: 500 }
      );
    }
    
    // Si se completa o cancela el alquiler, actualizar estado del equipo
    if (body.status === 'completed' || body.status === 'cancelled') {
      const { error: updateError } = await supabase
        .from('equipment')
        .update({ 
          status: 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentRental.equipment_id);
      
      if (updateError) {
        console.error('Error updating equipment status:', updateError);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: rental,
      message: 'Alquiler actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error in equipment rental PUT by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar/cancelar alquiler
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(request);
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del alquiler es requerido' },
        { status: 400 }
      );
    }
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener alquiler actual
    const { data: currentRental, error: currentError } = await supabase
      .from('equipment_rentals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (currentError || !currentRental) {
      return NextResponse.json(
        { success: false, error: 'Alquiler no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el alquiler puede ser eliminado
    if (currentRental.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar un alquiler completado' },
        { status: 400 }
      );
    }
    
    // Soft delete - marcar como cancelado en lugar de eliminar
    const { data: rental, error } = await supabase
      .from('equipment_rentals')
      .update({
        status: 'cancelled',
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: currentRental.notes ? 
          `${currentRental.notes}\n\nAlquiler cancelado el ${new Date().toLocaleDateString()}` :
          `Alquiler cancelado el ${new Date().toLocaleDateString()}`
      })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error cancelling equipment rental:', error);
      return NextResponse.json(
        { success: false, error: 'Error al cancelar alquiler' },
        { status: 500 }
      );
    }
    
    // Liberar el equipo
    const { error: updateError } = await supabase
      .from('equipment')
      .update({ 
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentRental.equipment_id);
    
    if (updateError) {
      console.error('Error updating equipment status:', updateError);
    }
    
    return NextResponse.json({
      success: true,
      data: rental,
      message: 'Alquiler cancelado exitosamente'
    });
    
  } catch (error) {
    console.error('Error in equipment rental DELETE by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}