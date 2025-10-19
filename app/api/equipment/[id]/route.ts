import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateEquipmentData } from '@/types/database';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Obtener equipo por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient(request);
    const { id } = params;
    
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Equipo no encontrado' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching equipment:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener equipo' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: equipment
    });
    
  } catch (error) {
    console.error('Error in equipment GET by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar equipo específico
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient(request);
    const { id } = params;
    const body: UpdateEquipmentData = await request.json();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar que el equipo existe
    const { data: existingEquipment, error: checkError } = await supabase
      .from('equipment')
      .select('id')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (checkError || !existingEquipment) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }
    
    const equipmentData = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    const { data: equipment, error } = await supabase
      .from('equipment')
      .update(equipmentData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating equipment:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar equipo' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: equipment,
      message: 'Equipo actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error in equipment PUT by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar equipo específico
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient(request);
    const { id } = params;
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar que el equipo existe
    const { data: existingEquipment, error: checkError } = await supabase
      .from('equipment')
      .select('id, name')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (checkError || !existingEquipment) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el equipo está siendo usado en alquileres activos
    const { data: activeRentals, error: rentalError } = await supabase
      .from('equipment_rentals')
      .select('id')
      .eq('equipment_id', id)
      .eq('status', 'active');
    
    if (rentalError) {
      console.error('Error checking active rentals:', rentalError);
      return NextResponse.json(
        { success: false, error: 'Error al verificar alquileres activos' },
        { status: 500 }
      );
    }
    
    if (activeRentals && activeRentals.length > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar un equipo con alquileres activos' },
        { status: 400 }
      );
    }
    
    // Soft delete
    const { data: equipment, error } = await supabase
      .from('equipment')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error deleting equipment:', error);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar equipo' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: equipment,
      message: 'Equipo eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error in equipment DELETE by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}