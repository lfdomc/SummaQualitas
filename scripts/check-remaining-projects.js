const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRemainingProjects() {
  try {
    console.log('🔍 Verificando proyectos restantes en la base de datos...\n');

    // 1. Obtener todos los proyectos restantes
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');

    if (projectsError) {
      console.error('❌ Error obteniendo proyectos:', projectsError.message);
      return;
    }

    console.log(`📊 PROYECTOS RESTANTES: ${projects.length}`);
    
    if (projects.length > 0) {
      console.log('\n📋 Lista de proyectos:');
      projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ID: ${project.id}`);
        console.log(`      Nombre: ${project.name || 'Sin nombre'}`);
        console.log(`      Cliente: ${project.client_id || 'Sin cliente'}`);
        console.log(`      Estado: ${project.status || 'Sin estado'}`);
        console.log('');
      });

      // 2. Verificar dependencias para cada proyecto
      console.log('🔗 Verificando dependencias de cada proyecto:\n');
      
      for (const project of projects) {
        console.log(`📁 Proyecto: ${project.name || project.id}`);
        
        // Verificar órdenes de cambio
        const { data: changeOrders, error: coError } = await supabase
          .from('change_orders')
          .select('id')
          .eq('project_id', project.id);
        
        console.log(`   - Órdenes de cambio: ${changeOrders?.length || 0}`);
        
        // Verificar ingresos
        const { data: incomes, error: incomesError } = await supabase
          .from('incomes')
          .select('id')
          .eq('project_id', project.id);
        
        console.log(`   - Ingresos: ${incomes?.length || 0}`);
        
        // Verificar gastos
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('id')
          .eq('project_id', project.id);
        
        console.log(`   - Gastos: ${expenses?.length || 0}`);
        
        // Verificar si existe tabla project_summaries
        try {
          const { data: summaries, error: summariesError } = await supabase
            .from('project_summaries')
            .select('id')
            .eq('project_id', project.id);
          
          if (!summariesError) {
            console.log(`   - Resúmenes de proyecto: ${summaries?.length || 0}`);
          }
        } catch (e) {
          console.log(`   - Resúmenes de proyecto: tabla no existe o sin acceso`);
        }
        
        // Verificar equipment_rentals si existe
        try {
          const { data: rentals, error: rentalsError } = await supabase
            .from('equipment_rentals')
            .select('id')
            .eq('project_id', project.id);
          
          if (!rentalsError) {
            console.log(`   - Alquileres de equipo: ${rentals?.length || 0}`);
          }
        } catch (e) {
          console.log(`   - Alquileres de equipo: tabla no existe o sin acceso`);
        }
        
        console.log('');
      }

      // 3. Verificar tabla project_summaries específicamente
      console.log('🔍 Verificando tabla project_summaries...');
      try {
        const { data: allSummaries, error: allSummariesError } = await supabase
          .from('project_summaries')
          .select('*');
        
        if (allSummariesError) {
          console.log(`❌ Error accediendo a project_summaries: ${allSummariesError.message}`);
        } else {
          console.log(`📊 Total de registros en project_summaries: ${allSummaries.length}`);
          if (allSummaries.length > 0) {
            console.log('📋 Registros en project_summaries:');
            allSummaries.forEach((summary, index) => {
              console.log(`   ${index + 1}. Project ID: ${summary.project_id}`);
            });
          }
        }
      } catch (e) {
        console.log('⚠️  No se pudo acceder a la tabla project_summaries');
      }

    } else {
      console.log('✅ No hay proyectos restantes en la base de datos');
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

// Ejecutar el script
checkRemainingProjects();