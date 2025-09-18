import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EquipmentRental, CreateEquipmentRentalData, UpdateEquipmentRentalData } from '@/types/database';

// GET - Obtener todos los alquileres de equipos
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { searchParams } = new URL(request.url);
    
    // Parámetros de filtrado
    const equipment_id = searchParams.get('equipment_id');
    const project_id = searchParams.get('project_id');
    const status = searchParams.get('status');
    const start_date_from = searchParams.get('start_date_from');
    const start_date_to = searchParams.get('start_date_to');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query = supabase
      .from('equipment_rental')
      .select(`
        *,
        equipment:equipment_id(id, name, category, status, daily_rental_rate),
        project:project_id(id, name, status)
      `)
      .order('created_at', { ascending: false });
    
    // Aplicar filtros
    if (equipment_id) {
      query = query.eq('equipment_id', equipment_id);
    }
    
    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (start_date_from) {
      query = query.gte('start_date', start_date_from);
    }
    
    if (start_date_to) {
      query = query.lte('start_date', start_date_to);
    }
    
    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data: rentals, error, count } = await query;
    
    if (error) {
      console.error('Error fetching equipment rentals:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener alquileres' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: rentals,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in equipment rentals GET:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo alquiler de equipo
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const body: CreateEquipmentRentalData = await request.json();
    
    // Validaciones básicas
    if (!body.equipment_id || !body.project_id || !body.start_date) {
      return NextResponse.json(
        { success: false, error: 'Equipo, proyecto y fecha de inicio son requeridos' },
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
    
    // Verificar que el equipo existe y está disponible
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, name, status, daily_rental_rate')
      .eq('id', body.equipment_id)
      .eq('is_active', true)
      .single();
    
    if (equipmentError || !equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }
    
    if (equipment.status !== 'available') {
      return NextResponse.json(
        { success: false, error: 'El equipo no está disponible para alquiler' },
        { status: 400 }
      );
    }
    
    // Verificar que el proyecto existe
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('id', body.project_id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }
    
    // Usar la tarifa del equipo (permitir override si se especifica)
    const dailyRate = body.daily_rate || equipment.daily_rental_rate;
    
    if (!dailyRate || dailyRate <= 0) {
      return NextResponse.json(
        { success: false, error: 'El equipo debe tener una tarifa diaria válida' },
        { status: 400 }
      );
    }
    
    // Calcular días y costo total si se proporciona fecha de fin
    let totalDays: number | undefined;
    let totalCost: number | undefined;
    
    if (body.planned_end_date) {
      const startDate = new Date(body.start_date);
      const endDate = new Date(body.planned_end_date);
      totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      totalCost = totalDays * dailyRate;
    }
    
    // Crear alquiler
    const rentalData = {
      equipment_id: body.equipment_id,
      project_id: body.project_id,
      start_date: body.start_date,
      planned_end_date: body.planned_end_date || null,
      daily_rate: dailyRate,
      total_days: totalDays,
      total_cost: totalCost,
      status: 'active',
      notes: body.notes || null,
      created_by: user.id
    };
    
    const { data: rental, error } = await supabase
      .from('equipment_rental')
      .insert([rentalData])
      .select(`
        *,
        equipment:equipment_id(id, name, category, status, daily_rental_rate),
        project:project_id(id, name, status)
      `)
      .single();
    
    if (error) {
      console.error('Error creating equipment rental:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear alquiler' },
        { status: 500 }
      );
    }
    
    // Actualizar estado del equipo a 'rented'
    const { error: updateError } = await supabase
      .from('equipment')
      .update({ status: 'rented' })
      .eq('id', body.equipment_id);
    
    if (updateError) {
      console.error('Error updating equipment status:', updateError);
      // No retornamos error aquí porque el alquiler ya se creó
    }
    
    return NextResponse.json({
      success: true,
      data: rental,
      message: 'Alquiler creado exitosamente'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in equipment rental POST:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar alquiler
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const body: UpdateEquipmentRentalData & { id: string } = await request.json();
    
    if (!body.id) {
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
      .select('*, equipment:equipment_id(id, name)')
      .eq('id', body.id)
      .single();
    
    if (currentError || !currentRental) {
      return NextResponse.json(
        { success: false, error: 'Alquiler no encontrado' },
        { status: 404 }
      );
    }
    
    const { id, ...updateData } = body;
    
    // Recalcular costo total si se actualizan fechas o tarifa
    if (updateData.end_date || updateData.daily_rate) {
      const startDate = new Date(currentRental.start_date);
      const endDate = new Date(updateData.end_date || currentRental.planned_end_date || new Date());
      const dailyRate = updateData.daily_rate || currentRental.daily_rate;
      
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
          daily_rental_rate
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
    
    // Si se completa el alquiler, actualizar estado del equipo
    if (updateData.status === 'completed') {
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
    console.error('Error in equipment rental PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}