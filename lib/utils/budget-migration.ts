/**
 * Utilidad para migrar y normalizar campos de presupuesto en proyectos
 * Esta función asegura que presupuesto_original y presupuesto_final tengan valores válidos
 */

import { createClient } from '@/lib/supabase/client';
import { Project } from '@/lib/types';

const supabase = createClient();

/**
 * Calcula el presupuesto final basado en las órdenes de cambio implementadas
 */
async function calculateFinalBudgetWithChangeOrders(projectId: string, originalBudget: number): Promise<number> {
  try {
    const { data: changeOrders, error } = await supabase
      .from('change_orders')
      .select('cost_impact_crc, cost_impact, impact_type')
      .eq('project_id', projectId)
      .eq('status', 'implementado');

    if (error) {
      console.error('Error fetching change orders:', error);
      return originalBudget;
    }

    if (!changeOrders || changeOrders.length === 0) {
      return originalBudget;
    }

    const totalImpact = changeOrders.reduce((sum, order) => {
      const impactAmount = order.cost_impact_crc || order.cost_impact || 0;
      const impact = order.impact_type === 'positivo' ? impactAmount : -impactAmount;
      return sum + impact;
    }, 0);

    return originalBudget + totalImpact;
  } catch (error) {
    console.error('Error calculating final budget with change orders:', error);
    return originalBudget;
  }
}

/**
 * Normaliza los campos de presupuesto de un proyecto
 * Asegura que presupuesto_original y presupuesto_final tengan valores válidos
 */
export async function normalizeBudgetFields(project: Project): Promise<Project> {
  const normalizedProject = { ...project };
  
  // Si presupuesto_original no existe, usar budget
  if (!normalizedProject.presupuesto_original && normalizedProject.presupuesto_original !== 0) {
    normalizedProject.presupuesto_original = normalizedProject.budget || 0;
  }
  
  // Si presupuesto_final no existe o es igual al original, recalcular con órdenes de cambio
  if (!normalizedProject.presupuesto_final && normalizedProject.presupuesto_final !== 0) {
    const originalBudget = normalizedProject.presupuesto_original || normalizedProject.budget || 0;
    normalizedProject.presupuesto_final = await calculateFinalBudgetWithChangeOrders(project.id, originalBudget);
  } else if (normalizedProject.presupuesto_final === normalizedProject.presupuesto_original) {
    // Si el presupuesto final es igual al original, verificar si hay órdenes de cambio implementadas
    const originalBudget = normalizedProject.presupuesto_original || normalizedProject.budget || 0;
    const calculatedFinal = await calculateFinalBudgetWithChangeOrders(project.id, originalBudget);
    if (calculatedFinal !== originalBudget) {
      normalizedProject.presupuesto_final = calculatedFinal;
    }
  }
  
  return normalizedProject;
}

/**
 * Migra un proyecto específico actualizando sus campos de presupuesto en la base de datos
 */
export async function migrateProjectBudgetFields(projectId: string): Promise<Project | null> {
  try {
    // Obtener el proyecto actual
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (fetchError || !project) {
      console.error('Error fetching project for migration:', fetchError);
      return null;
    }
    
    // Verificar si necesita migración
    const needsMigration = 
      (project.presupuesto_original === null || project.presupuesto_original === undefined) ||
      (project.presupuesto_final === null || project.presupuesto_final === undefined);
    
    if (!needsMigration) {
      return project;
    }
    
    // Calcular valores de migración
    const presupuesto_original = project.presupuesto_original ?? 
      (project.budget || 0);
    
    const presupuesto_final = project.presupuesto_final ?? 
      (presupuesto_original || project.budget || 0);
    
    // Actualizar en la base de datos
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        presupuesto_original,
        presupuesto_final,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error updating project budget fields:', updateError);
      return project;
    }
    
    console.log(`✅ Migrated budget fields for project ${projectId}:`, {
      presupuesto_original,
      presupuesto_final
    });
    
    return updatedProject;
  } catch (error) {
    console.error('Error in migrateProjectBudgetFields:', error);
    return null;
  }
}

/**
 * Migra todos los proyectos que necesiten actualización de campos de presupuesto
 */
export async function migrateAllProjectsBudgetFields(): Promise<void> {
  try {
    // Obtener proyectos que necesitan migración
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, presupuesto_original, presupuesto_final, budget')
      .or('presupuesto_original.is.null,presupuesto_final.is.null');
    
    if (error) {
      console.error('Error fetching projects for migration:', error);
      return;
    }
    
    if (!projects || projects.length === 0) {
      console.log('✅ No projects need budget field migration');
      return;
    }
    
    console.log(`🔄 Migrating budget fields for ${projects.length} projects...`);
    
    // Migrar cada proyecto
    for (const project of projects) {
      await migrateProjectBudgetFields(project.id);
    }
    
    console.log('✅ Budget field migration completed for all projects');
  } catch (error) {
    console.error('Error in migrateAllProjectsBudgetFields:', error);
  }
}