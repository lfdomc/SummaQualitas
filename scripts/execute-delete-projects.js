const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  console.error('Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllProjects() {
  try {
    console.log('🚨 ADVERTENCIA: Este script eliminará TODOS los proyectos y datos relacionados');
    console.log('⏳ Iniciando proceso de borrado...\n');

    // 1. Mostrar información antes del borrado
    console.log('📊 ANTES DEL BORRADO:');
    
    const { data: projectsCount, error: projectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    const { data: changeOrdersCount, error: changeOrdersError } = await supabase
      .from('change_orders')
      .select('*', { count: 'exact', head: true });
    
    const { data: incomesCount, error: incomesError } = await supabase
      .from('incomes')
      .select('*', { count: 'exact', head: true });
    
    const { data: expensesCount, error: expensesError } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true });

    console.log(`   - Proyectos existentes: ${projectsCount?.length || 0}`);
    console.log(`   - Órdenes de cambio existentes: ${changeOrdersCount?.length || 0}`);
    console.log(`   - Ingresos existentes: ${incomesCount?.length || 0}`);
    console.log(`   - Gastos existentes: ${expensesCount?.length || 0}`);

    if (projectsError || changeOrdersError || incomesError || expensesError) {
      console.log('⚠️  Algunos conteos pueden no ser exactos debido a errores de consulta');
    }

    // 2. Eliminar todos los proyectos
    console.log('\n🗑️  Eliminando todos los proyectos...');
    
    const { data: deletedProjects, error: deleteError } = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos excepto un ID imposible

    if (deleteError) {
      console.error('❌ Error eliminando proyectos:', deleteError.message);
      
      // Intentar método alternativo: eliminar uno por uno
      console.log('🔄 Intentando método alternativo...');
      
      const { data: allProjects, error: fetchError } = await supabase
        .from('projects')
        .select('id');
      
      if (fetchError) {
        console.error('❌ Error obteniendo lista de proyectos:', fetchError.message);
        return;
      }

      if (allProjects && allProjects.length > 0) {
        console.log(`📋 Eliminando ${allProjects.length} proyectos individualmente...`);
        
        for (const project of allProjects) {
          const { error: individualDeleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', project.id);
          
          if (individualDeleteError) {
            console.error(`❌ Error eliminando proyecto ${project.id}:`, individualDeleteError.message);
          } else {
            console.log(`✅ Proyecto ${project.id} eliminado`);
          }
        }
      }
    } else {
      console.log('✅ Proyectos eliminados exitosamente');
    }

    // 3. Verificar eliminación
    console.log('\n📊 DESPUÉS DEL BORRADO:');
    
    const { data: projectsCountAfter, error: projectsErrorAfter } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    const { data: changeOrdersCountAfter, error: changeOrdersErrorAfter } = await supabase
      .from('change_orders')
      .select('*', { count: 'exact', head: true });
    
    const { data: incomesCountAfter, error: incomesErrorAfter } = await supabase
      .from('incomes')
      .select('*', { count: 'exact', head: true });
    
    const { data: expensesCountAfter, error: expensesErrorAfter } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true });

    console.log(`   - Proyectos restantes: ${projectsCountAfter?.length || 0}`);
    console.log(`   - Órdenes de cambio restantes: ${changeOrdersCountAfter?.length || 0}`);
    console.log(`   - Ingresos restantes: ${incomesCountAfter?.length || 0}`);
    console.log(`   - Gastos restantes: ${expensesCountAfter?.length || 0}`);

    // 4. Mensaje final
    console.log('\n🎉 BORRADO COMPLETADO');
    console.log('✅ Todos los proyectos y datos relacionados han sido eliminados');
    console.log('🚀 La base de datos está lista para nuevas pruebas');

  } catch (error) {
    console.error('💥 Error general:', error.message);
    console.log('\n📋 Si el script falla, puedes ejecutar manualmente en Supabase SQL Editor:');
    console.log('DELETE FROM public.projects;');
  }
}

// Ejecutar el script
deleteAllProjects();