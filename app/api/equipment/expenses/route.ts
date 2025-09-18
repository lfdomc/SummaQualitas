import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET - Obtener gastos mensuales
export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const equipmentId = searchParams.get('equipment_id');
    const projectId = searchParams.get('project_id');
    
    let query = supabase
      .from('equipment_monthly_expenses')
      .select(`
        *,
        equipment:equipment_id(id, name, category),
        project:project_id(id, name)
      `)
      .eq('year', year)
      .order('month', { ascending: false });
    
    if (month) {
      query = query.eq('month', month);
    }
    
    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId);
    }
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data: expenses, error } = await query;
    
    if (error) {
      console.error('Error fetching equipment expenses:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener gastos de equipos' },
        { status: 500 }
      );
    }
    
    // Calcular totales
    const totalAmount = expenses?.reduce((sum, expense) => sum + (expense.total_amount || 0), 0) || 0;
    const totalDays = expenses?.reduce((sum, expense) => sum + (expense.total_days || 0), 0) || 0;
    
    // Agrupar por mes
    const byMonth = expenses?.reduce((acc, expense) => {
      const monthKey = `${expense.year}-${expense.month.toString().padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: expense.month,
          year: expense.year,
          total_amount: 0,
          total_days: 0,
          expenses: []
        };
      }
      acc[monthKey].total_amount += expense.total_amount || 0;
      acc[monthKey].total_days += expense.total_days || 0;
      acc[monthKey].expenses.push(expense);
      return acc;
    }, {} as Record<string, any>) || {};
    
    return NextResponse.json({
      success: true,
      data: {
        expenses: expenses || [],
        summary: {
          total_amount: totalAmount,
          total_days: totalDays,
          count: expenses?.length || 0
        },
        by_month: byMonth
      }
    });
    
  } catch (error) {
    console.error('Error in equipment expenses GET endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear/actualizar gasto mensual
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
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
    
    // Validaciones básicas
    if (!body.equipment_id || !body.project_id || !body.year || !body.month) {
      return NextResponse.json(
        { success: false, error: 'equipment_id, project_id, year y month son requeridos' },
        { status: 400 }
      );
    }
    
    if (body.month < 1 || body.month > 12) {
      return NextResponse.json(
        { success: false, error: 'El mes debe estar entre 1 y 12' },
        { status: 400 }
      );
    }
    
    // Verificar que el equipo existe
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, name, daily_rental_rate')
      .eq('id', body.equipment_id)
      .single();
    
    if (equipmentError || !equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar que el proyecto existe
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', body.project_id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si ya existe un registro para este equipo, proyecto, año y mes
    const { data: existingExpense } = await supabase
      .from('equipment_monthly_expenses')
      .select('id')
      .eq('equipment_id', body.equipment_id)
      .eq('project_id', body.project_id)
      .eq('year', body.year)
      .eq('month', body.month)
      .single();
    
    const expenseData = {
      equipment_id: body.equipment_id,
      project_id: body.project_id,
      year: body.year,
      month: body.month,
      total_days: body.total_days || 0,
      daily_rate: body.daily_rate || equipment.daily_rental_rate,
      total_amount: body.total_amount || ((body.total_days || 0) * (body.daily_rate || equipment.daily_rental_rate)),
      notes: body.notes || null,
      created_by: user.id
    };
    
    let result;
    
    if (existingExpense) {
      // Actualizar registro existente
      const { data, error } = await supabase
        .from('equipment_monthly_expenses')
        .update(expenseData)
        .eq('id', existingExpense.id)
        .select(`
          *,
          equipment:equipment_id(id, name, category),
          project:project_id(id, name)
        `)
        .single();
      
      if (error) {
        console.error('Error updating equipment expense:', error);
        return NextResponse.json(
          { success: false, error: 'Error al actualizar el gasto del equipo' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Crear nuevo registro
      const { data, error } = await supabase
        .from('equipment_monthly_expenses')
        .insert(expenseData)
        .select(`
          *,
          equipment:equipment_id(id, name, category),
          project:project_id(id, name)
        `)
        .single();
      
      if (error) {
        console.error('Error creating equipment expense:', error);
        return NextResponse.json(
          { success: false, error: 'Error al crear el gasto del equipo' },
          { status: 500 }
        );
      }
      
      result = data;
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error in equipment expenses POST endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}