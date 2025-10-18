import { createClient } from '@/lib/supabase/client';
import { Project } from '@/lib/types';

/**
 * Verifica y migra automáticamente los presupuestos de un proyecto
 * Esta función se debe llamar después de crear un proyecto
 */
export async function migrateBudgetIfNeeded(projectId: string): Promise<void> {
  try {
    const supabase = createClient();
    
    // Obtener el proyecto
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (fetchError || !project) {
      console.warn('No se pudo obtener el proyecto para migración:', fetchError);
      return;
    }
    
    // Verificar si necesita migración
    const needsUpdate = project.presupuesto_original === null || 
                       project.presupuesto_original === undefined || 
                       project.presupuesto_original === 0 ||
                       project.presupuesto_final === null || 
                       project.presupuesto_final === undefined ||
                       project.presupuesto_final === 0;
    
    if (!needsUpdate) {
      // Proyecto no necesita migración de presupuesto
      return;
    }
    
    // Migrando presupuestos del proyecto
    
    // Calcular el valor del presupuesto a usar
    const budgetValue = project.presupuesto_inicial || 0;
    
    // Actualizar los campos de presupuesto
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        presupuesto_original: budgetValue,
        presupuesto_final: budgetValue
      })
      .eq('id', projectId);
    
    if (updateError) {
      console.error('❌ Error al migrar presupuestos:', updateError);
      return;
    }
    
    // Presupuestos migrados exitosamente
    
  } catch (error) {
    console.error('❌ Error en migración automática de presupuesto:', error);
  }
}

/**
 * Migra todos los proyectos que necesiten actualización de presupuestos
 * Esta función se puede usar para migración masiva
 */
export async function migrateAllProjectBudgets(): Promise<void> {
  try {
    const supabase = createClient();
    
    // Buscando proyectos que necesiten migración
    
    // Obtener todos los proyectos que necesiten migración
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .or('presupuesto_original.is.null,presupuesto_original.eq.0,presupuesto_final.is.null,presupuesto_final.eq.0');
    
    if (error) {
      throw error;
    }
    
    if (!projects || projects.length === 0) {
      // No hay proyectos que necesiten migración
      return;
    }
    
    // Encontrados proyectos que necesitan migración
    
    // Migrar cada proyecto
    for (const project of projects) {
      const needsUpdate = project.presupuesto_original === null || 
                         project.presupuesto_original === undefined || 
                         project.presupuesto_original === 0 ||
                         project.presupuesto_final === null || 
                         project.presupuesto_final === undefined ||
                         project.presupuesto_final === 0;
      
      if (needsUpdate) {
        const budgetValue = project.presupuesto_inicial || 0;
        
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            presupuesto_original: budgetValue,
            presupuesto_final: budgetValue
          })
          .eq('id', project.id);
        
        if (updateError) {
          console.error(`❌ Error al migrar proyecto ${project.name}:`, updateError);
        }
        // Migrado exitosamente (silencioso)
      }
    }
    
    // Migración masiva completada (silencioso)
    
  } catch (error) {
    console.error('❌ Error en migración masiva:', error);
  }
}