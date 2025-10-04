import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface MonthlyExpenseUpdateData {
  updated_at: string;
  maintenance_cost?: number;
  fuel_cost?: number;
  insurance_cost?: number;
  other_costs?: number;
  notes?: string;
  total_amount: number;
}

// GET - Obtener gastos mensuales de equipos
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { searchParams } = new URL(request.url);
    
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const project_id = searchParams.get('project_id');
    const equipment_id = searchParams.get('equipment_id');
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Construir query base
    let query = supabase
      .from('equipment_monthly_expenses')
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
          name
        )
      `);
    
    // Aplicar filtros
    if (year) {
      query = query.eq('year', year);
    }
    if (month) {
      query = query.eq('month', month);
    }
    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    if (equipment_id) {
      query = query.eq('equipment_id', equipment_id);
    }
    
    const { data: expenses, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching monthly expenses:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener gastos mensuales' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: expenses || []
    });
    
  } catch (error) {
    console.error('Error in monthly expenses GET:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo gasto mensual
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      equipment_id,
      project_id,
      year,
      month,
      maintenance_cost = 0,
      fuel_cost = 0,
      insurance_cost = 0,
      other_costs = 0,
      notes = ''
    } = body;
    
    // Validaciones
    if (!equipment_id || !project_id) {
      return NextResponse.json(
        { success: false, error: 'equipment_id y project_id son requeridos' },
        { status: 400 }
      );
    }
    
    if (!year || !month || year < 2020 || year > 2030 || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Año y mes inválidos' },
        { status: 400 }
      );
    }
    
    // Calcular total
    const total_amount = maintenance_cost + fuel_cost + insurance_cost + other_costs;
    
    // Verificar si ya existe un registro para este equipo, proyecto, año y mes
    const { data: existing, error: existingError } = await supabase
      .from('equipment_monthly_expenses')
      .select('id')
      .eq('equipment_id', equipment_id)
      .eq('project_id', project_id)
      .eq('year', year)
      .eq('month', month)
      .single();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing expense:', existingError);
      return NextResponse.json(
        { success: false, error: 'Error al verificar gastos existentes' },
        { status: 500 }
      );
    }
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un registro de gastos para este equipo, proyecto y período' },
        { status: 409 }
      );
    }
    
    // Crear el registro de gasto mensual
    const expenseData = {
      equipment_id,
      project_id,
      year,
      month,
      maintenance_cost,
      fuel_cost,
      insurance_cost,
      other_costs,
      total_amount,
      notes,
      created_by: user.id
    };
    
    const { data: newExpense, error: insertError } = await supabase
      .from('equipment_monthly_expenses')
      .insert([expenseData])
      .select(`
        *,
        equipment:equipment_id(
          id,
          name,
          category
        ),
        project:project_id(
          id,
          name
        )
      `)
      .single();
    
    if (insertError) {
      console.error('Error creating monthly expense:', insertError);
      return NextResponse.json(
        { success: false, error: 'Error al crear el gasto mensual' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: newExpense,
      message: 'Gasto mensual creado exitosamente'
    });
    
  } catch (error) {
    console.error('Error in monthly expenses POST:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar gasto mensual existente
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      id,
      maintenance_cost,
      fuel_cost,
      insurance_cost,
      other_costs,
      notes
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }
    
    // Calcular nuevo total
    const total_amount = (maintenance_cost || 0) + (fuel_cost || 0) + (insurance_cost || 0) + (other_costs || 0);
    
    const updateData: Partial<MonthlyExpenseUpdateData> = {
      updated_at: new Date().toISOString()
    };
    
    if (maintenance_cost !== undefined) updateData.maintenance_cost = maintenance_cost;
    if (fuel_cost !== undefined) updateData.fuel_cost = fuel_cost;
    if (insurance_cost !== undefined) updateData.insurance_cost = insurance_cost;
    if (other_costs !== undefined) updateData.other_costs = other_costs;
    if (notes !== undefined) updateData.notes = notes;
    updateData.total_amount = total_amount;
    
    const { data: updatedExpense, error: updateError } = await supabase
      .from('equipment_monthly_expenses')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        equipment:equipment_id(
          id,
          name,
          category
        ),
        project:project_id(
          id,
          name
        )
      `)
      .single();
    
    if (updateError) {
      console.error('Error updating monthly expense:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el gasto mensual' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedExpense,
      message: 'Gasto mensual actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error in monthly expenses PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar gasto mensual
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }
    
    const { error: deleteError } = await supabase
      .from('equipment_monthly_expenses')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting monthly expense:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el gasto mensual' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Gasto mensual eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error in monthly expenses DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}