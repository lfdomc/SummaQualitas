import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Project, CreateProjectDTO, UpdateProjectDTO } from '@/lib/types';
import type { Client } from '@/types/database';
import { normalizeBudgetFields, migrateProjectBudgetFields } from '@/lib/utils/budget-migration';

// Helper para crear el cliente correcto según el entorno (cliente o servidor)
async function getSupabaseClient(): Promise<SupabaseClient> {
  // En el navegador, usar el cliente de browser
  if (typeof window !== 'undefined') {
    const supabase = createClient();
    return supabase as unknown as SupabaseClient;
  }

  // En el servidor, usar el cliente de server con cookies() de Next
  try {
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    return supabase as unknown as SupabaseClient;
  } catch (e) {
    // Fallback al cliente regular (anon) si hay algún problema importando el cliente de servidor
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
}

/**
 * Obtiene todos los proyectos con información de cliente
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Error al obtener proyectos');
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene un proyecto por ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
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
    throw error;
  }
}

/**
 * Crea un nuevo proyecto con migración de presupuesto
 */
export async function createProject(projectData: CreateProjectDTO): Promise<Project> {
  try {
    const supabase = await getSupabaseClient();

    // Intentar insertar directamente con los campos esperados
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select('*')
      .single();

    if (error) {
      // Manejar error de columnas desconocidas
      const err: any = error;
      const isUnknownColumn = err?.code === '42703' || (err?.message && err.message.toLowerCase().includes('does not exist') && err.message.toLowerCase().includes('column'));

      if (isUnknownColumn) {
        // Intentar detectar el nombre de la columna y reintentar sin esa propiedad
        const msg = String(err?.message || '').toLowerCase();
        const match = msg.match(/column\s+"?([a-z0-9_]+)"?\s+.*does not exist/);
        const unknownCol = match?.[1];

        const cleaned: Record<string, any> = { ...projectData };
        if (unknownCol && unknownCol in cleaned) {
          console.warn(`Columna desconocida en projects: ${unknownCol}. Reintentando insert sin ese campo...`);
          // Si falta presupuesto_inicial pero existe budget en la BD legacy, mapear
          if (unknownCol === 'presupuesto_inicial' && typeof cleaned.presupuesto_inicial !== 'undefined') {
            cleaned.budget = cleaned.presupuesto_inicial;
          }
          delete cleaned[unknownCol];

          const { data: retryData, error: retryError } = await supabase
            .from('projects')
            .insert(cleaned)
            .select('*')
            .single();

          if (!retryError && retryData) {
            return retryData as Project;
          }

          // Si el reintento también falló, continuar con manejo estándar
          if (retryError) {
            console.error('Reintento de insert tras eliminar columna desconocida falló:', retryError);
          }
        } else {
          console.warn('Columna desconocida detectada pero no se pudo extraer del mensaje; no se aplica limpieza automática.');
        }

        // Intentar migración de presupuesto como fallback (para columnas de presupuesto)
        const projectId = (data as any)?.id;
        if (projectId) {
          const migratedProject = await migrateProjectBudgetFields(projectId)
            .catch(migrationErr => {
              console.error('Error en migración de presupuesto:', migrationErr);
              return null;
            });
          if (migratedProject) {
            return migratedProject;
          }
        }
      }

      throw error;
    }

    if (!data) {
      throw new Error('No se pudo crear el proyecto');
    }

    return data as Project;
  } catch (error) {
    throw error;
  }
}

/**
 * Actualiza un proyecto existente con migración de presupuesto
 */
export async function updateProject(id: string, updates: UpdateProjectDTO): Promise<Project> {
  try {
    const supabase = await getSupabaseClient();

    // Si se modifican campos de presupuesto, asegurarse de mantener consistencia
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id, presupuesto_original, presupuesto_final')
      .eq('id', id)
      .single();

    let updatePayload = { ...updates } as any;

    if (existingProject) {
      // Preservar presupuesto_original si ya existe
      if (existingProject.presupuesto_original !== null && existingProject.presupuesto_original !== undefined && !('presupuesto_original' in updatePayload)) {
        updatePayload.presupuesto_original = existingProject.presupuesto_original;
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      // Intentar migración si el error es por columnas desconocidas
      const err: any = error;
      const isUnknownColumn = err?.code === '42703' || (err?.message && err.message.includes('column') && err.message.includes('does not exist'));
      
      if (isUnknownColumn) {
        console.warn('Columnas desconocidas detectadas en actualización, intentando migración...');
        const migratedProject = await migrateProjectBudgetFields(id)
          .catch(_ => null);
        if (migratedProject) {
          return migratedProject;
        }
      }
      
      throw error;
    }

    if (!data) {
      throw new Error('No se pudo actualizar el proyecto');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Elimina un proyecto
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    const supabase = await getSupabaseClient();
    
    // Verificar permisos si es necesario (implementación futura)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene todos los clientes
 */
export async function getActiveClients(): Promise<Client[]> {
  try {
    const supabase = await getSupabaseClient();
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