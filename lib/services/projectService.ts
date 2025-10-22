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

    // Helpers para manejo de errores de columnas desconocidas y sanitización de payload
    const isUnknownColumnError = (err: any): boolean => {
      const msg = String(err?.message || '').toLowerCase();
      return err?.code === '42703' || (msg.includes('column') && msg.includes('does not exist'));
    };

    const extractUnknownColumn = (err: any): string | null => {
      const msg = String(err?.message || '');
      let m = msg.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+.*does\s+not\s+exist/i);
      if (m && m[1]) return m[1];
      m = msg.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+of\s+relation/i);
      if (m && m[1]) return m[1];
      m = msg.match(/column\s+([a-zA-Z0-9_]+)\s+does\s+not\s+exist/i);
      if (m && m[1]) return m[1];
      return null;
    };

    const sanitizeMinimalPayload = (src: Record<string, any>): Record<string, any> => {
      const minimal: Record<string, any> = {};
      minimal.name = src.name;
      minimal.client_id = src.client_id;
      if (src.status) minimal.status = src.status;
      if (typeof src.description !== 'undefined') minimal.description = src.description;
      if (typeof src.location !== 'undefined') minimal.location = src.location;
      if (src.created_by) minimal.created_by = src.created_by;
      // Intentar conservar presupuesto si existe en algún formato
      if (typeof src.budget !== 'undefined') minimal.budget = src.budget;
      else if (typeof src.presupuesto_inicial !== 'undefined') minimal.budget = src.presupuesto_inicial;
      return minimal;
    };

    const sanitizeStrictPayload = (src: Record<string, any>): Record<string, any> => {
      const strict: Record<string, any> = {};
      strict.name = src.name;
      strict.client_id = src.client_id;
      return strict;
    };

    // Intento inicial y reintentos eliminando columnas desconocidas de forma iterativa
    let payload: Record<string, any> = { ...projectData };
    const maxUnknownRemovals = 8;

    for (let i = 0; i <= maxUnknownRemovals; i++) {
      const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select('*')
        .single();

      if (!error && data) {
        return data as Project;
      }

      const err: any = error;
      if (err && isUnknownColumnError(err)) {
        const col = extractUnknownColumn(err);
        if (!col) {
          console.warn('Error 42703 sin nombre de columna; aplicando payload mínimo...');
          break; // salimos del bucle para probar con payload mínimo
        }
        console.warn(`Columna desconocida en projects: ${col}. Eliminando y reintentando...`);
        if (col === 'presupuesto_inicial' && typeof payload.presupuesto_inicial !== 'undefined') {
          // Mapear al campo legacy si existe
          payload.budget = payload.presupuesto_inicial;
        }
        delete payload[col];
        continue; // reintentar con el payload limpiado
      } else {
        // Manejo específico de violación NOT NULL (23502)
        const rawMsg = String(err?.message || '');
        const mNotNull = rawMsg.match(/null value in column\s+"?([a-zA-Z0-9_]+)"?\s+violates not-null constraint/i);
        const notNullCol = mNotNull?.[1];
        if (err?.code === '23502' && notNullCol) {
          console.warn(`Violación NOT NULL en columna ${notNullCol}; ajustando payload y reintentando...`);
          if (notNullCol === 'budget') {
            // Asegurar budget desde presupuesto_inicial o budget existente
            const initial = typeof payload.presupuesto_inicial !== 'undefined' ? Number(payload.presupuesto_inicial) : undefined;
            const existing = typeof payload.budget !== 'undefined' ? Number(payload.budget) : undefined;
            const fixed = Number.isFinite(initial) && initial > 0 ? initial : (Number.isFinite(existing) ? existing : 0);
            payload.budget = fixed;
            continue;
          }
          if (notNullCol === 'presupuesto_original') {
            const initial = typeof payload.presupuesto_inicial !== 'undefined' ? Number(payload.presupuesto_inicial) : undefined;
            const existing = typeof payload.presupuesto_original !== 'undefined' ? Number(payload.presupuesto_original) : undefined;
            const fixed = Number.isFinite(initial) && initial > 0 ? initial : (Number.isFinite(existing) ? existing : 0);
            payload.presupuesto_original = fixed;
            continue;
          }
          // Si no podemos ajustar, romper para probar con payload mínimo
          break;
        }
        if (error) throw error;
        throw new Error('No se pudo crear el proyecto');
      }
    }

    // Fallback 1: payload mínimo (conservar campos esenciales)
    const minimalPayload = sanitizeMinimalPayload(payload);
    const { data: dataMin, error: errorMin } = await supabase
      .from('projects')
      .insert(minimalPayload)
      .select('*')
      .single();

    if (!errorMin && dataMin) {
      return dataMin as Project;
    }

    // Fallback 2: payload estricto (solo name y client_id)
    if (errorMin && isUnknownColumnError(errorMin)) {
      console.warn('Persisten columnas desconocidas con payload mínimo; probando payload estricto (name, client_id)');
      const strictPayload = sanitizeStrictPayload(payload);
      const { data: dataStrict, error: errorStrict } = await supabase
        .from('projects')
        .insert(strictPayload)
        .select('*')
        .single();

      if (!errorStrict && dataStrict) {
        return dataStrict as Project;
      }

      if (errorStrict) throw errorStrict;
    }

    if (errorMin) throw errorMin;

    throw new Error('No se pudo crear el proyecto');
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