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

    console.log('🔄 Migrando presupuesto para proyecto:', project_id);

    // Obtener el proyecto actual
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (fetchError || !project) {
      console.error('❌ Error al obtener proyecto:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Proyecto no encontrado',
        details: fetchError 
      }, { status: 404 });
    }

    console.log('📊 Proyecto actual:', {
      id: project.id,
      name: project.name,
      presupuesto_original: project.presupuesto_original,
      presupuesto_final: project.presupuesto_final,
      budget: project.budget,
      presupuesto_inicial: project.presupuesto_inicial
    });

    // Determinar el valor del presupuesto a usar
    const budgetValue = project.budget || project.presupuesto_inicial || 0;

    if (budgetValue === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay valor de presupuesto válido para migrar' 
      }, { status: 400 });
    }

    // Actualizar los campos de presupuesto
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        presupuesto_original: budgetValue,
        presupuesto_final: budgetValue
      })
      .eq('id', project_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error al actualizar presupuesto:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al actualizar presupuesto',
        details: updateError 
      }, { status: 500 });
    }

    console.log('✅ Presupuesto migrado exitosamente:', {
      projectId: project_id,
      budgetValue,
      before: {
        presupuesto_original: project.presupuesto_original,
        presupuesto_final: project.presupuesto_final
      },
      after: {
        presupuesto_original: updatedProject.presupuesto_original,
        presupuesto_final: updatedProject.presupuesto_final
      }
    });

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