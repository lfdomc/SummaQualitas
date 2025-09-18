import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Equipment, CreateEquipmentData, UpdateEquipmentData } from '@/types/database';

// GET - Obtener todos los equipos
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { searchParams } = new URL(request.url);
    
    // Parámetros de filtrado
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const condition = searchParams.get('condition');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query = supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (condition && condition !== 'all') {
      query = query.eq('condition', condition);
    }
    
    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data: equipment, error, count } = await query;
    
    if (error) {
      console.error('Error fetching equipment:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener equipos' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: equipment,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in equipment GET:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo equipo
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const body: CreateEquipmentData = await request.json();
    
    // Validaciones básicas
    if (!body.name || !body.daily_rental_rate) {
      return NextResponse.json(
        { success: false, error: 'Nombre y tarifa diaria son requeridos' },
        { status: 400 }
      );
    }

    if (body.daily_rental_rate <= 0) {
      return NextResponse.json(
        { success: false, error: 'La tarifa diaria debe ser mayor a 0' },
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
    
    // Crear equipo
    const equipmentData = {
      name: body.name,
      description: body.description || null,
      category: body.category || null,
      daily_rental_rate: body.daily_rental_rate || 0,
      status: body.status || 'available',
      condition: body.condition || 'good',
      is_active: body.is_active !== false,
      created_by: user.id
    };
    
    const { data: equipment, error } = await supabase
      .from('equipment')
      .insert([equipmentData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating equipment:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear equipo' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: equipment,
      message: 'Equipo creado exitosamente'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in equipment POST:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar equipo
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const body: UpdateEquipmentData & { id: string } = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID del equipo es requerido' },
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
    
    const { id, ...updateData } = body;
    const equipmentData = {
      ...updateData,
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
    console.error('Error in equipment PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar equipo (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del equipo es requerido' },
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
    console.error('Error in equipment DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}