const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteRemainingProjects() {
  try {
    console.log('🗑️  Iniciando eliminación robusta de proyectos restantes...\n');

    // 1. Obtener todos los proyectos restantes
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name');

    if (projectsError) {
      console.error('❌ Error obteniendo proyectos:', projectsError.message);
      return;
    }

    if (projects.length === 0) {
      console.log('✅ No hay proyectos para eliminar');
      return;
    }

    console.log(`📊 Proyectos a eliminar: ${projects.length}`);
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name || project.id}`);
    });
    console.log('');

    // 2. Eliminar cada proyecto individualmente con manejo de dependencias
    for (const project of projects) {
      console.log(`🔄 Eliminando proyecto: ${project.name || project.id}`);
      
      try {
        // Método 1: Intentar eliminación directa (debería funcionar con CASCADE)
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);

        if (deleteError) {
          console.log(`⚠️  Error con eliminación directa: ${deleteError.message}`);
          console.log('🔧 Intentando eliminación manual de dependencias...');
          
          // Método 2: Eliminación manual de dependencias
          await deleteProjectDependencies(project.id, project.name);
          
          // Intentar eliminar el proyecto nuevamente
          const { error: retryError } = await supabase
            .from('projects')
            .delete()
            .eq('id', project.id);
          
          if (retryError) {
            console.error(`❌ Error final eliminando proyecto ${project.name}: ${retryError.message}`);
          } else {
            console.log(`✅ Proyecto ${project.name} eliminado exitosamente (método manual)`);
          }
        } else {
          console.log(`✅ Proyecto ${project.name} eliminado exitosamente (método directo)`);
        }
        
      } catch (error) {
        console.error(`💥 Error inesperado con proyecto ${project.name}:`, error.message);
      }
      
      console.log('');
    }

    // 3. Verificación final
    console.log('🔍 Verificación final...');
    const { data: remainingProjects } = await supabase
      .from('projects')
      .select('id');
    
    console.log(`📊 Proyectos restantes: ${remainingProjects?.length || 0}`);
    
    if (remainingProjects?.length === 0) {
      console.log('🎉 ¡Todos los proyectos han sido eliminados exitosamente!');
    } else {
      console.log('⚠️  Aún quedan algunos proyectos. Revisar manualmente.');
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

async function deleteProjectDependencies(projectId, projectName) {
  console.log(`   🧹 Limpiando dependencias de ${projectName}...`);
  
  const dependencies = [
    { table: 'equipment_rentals', name: 'alquileres de equipo' },
    { table: 'change_orders', name: 'órdenes de cambio' },
    { table: 'incomes', name: 'ingresos' },
    { table: 'expenses', name: 'gastos' },
    { table: 'project_summaries', name: 'resúmenes de proyecto' }
  ];

  for (const dep of dependencies) {
    try {
      const { data: records, error: selectError } = await supabase
        .from(dep.table)
        .select('id')
        .eq('project_id', projectId);

      if (selectError) {
        console.log(`   ⚠️  No se pudo verificar ${dep.name}: ${selectError.message}`);
        continue;
      }

      if (records && records.length > 0) {
        console.log(`   🗑️  Eliminando ${records.length} ${dep.name}...`);
        
        const { error: deleteError } = await supabase
          .from(dep.table)
          .delete()
          .eq('project_id', projectId);

        if (deleteError) {
          console.log(`   ❌ Error eliminando ${dep.name}: ${deleteError.message}`);
        } else {
          console.log(`   ✅ ${dep.name} eliminados exitosamente`);
        }
      } else {
        console.log(`   ℹ️  No hay ${dep.name} para eliminar`);
      }
    } catch (error) {
      console.log(`   💥 Error inesperado con ${dep.name}: ${error.message}`);
    }
  }
}

// Ejecutar el script
deleteRemainingProjects();