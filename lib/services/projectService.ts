import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Project, CreateProjectData, Client } from '@/types/database';
import { UpdateProjectDTO } from '@/lib/types';
import { normalizeBudgetFields, migrateProjectBudgetFields } from '@/lib/utils/budget-migration';

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
  costos_directos: 0.40,    // 40%
  costos_indirectos: 0.20,  // 20%
  mano_obra: 0.25,          // 25%
  administracion: 0.08,     // 8%
  imprevistos: 0.05,        // 5%
  utilidad: 0.02            // 2%
};

/**
 * Calcula el desglose automático del presupuesto basado en porcentajes predefinidos
 */
export function calculateBudgetBreakdown(presupuestoInicial: number) {
  return {
    costos_directos: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.costos_directos),
    costos_indirectos: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.costos_indirectos),
    mano_obra: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.mano_obra),
    administracion: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.administracion),
    imprevistos: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.imprevistos),
    utilidad: Math.round(presupuestoInicial * DEFAULT_BUDGET_PERCENTAGES.utilidad)
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
    const normalizedProject = await normalizeBudgetFields(data);
    
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
 * Crea un nuevo proyecto con todos los campos del formulario
 */
export async function createProject(projectData: CreateProjectData): Promise<Project> {
  try {
    console.log('🔗 Verificando conexión a Supabase...');
    console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    console.log('📝 Datos recibidos para crear proyecto:', projectData);
    
    // Obtener el cliente de Supabase
    const supabase = getSupabaseClient();

    // Crear objeto con todos los campos del formulario
    const projectToCreate = {
      // Campos básicos
      name: projectData.name,
      description: projectData.description || '',
      client_id: projectData.client_id || null,
      manager_id: projectData.manager_id || null,
      status: projectData.status || 'planificacion',
      location: projectData.location || '',
      
      // Campos de área y tipo de cambio
      total_area: projectData.total_area || null,
      exchange_rate_usd: projectData.exchange_rate_usd || 520,
      
      // Campos de presupuesto principal
      presupuesto_inicial: projectData.presupuesto_inicial || 0,
      budget: projectData.budget || projectData.presupuesto_inicial || 0,
      
      // Campos de desglose presupuestario
      costos_directos: projectData.costos_directos || 0,
      costos_indirectos: projectData.costos_indirectos || 0,
      mano_obra: projectData.mano_obra || 0,
      administracion: projectData.administracion || 0,
      imprevistos: projectData.imprevistos || 0,
      utilidad: projectData.utilidad || 0,
      
      // Fechas
      estimated_start_date: projectData.estimated_start_date || null,
      estimated_end_date: projectData.estimated_end_date || null,
      actual_start_date: projectData.actual_start_date || null,
      actual_end_date: projectData.actual_end_date || null
    };

    console.log('📝 Proyecto a crear (todos los campos):', projectToCreate);

    // Usar cliente regular de Supabase
    const { data, error } = await supabase
      .from('projects')
      .insert([projectToCreate])
      .select(`
        *,
        client:clients(id, name, email, phone)
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
        userFriendlyMessage = 'Error en la estructura de la base de datos. Algunas columnas no existen. Por favor, ejecuta el script SQL en Supabase primero.';
      } else if (error.code === '42501') {
        userFriendlyMessage = 'No tienes permisos para crear proyectos';
      } else if (error.message) {
        userFriendlyMessage = error.message;
      }
      
      throw new Error(userFriendlyMessage);
    }

    console.log('✅ Proyecto creado exitosamente:', data);
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
export async function updateProject(id: string, projectData: UpdateProjectDTO): Promise<Project> {
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
      .select('status, budget');

    if (error) {
      console.error('Error fetching project stats:', error);
      throw new Error('Error al obtener estadísticas');
    }

    const stats = {
      total: projects?.length || 0,
      active: projects?.filter(p => p.status === 'en_progreso').length || 0,
      completed: projects?.filter(p => p.status === 'completado').length || 0,
      cancelled: projects?.filter(p => p.status === 'cancelado').length || 0,
      total_budget: projects?.reduce((sum: number, p: { budget?: number }) => {
        const budget = Number(p.budget || 0);
        return sum + budget;
      }, 0) || 0
    };

    return stats;
  } catch (error) {
    console.error('Error in getProjectStats:', error);
    throw error;
  }
}