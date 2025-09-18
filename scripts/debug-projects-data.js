const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProjectsData() {
  try {
    console.log('🔍 Verificando estructura de la tabla projects...');
    
    // Obtener todos los proyectos
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ Error al obtener proyectos:', error);
      return;
    }

    console.log('📊 Proyectos encontrados:', projects?.length || 0);
    
    if (projects && projects.length > 0) {
      console.log('\n🔍 Estructura del primer proyecto:');
      const firstProject = projects[0];
      
      // Mostrar todas las propiedades disponibles
      Object.keys(firstProject).forEach(key => {
        const value = firstProject[key];
        const type = typeof value;
        console.log(`  ${key}: ${value} (${type})`);
      });
      
      console.log('\n💰 Campos de presupuesto disponibles:');
      const budgetFields = [
        'budget',
        'presupuesto_inicial', 
        'presupuesto_total',
        'total_budget',
        'costos_directos_materiales',
        'costos_directos_equipos',
        'costos_indirectos',
        'gastos_administrativos',
        'mano_obra_quincenal',
        'imprevistos',
        'utilidad_esperada'
      ];
      
      budgetFields.forEach(field => {
        if (firstProject.hasOwnProperty(field)) {
          console.log(`  ✅ ${field}: ${firstProject[field]}`);
        } else {
          console.log(`  ❌ ${field}: NO EXISTE`);
        }
      });
      
      // Calcular presupuesto total manualmente
      const components = [
        firstProject.costos_directos_materiales || 0,
        firstProject.costos_directos_equipos || 0,
        firstProject.costos_indirectos || 0,
        firstProject.gastos_administrativos || 0,
        firstProject.mano_obra_quincenal || 0,
        firstProject.imprevistos || 0,
        firstProject.utilidad_esperada || 0
      ];
      
      const calculatedTotal = components.reduce((sum, val) => sum + val, 0);
      console.log(`\n🧮 Presupuesto calculado manualmente: ${calculatedTotal}`);
      
      // Verificar si hay valores NaN
      const hasNaN = components.some(val => isNaN(val));
      console.log(`🔍 ¿Hay valores NaN en componentes?: ${hasNaN}`);
      
      if (hasNaN) {
        console.log('⚠️  Componentes con problemas:');
        budgetFields.forEach((field, index) => {
          if (index < components.length && isNaN(components[index])) {
            console.log(`  - ${field}: ${firstProject[field]}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugProjectsData();