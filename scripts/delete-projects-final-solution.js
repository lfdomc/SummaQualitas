const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteProjectsFinalSolution() {
  try {
    console.log('🎯 Solución final: Eliminación completa de proyectos...\n');

    // 1. Verificar proyectos existentes
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

    // 2. Eliminar cada proyecto individualmente con enfoque exhaustivo
    for (const project of projects) {
      console.log(`🔄 Procesando: ${project.name || project.id}`);
      await deleteProjectCompletely(project.id, project.name);
      console.log('');
    }

    // 3. Verificación final
    console.log('🔍 Verificación final...');
    const { data: remainingProjects } = await supabase
      .from('projects')
      .select('id, name');
    
    console.log(`📊 Proyectos restantes: ${remainingProjects?.length || 0}`);
    
    if (remainingProjects?.length === 0) {
      console.log('🎉 ¡Todos los proyectos han sido eliminados exitosamente!');
      await verifyCleanDatabase();
    } else {
      console.log('⚠️  Aún quedan algunos proyectos:');
      remainingProjects.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name || p.id}`);
      });
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

async function deleteProjectCompletely(projectId, projectName) {
  console.log(`   🧹 Limpieza exhaustiva de ${projectName}...`);
  
  // Orden específico de eliminación para evitar problemas de foreign key
  const deletionSteps = [
    {
      name: 'project_summaries',
      description: 'resúmenes de proyecto',
      critical: true
    },
    {
      name: 'equipment_rentals',
      description: 'alquileres de equipo',
      critical: false
    },
    {
      name: 'change_orders',
      description: 'órdenes de cambio',
      critical: false
    },
    {
      name: 'incomes',
      description: 'ingresos',
      critical: false
    },
    {
      name: 'expenses',
      description: 'gastos',
      critical: true // Los gastos tienen triggers que pueden causar problemas
    }
  ];

  // Eliminar dependencias
  for (const step of deletionSteps) {
    try {
      console.log(`      🗑️  Eliminando ${step.description}...`);
      
      // Verificar si existen registros
      const { data: records, error: selectError } = await supabase
        .from(step.name)
        .select('id')
        .eq('project_id', projectId);

      if (selectError) {
        console.log(`      ⚠️  Error verificando ${step.description}: ${selectError.message}`);
        continue;
      }

      if (!records || records.length === 0) {
        console.log(`      ℹ️  No hay ${step.description} para eliminar`);
        continue;
      }

      console.log(`      📋 Encontrados ${records.length} registros de ${step.description}`);

      // Eliminar registros uno por uno si es crítico, o en lote si no
      if (step.critical && records.length > 0) {
        console.log(`      🔧 Eliminación individual para ${step.description}...`);
        for (const record of records) {
          const { error: delError } = await supabase
            .from(step.name)
            .delete()
            .eq('id', record.id);
          
          if (delError) {
            console.log(`      ❌ Error eliminando registro ${record.id}: ${delError.message}`);
          }
        }
      } else {
        // Eliminación en lote
        const { error: batchError } = await supabase
          .from(step.name)
          .delete()
          .eq('project_id', projectId);
        
        if (batchError) {
          console.log(`      ❌ Error eliminación en lote: ${batchError.message}`);
        }
      }

      // Verificar eliminación
      const { data: remaining } = await supabase
        .from(step.name)
        .select('id')
        .eq('project_id', projectId);
      
      if (remaining && remaining.length > 0) {
        console.log(`      ⚠️  Aún quedan ${remaining.length} registros de ${step.description}`);
      } else {
        console.log(`      ✅ ${step.description} eliminados exitosamente`);
      }

    } catch (error) {
      console.log(`      💥 Error inesperado con ${step.description}: ${error.message}`);
    }
  }

  // Intentar eliminar el proyecto
  console.log(`   🎯 Eliminando proyecto principal...`);
  
  try {
    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (projectError) {
      console.log(`   ❌ Error eliminando proyecto: ${projectError.message}`);
      
      // Verificar qué dependencias aún existen
      console.log(`   🔍 Verificando dependencias restantes...`);
      for (const step of deletionSteps) {
        const { data: remaining } = await supabase
          .from(step.name)
          .select('id')
          .eq('project_id', projectId);
        
        if (remaining && remaining.length > 0) {
          console.log(`      ⚠️  ${step.description}: ${remaining.length} registros restantes`);
        }
      }
    } else {
      console.log(`   ✅ Proyecto ${projectName} eliminado exitosamente`);
    }
  } catch (error) {
    console.log(`   💥 Error inesperado eliminando proyecto: ${error.message}`);
  }
}

async function verifyCleanDatabase() {
  console.log('\n📋 Verificando limpieza completa de la base de datos...');
  
  const tables = [
    'projects',
    'project_summaries', 
    'change_orders',
    'incomes',
    'expenses',
    'equipment_rentals'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id', { count: 'exact' });
      
      if (!error) {
        console.log(`   ${table}: ${data?.length || 0} registros`);
      } else {
        console.log(`   ${table}: error verificando (${error.message})`);
      }
    } catch (e) {
      console.log(`   ${table}: no se pudo verificar`);
    }
  }
}

// Ejecutar el script
deleteProjectsFinalSolution();