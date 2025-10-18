import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { project_id } = await request.json();

    if (!project_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'project_id es requerido' 
      }, { status: 400 });
    }

    // Migrando presupuesto para proyecto
    
    // Obtener el proyecto actual
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json({ 
        error: 'Proyecto no encontrado',
        details: projectError 
      }, { status: 404 });
    }
    
    // Proyecto actual obtenido
    
    // Verificar si necesita migración
    const needsUpdate = project.presupuesto_original === null || 
                       project.presupuesto_original === undefined || 
                       project.presupuesto_original === 0 ||
                       project.presupuesto_final === null || 
                       project.presupuesto_final === undefined ||
                       project.presupuesto_final === 0;
    
    if (!needsUpdate) {
      return NextResponse.json({
        success: true,
        message: 'El proyecto no necesita migración',
        project: {
          id: project.id,
          name: project.name,
          presupuesto_original: project.presupuesto_original,
          presupuesto_final: project.presupuesto_final
        }
      });
    }
    
    // Calcular el valor del presupuesto a usar
    const budgetValue = project.presupuesto_inicial || project.budget || 0;
    
    // Actualizar los campos de presupuesto
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        presupuesto_original: budgetValue,
        presupuesto_final: budgetValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', project_id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json({ 
        error: 'Error al migrar presupuesto',
        details: updateError 
      }, { status: 500 });
    }
    
    // Presupuesto migrado exitosamente

    return NextResponse.json({
      success: true,
      project: {
        before: {
          id: project.id,
          name: project.name,
          presupuesto_original: project.presupuesto_original,
          presupuesto_final: project.presupuesto_final,
          budget: project.budget
        },
        after: {
          id: updatedProject.id,
          name: updatedProject.name,
          presupuesto_original: updatedProject.presupuesto_original,
          presupuesto_final: updatedProject.presupuesto_final,
          budget: updatedProject.budget
        }
      },
      budgetValue
    });

  } catch (error) {
    console.error('❌ Error en migración de presupuesto:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}