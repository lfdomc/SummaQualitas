import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Obtener estadísticas de equipos y gastos mensuales
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const { searchParams } = new URL(request.url);
    
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const project_id = searchParams.get('project_id');
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Calcular fechas del mes
    const startOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];
    
    // Obtener estadísticas de equipos
    const { data: equipmentStats, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, name, category, status, daily_rental_rate');
    
    if (equipmentError) {
      console.error('Error fetching equipment stats:', equipmentError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener estadísticas de equipos' },
        { status: 500 }
      );
    }
    
    // Obtener alquileres activos
    const { data: activeRentals, error: rentalsError } = await supabase
      .from('equipment_rentals')
      .select(`
        *,
        equipment:equipment_id(id, name, category),
        project:project_id(id, name)
      `)
      .eq('status', 'active');
    
    if (rentalsError) {
      console.error('Error fetching active rentals:', rentalsError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener alquileres activos' },
        { status: 500 }
      );
    }
    
    // Los gastos mensuales se calculan desde equipment_rentals más abajo
    
    // Estadísticas de alquileres del mes
    let rentalsQuery = supabase
      .from('equipment_rentals')
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
      `)
      .or(`start_date.lte.${endOfMonth},end_date.gte.${startOfMonth},and(start_date.lte.${endOfMonth},end_date.is.null)`);
    
    if (project_id) {
      rentalsQuery = rentalsQuery.eq('project_id', project_id);
    }
    
    const { data: rentals, error: rentalsQueryError } = await rentalsQuery;
    
    if (rentalsQueryError) {
      console.error('Error fetching rentals stats:', rentalsQueryError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener estadísticas de alquileres' },
        { status: 500 }
      );
    }
    
    // Calcular estadísticas
    const equipment = equipmentStats || [];
    const equipmentStatsCalculated = {
      total: equipment?.length || 0,
      available: equipment?.filter(e => e.status === 'available').length || 0,
      rented: equipment?.filter(e => e.status === 'rented').length || 0,
      maintenance: equipment?.filter(e => e.status === 'maintenance').length || 0,
      out_of_service: equipment?.filter(e => e.status === 'out_of_service').length || 0
    };
    
    // Calcular gastos mensuales
    let totalMonthlyExpense = 0;
    const expensesByCategory: Record<string, number> = {};
    const expensesByProject: Record<string, { name: string; total: number }> = {};
    const dailyExpenses: Record<string, number> = {};
    
    rentals?.forEach(rental => {
      if (!rental.daily_rate) return;
      
      // Calcular días del alquiler que caen en el mes consultado
      const rentalStart = new Date(rental.start_date);
      const rentalEnd = rental.end_date ? new Date(rental.end_date) : new Date();
      const monthStart = new Date(startOfMonth);
      const monthEnd = new Date(endOfMonth);
      
      const effectiveStart = rentalStart > monthStart ? rentalStart : monthStart;
      const effectiveEnd = rentalEnd < monthEnd ? rentalEnd : monthEnd;
      
      if (effectiveStart <= effectiveEnd) {
        const daysInMonth = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const monthlyExpense = daysInMonth * rental.daily_rate;
        
        totalMonthlyExpense += monthlyExpense;
        
        // Por categoría
        const category = rental.equipment?.category || 'Sin categoría';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + monthlyExpense;
        
        // Por proyecto
        if (rental.project) {
          const projectKey = rental.project.id;
          if (!expensesByProject[projectKey]) {
            expensesByProject[projectKey] = {
              name: rental.project.name,
              total: 0
            };
          }
          expensesByProject[projectKey].total += monthlyExpense;
        }
        
        // Por día (para gráficos)
        for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
          const dayKey = d.toISOString().split('T')[0];
          dailyExpenses[dayKey] = (dailyExpenses[dayKey] || 0) + rental.daily_rate;
        }
      }
    });
    
    // Estadísticas de alquileres
    const rentalStats = {
      total: rentals?.length || 0,
      active: rentals?.filter(r => r.status === 'active').length || 0,
      completed: rentals?.filter(r => r.status === 'completed').length || 0,
      cancelled: rentals?.filter(r => r.status === 'cancelled').length || 0
    };
    
    // Top equipos más rentados
    const equipmentUsage: Record<string, { name: string; category: string; count: number; revenue: number }> = {};
    
    rentals?.forEach(rental => {
      if (rental.equipment) {
        const equipmentId = rental.equipment.id;
        if (!equipmentUsage[equipmentId]) {
          equipmentUsage[equipmentId] = {
            name: rental.equipment.name,
            category: rental.equipment.category,
            count: 0,
            revenue: 0
          };
        }
        equipmentUsage[equipmentId].count++;
        equipmentUsage[equipmentId].revenue += rental.total_cost || 0;
      }
    });
    
    const topEquipment = Object.entries(equipmentUsage)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Los gastos mensuales se calculan desde los alquileres activos
    
    return NextResponse.json({
      success: true,
      data: {
        period: {
          year,
          month,
          monthName: new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long' }),
          startDate: startOfMonth,
          endDate: endOfMonth
        },
        equipment: equipmentStatsCalculated,
        rentals: rentalStats,
        activeRentals: activeRentals || [],
        expenses: {
          total: totalMonthlyExpense,
          byCategory: expensesByCategory,
          byProject: expensesByProject,
          daily: dailyExpenses,
          topEquipment
        }
      }
    });
    
  } catch (error) {
    console.error('Error in equipment stats GET endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}