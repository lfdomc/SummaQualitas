const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function nuclearDeleteProjects() {
  try {
    console.log('💥 ELIMINACIÓN NUCLEAR DE PROYECTOS - ENFOQUE MÚLTIPLE\n');

    // 1. Verificar estado inicial
    console.log('📊 Estado inicial:');
    await showDatabaseState();

    // 2. Obtener IDs de proyectos
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name');

    if (!projects || projects.length === 0) {
      console.log('✅ No hay proyectos para eliminar');
      return;
    }

    const projectIds = projects.map(p => p.id);
    console.log(`\n🎯 Proyectos objetivo: ${projectIds.length}`);
    projects.forEach((p, i) => console.log(`   ${i + 1}. ${p.name} (${p.id})`));

    // 3. ENFOQUE 1: Eliminación masiva de todas las dependencias
    console.log('\n🔥 ENFOQUE 1: Eliminación masiva de dependencias...');
    await massDeleteDependencies(projectIds);

    // 4. ENFOQUE 2: Eliminación individual de proyectos
    console.log('\n🔥 ENFOQUE 2: Eliminación individual de proyectos...');
    await individualProjectDeletion(projectIds);

    // 5. ENFOQUE 3: Fuerza bruta - eliminar todo lo que tenga project_id
    console.log('\n🔥 ENFOQUE 3: Fuerza bruta en todas las tablas...');
    await bruteForceDeletion(projectIds);

    // 6. Verificación final
    console.log('\n📊 Estado final:');
    await showDatabaseState();

  } catch (error) {
    console.error('💥 Error nuclear:', error.message);
  }
}

async function showDatabaseState() {
  const tables = ['projects', 'project_summaries', 'change_orders', 'incomes', 'expenses', 'equipment_rentals'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id', { count: 'exact' });
      
      if (!error) {
        console.log(`   ${table}: ${data?.length || 0} registros`);
      } else {
        console.log(`   ${table}: error (${error.message})`);
      }
    } catch (e) {
      console.log(`   ${table}: no accesible`);
    }
  }
}

async function massDeleteDependencies(projectIds) {
  const tables = [
    'project_summaries',
    'equipment_rentals',
    'change_orders', 
    'incomes',
    'expenses'
  ];

  for (const table of tables) {
    try {
      console.log(`   🗑️  Eliminando masivamente de ${table}...`);
      
      const { error } = await supabase
        .from(table)
        .delete()
        .in('project_id', projectIds);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ ${table} limpiado`);
      }
    } catch (e) {
      console.log(`   💥 Error inesperado en ${table}: ${e.message}`);
    }
  }
}

async function individualProjectDeletion(projectIds) {
  for (const projectId of projectIds) {
    try {
      console.log(`   🎯 Eliminando proyecto ${projectId}...`);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Proyecto eliminado`);
      }
    } catch (e) {
      console.log(`   💥 Error inesperado: ${e.message}`);
    }
  }
}

async function bruteForceDeletion(projectIds) {
  // Buscar todas las tablas que podrían tener project_id
  const allTables = [
    'project_summaries',
    'equipment_rentals',
    'change_orders',
    'incomes', 
    'expenses',
    'client_payments',
    'project_equipment',
    'project_suppliers'
  ];

  console.log('   🔍 Eliminando de todas las tablas posibles...');
  
  for (const table of allTables) {
    try {
      // Intentar eliminar sin verificar si la tabla existe
      const { error } = await supabase
        .from(table)
        .delete()
        .in('project_id', projectIds);

      if (error) {
        if (!error.message.includes('does not exist') && !error.message.includes('relation') && !error.message.includes('column')) {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${table}: limpiado`);
      }
    } catch (e) {
      // Ignorar errores de tablas que no existen
    }
  }

  // Intentar eliminar proyectos nuevamente
  console.log('   🎯 Reintentando eliminación de proyectos...');
  for (const projectId of projectIds) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.log(`   ❌ Proyecto ${projectId}: ${error.message}`);
      } else {
        console.log(`   ✅ Proyecto ${projectId}: eliminado`);
      }
    } catch (e) {
      console.log(`   💥 Proyecto ${projectId}: error inesperado`);
    }
  }
}

// Ejecutar el script nuclear
nuclearDeleteProjects();