const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteProjectsDirectSQL() {
  try {
    console.log('🗑️  Eliminando proyectos usando SQL directo...\n');

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

    // 2. Crear lista de IDs para eliminar
    const projectIds = projects.map(p => `'${p.id}'`).join(',');
    
    console.log('🔄 Eliminando dependencias en orden...');

    // 3. Eliminar dependencias en orden específico (de menor a mayor dependencia)
    const deletionOrder = [
      { table: 'project_summaries', name: 'resúmenes de proyecto' },
      { table: 'equipment_rentals', name: 'alquileres de equipo' },
      { table: 'change_orders', name: 'órdenes de cambio' },
      { table: 'incomes', name: 'ingresos' },
      { table: 'expenses', name: 'gastos' }
    ];

    for (const item of deletionOrder) {
      try {
        console.log(`   🗑️  Eliminando ${item.name}...`);
        
        // Usar SQL directo para evitar triggers
        const { data, error } = await supabase
          .rpc('execute_sql', {
            sql_query: `DELETE FROM ${item.table} WHERE project_id IN (${projectIds})`
          });

        if (error) {
          console.log(`   ⚠️  Error con ${item.name}: ${error.message}`);
          
          // Método alternativo usando el cliente normal
          const { error: altError } = await supabase
            .from(item.table)
            .delete()
            .in('project_id', projects.map(p => p.id));
          
          if (altError) {
            console.log(`   ❌ Error alternativo con ${item.name}: ${altError.message}`);
          } else {
            console.log(`   ✅ ${item.name} eliminados (método alternativo)`);
          }
        } else {
          console.log(`   ✅ ${item.name} eliminados exitosamente`);
        }
      } catch (e) {
        console.log(`   💥 Error inesperado con ${item.name}: ${e.message}`);
      }
    }

    // 4. Eliminar proyectos
    console.log('\n🗑️  Eliminando proyectos...');
    
    try {
      // Intentar SQL directo primero
      const { data, error } = await supabase
        .rpc('execute_sql', {
          sql_query: `DELETE FROM projects WHERE id IN (${projectIds})`
        });

      if (error) {
        console.log(`⚠️  Error con SQL directo: ${error.message}`);
        console.log('🔄 Intentando eliminación individual...');
        
        // Método alternativo: eliminar uno por uno
        for (const project of projects) {
          const { error: delError } = await supabase
            .from('projects')
            .delete()
            .eq('id', project.id);
          
          if (delError) {
            console.log(`❌ Error eliminando ${project.name}: ${delError.message}`);
          } else {
            console.log(`✅ ${project.name} eliminado exitosamente`);
          }
        }
      } else {
        console.log('✅ Todos los proyectos eliminados exitosamente');
      }
    } catch (e) {
      console.error(`💥 Error inesperado eliminando proyectos: ${e.message}`);
    }

    // 5. Verificación final
    console.log('\n🔍 Verificación final...');
    const { data: remainingProjects } = await supabase
      .from('projects')
      .select('id, name');
    
    console.log(`📊 Proyectos restantes: ${remainingProjects?.length || 0}`);
    
    if (remainingProjects?.length === 0) {
      console.log('🎉 ¡Todos los proyectos han sido eliminados exitosamente!');
      
      // Verificar también las tablas dependientes
      console.log('\n📋 Verificando limpieza de tablas dependientes...');
      const dependentTables = ['project_summaries', 'change_orders', 'incomes', 'expenses', 'equipment_rentals'];
      
      for (const table of dependentTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id', { count: 'exact' });
          
          if (!error) {
            console.log(`   ${table}: ${data?.length || 0} registros`);
          }
        } catch (e) {
          console.log(`   ${table}: no se pudo verificar`);
        }
      }
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

// Ejecutar el script
deleteProjectsDirectSQL();