const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteProjectsWithDisabledTriggers() {
  try {
    console.log('🔧 Iniciando eliminación de proyectos con triggers deshabilitados...\n');

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

    // 2. Deshabilitar triggers problemáticos
    console.log('⏸️  Deshabilitando triggers...');
    
    const disableTriggers = [
      'ALTER TABLE expenses DISABLE TRIGGER trigger_recalculate_summary_on_expense_change',
      'ALTER TABLE client_payments DISABLE TRIGGER trigger_recalculate_summary_on_payment_change'
    ];

    for (const sql of disableTriggers) {
      try {
        const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
        if (error) {
          console.log(`⚠️  Error deshabilitando trigger: ${error.message}`);
        } else {
          console.log(`✅ Trigger deshabilitado: ${sql.split(' ')[3]}`);
        }
      } catch (e) {
        // Intentar método alternativo usando SQL directo
        console.log(`⚠️  Método RPC falló, intentando SQL directo...`);
      }
    }

    // 3. Eliminar proyectos uno por uno
    console.log('\n🗑️  Eliminando proyectos...');
    
    for (const project of projects) {
      console.log(`🔄 Eliminando: ${project.name || project.id}`);
      
      try {
        // Eliminar dependencias manualmente primero
        await deleteProjectDependenciesManually(project.id);
        
        // Eliminar el proyecto
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);

        if (deleteError) {
          console.error(`❌ Error eliminando proyecto: ${deleteError.message}`);
        } else {
          console.log(`✅ Proyecto eliminado exitosamente`);
        }
        
      } catch (error) {
        console.error(`💥 Error inesperado: ${error.message}`);
      }
    }

    // 4. Rehabilitar triggers
    console.log('\n▶️  Rehabilitando triggers...');
    
    const enableTriggers = [
      'ALTER TABLE expenses ENABLE TRIGGER trigger_recalculate_summary_on_expense_change',
      'ALTER TABLE client_payments ENABLE TRIGGER trigger_recalculate_summary_on_payment_change'
    ];

    for (const sql of enableTriggers) {
      try {
        const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
        if (error) {
          console.log(`⚠️  Error rehabilitando trigger: ${error.message}`);
        } else {
          console.log(`✅ Trigger rehabilitado: ${sql.split(' ')[3]}`);
        }
      } catch (e) {
        console.log(`⚠️  Error rehabilitando trigger con RPC`);
      }
    }

    // 5. Verificación final
    console.log('\n🔍 Verificación final...');
    const { data: remainingProjects } = await supabase
      .from('projects')
      .select('id');
    
    console.log(`📊 Proyectos restantes: ${remainingProjects?.length || 0}`);
    
    if (remainingProjects?.length === 0) {
      console.log('🎉 ¡Todos los proyectos han sido eliminados exitosamente!');
    } else {
      console.log('⚠️  Aún quedan algunos proyectos.');
      remainingProjects.forEach((p, i) => {
        console.log(`   ${i + 1}. ID: ${p.id}`);
      });
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

async function deleteProjectDependenciesManually(projectId) {
  const dependencies = [
    'project_summaries',
    'equipment_rentals', 
    'change_orders',
    'incomes',
    'expenses'
  ];

  for (const table of dependencies) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('project_id', projectId);

      if (error && !error.message.includes('does not exist')) {
        console.log(`   ⚠️  Error eliminando de ${table}: ${error.message}`);
      }
    } catch (e) {
      // Ignorar errores de tablas que no existen
    }
  }
}

// Ejecutar el script
deleteProjectsWithDisabledTriggers();