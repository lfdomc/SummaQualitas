import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Project, CreateProjectData, UpdateProjectData, Client } from '@/types/database';

// Función para obtener cliente Supabase para el navegador
const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    // En el cliente, usar el cliente del navegador
    return createClient();
  } else {
    // En el servidor, usar el service role key
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
};

// Configuración de porcentajes por defecto para el desglose presupuestario
export const DEFAULT_BUDGET_PERCENTAGES = {
  costos_directos_materiales: 0.40, // 40%
  costos_directos_equipos: 0.15,    // 15%
  mano_obra_quincenal: 0.25,        // 25%
  gastos_administrativos: 0.08,     // 8%
  costos_indirectos: 0.07,          // 7%
  imprevistos: 0.05                 // 5%
};

/**
 * Calcula el desglose automático del presupuesto basado en porcentajes predefinidos
 */
export function calculateBudgetBreakdown(presupuestoInicial: number) {
  return {
    costos_directos_materiales: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.costos_directos_materiales),
    costos_directos_equipos: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.costos_directos_equipos),
    mano_obra_quincenal: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.mano_obra_quincenal),
    gastos_administrativos: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.gastos_administrativos),
    costos_indirectos: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.costos_indirectos),
    imprevistos: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.imprevistos)
  };
}

/**
 * Obtiene todos los proyectos con información de cliente
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Error al obtener proyectos');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProjects:', error);
    throw error;
  }
}

/**
 * Obtiene un proyecto por ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      throw new Error('Error al obtener proyecto');
    }

    if (!data) {
      return null;
    }

    // Normalizar campos de presupuesto y migrar si es necesario
    const normalizedProject = normalizeBudgetFields(data);
    
    // Si los campos fueron normalizados (diferentes del original), migrar en la base de datos
    if (normalizedProject.presupuesto_original !== data.presupuesto_original || 
        normalizedProject.presupuesto_final !== data.presupuesto_final) {
      const migratedProject = await migrateProjectBudgetFields(id);
      return migratedProject || normalizedProject;
    }

    return normalizedProject;
  } catch (error) {
    console.error('Error in getProjectById:', error);
    throw error;
  }
}

/**
 * Crea un nuevo proyecto con desglose automático del presupuesto
 */
export async function createProject(projectData: CreateProjectData): Promise<Project> {
  try {
    console.log('🔗 Verificando conexión a Supabase...');
    console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    console.log('📝 Datos recibidos para crear proyecto:', projectData);
    
    // Calcular desglose automático si se proporciona presupuesto inicial
    let budgetBreakdown = {};
    if (projectData.presupuesto_inicial && projectData.presupuesto_inicial > 0) {
      budgetBreakdown = calculateBudgetBreakdown(projectData.presupuesto_inicial);
      console.log('💰 Desglose presupuestario calculado:', budgetBreakdown);
    }

    // Calcular total del presupuesto
    const totalBudget = Object.values(budgetBreakdown).reduce((sum: number, value: unknown) => sum + (Number(value) || 0), 0);

    // Obtener el usuario actual para created_by usando el cliente regular
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    let createdBy = user?.id;
    
    // Si no hay usuario autenticado, usar UUID dummy
    if (!createdBy) {
      createdBy = '00000000-0000-0000-0000-000000000000';
    }

    // Calcular presupuesto basado en el desglose si está disponible
    const calculatedBudget: number = totalBudget > 0 ? totalBudget : 0;
    const finalBudget = calculatedBudget || projectData.presupuesto_inicial || 0;

    const projectToCreate = {
      ...projectData,
      ...budgetBreakdown,
      budget: finalBudget,
      // Establecer presupuesto_original: usar el presupuesto calculado, inicial o 0
      presupuesto_original: calculatedBudget > 0 
        ? calculatedBudget 
        : (projectData.presupuesto_inicial || 0),
      // Establecer presupuesto_final: usar el valor especificado, calculado, inicial o 0
      presupuesto_final: projectData.presupuesto_final 
        ? projectData.presupuesto_final
        : (calculatedBudget > 0 
          ? calculatedBudget 
          : (projectData.presupuesto_inicial || 0)),
      status: projectData.status || 'planificacion',
      created_by: createdBy
    };

    // Usar cliente regular de Supabase
    const { data, error } = await supabase
      .from('projects')
      .insert([projectToCreate])
      .select(`
        *,
        client:clients(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error detallado de Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      
      // Proporcionar mensajes de error más específicos
      let userFriendlyMessage = 'Error desconocido al crear proyecto';
      
      if (error.code === '23505') {
        userFriendlyMessage = 'Ya existe un proyecto con ese nombre';
      } else if (error.code === '23503') {
        userFriendlyMessage = 'El cliente seleccionado no existe';
      } else if (error.code === '42703') {
        userFriendlyMessage = 'Error en la estructura de la base de datos. Algunas columnas no existen.';
      } else if (error.code === '42501') {
        userFriendlyMessage = 'No tienes permisos para crear proyectos';
      } else if (error.message) {
        userFriendlyMessage = error.message;
      }
      
      throw new Error(userFriendlyMessage);
    }

    return data;
  } catch (error) {
    console.error('❌ Error general en createProject:', error);
    
    // Si es un error que ya procesamos, re-lanzarlo
    if (error instanceof Error) {
      throw error;
    }
    
    // Si es un error desconocido, crear un mensaje genérico
    throw new Error('Error inesperado al crear el proyecto. Por favor, inténtalo de nuevo.');
  }
}

/**
 * Actualiza un proyecto existente
 */
export async function updateProject(id: string, projectData: UpdateProjectData): Promise<Project> {
  try {
    // Obtener el proyecto actual para preservar presupuesto_original si no se está actualizando
    const currentProject = await getProjectById(id);
    if (!currentProject) {
      throw new Error('Proyecto no encontrado');
    }

    // Si se actualiza el presupuesto inicial, recalcular desglose
    let budgetBreakdown = {};
    if (projectData.presupuesto_inicial && projectData.presupuesto_inicial > 0) {
      budgetBreakdown = calculateBudgetBreakdown(projectData.presupuesto_inicial);
    }

    const projectToUpdate = {
      ...projectData,
      ...budgetBreakdown,
      // Si no existe presupuesto_original, establecerlo con el presupuesto_inicial actual o nuevo
      presupuesto_original: currentProject.presupuesto_original || projectData.presupuesto_inicial || currentProject.presupuesto_inicial || 0,
      // Si no se especifica presupuesto_final, mantener el actual o usar presupuesto_inicial
      presupuesto_final: projectData.presupuesto_final !== undefined ? projectData.presupuesto_final : 
                        (currentProject.presupuesto_final || projectData.presupuesto_inicial || currentProject.presupuesto_inicial || 0),
      updated_at: new Date().toISOString()
    };

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .update(projectToUpdate)
      .eq('id', id)
      .select(`
        *,
        client:clients(*)
      `)
      .single();

    if (error) {
      console.error('Error updating project:', error);
      throw new Error('Error al actualizar proyecto');
    }

    return data;
  } catch (error) {
    console.error('Error in updateProject:', error);
    throw error;
  }
}

/**
 * Elimina un proyecto
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    // Verificar que el usuario esté autenticado
    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      
      // Proporcionar mensajes de error más específicos
      if (error.code === '42501' || error.message.includes('permission')) {
        throw new Error('No tienes permisos para eliminar este proyecto');
      }
      
      throw new Error('Error al eliminar proyecto: ' + error.message);
    }
  } catch (error) {
    console.error('Error in deleteProject:', error);
    throw error;
  }
}

/**
 * Obtiene todos los clientes
 */
export async function getActiveClients(): Promise<Client[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      throw new Error('Error al obtener clientes');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActiveClients:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de proyectos
 */
export async function getProjectStats() {
  try {
    const supabase = getSupabaseClient();
    const { data: projects, error } = await supabase
      .from('projects')
      .select('status, budget, presupuesto_inicial');

    if (error) {
      console.error('Error fetching project stats:', error);
      throw new Error('Error al obtener estadísticas');
    }

    const stats = {
      total: projects?.length || 0,
      active: projects?.filter(p => p.status === 'en_progreso').length || 0,
      completed: projects?.filter(p => p.status === 'completado').length || 0,
      cancelled: projects?.filter(p => p.status === 'cancelado').length || 0,
      total_budget: projects?.reduce((sum: number, p: { budget?: number; presupuesto_inicial?: number }) => {
        const budget = Number(p.budget || p.presupuesto_inicial || 0);
        return sum + budget;
      }, 0) || 0
    };

    return stats;
  } catch (error) {
    console.error('Error in getProjectStats:', error);
    throw error;
  }
}