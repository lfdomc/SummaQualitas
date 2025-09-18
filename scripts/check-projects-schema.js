const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProjectsSchema() {
  console.log('🔍 Verificando esquema de la tabla projects...');
  
  try {
    // Intentar crear un proyecto mínimo para ver qué columnas acepta
    const minimalProject = {
      name: 'Test Schema Check',
      status: 'active'
    };
    
    console.log('📝 Intentando crear proyecto de prueba con datos mínimos...');
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .insert([minimalProject])
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Error al crear proyecto de prueba:', testError);
      
      // Si falla, intentar con más campos
      console.log('\n🔄 Intentando con más campos requeridos...');
      const extendedProject = {
        name: 'Test Schema Check Extended',
        description: 'Test project',
        status: 'active',
        presupuesto_inicial: 0,
        exchange_rate_usd: 500,
        total_area: 0
      };
      
      const { data: extendedData, error: extendedError } = await supabase
        .from('projects')
        .insert([extendedProject])
        .select()
        .single();
      
      if (extendedError) {
        console.error('❌ Error con campos extendidos:', extendedError);
        return;
      } else {
        console.log('✅ Proyecto extendido creado, columnas disponibles:');
        const columns = Object.keys(extendedData);
        columns.forEach((col, index) => {
          console.log(`${index + 1}. ${col}`);
        });
        
        // Eliminar el proyecto de prueba
        await supabase.from('projects').delete().eq('id', extendedData.id);
        console.log('🗑️ Proyecto de prueba eliminado');
        
        // Mostrar análisis de columnas
        showColumnAnalysis(columns);
      }
    } else {
      console.log('✅ Proyecto de prueba creado, columnas disponibles:');
      const columns = Object.keys(testData);
      columns.forEach((col, index) => {
        console.log(`${index + 1}. ${col}`);
      });
      
      // Eliminar el proyecto de prueba
      await supabase.from('projects').delete().eq('id', testData.id);
      console.log('🗑️ Proyecto de prueba eliminado');
      
      // Mostrar análisis de columnas
      showColumnAnalysis(columns);
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

function showColumnAnalysis(columns) {
  console.log('\n📋 Columnas esperadas por el código:');
  const expectedColumns = [
    'id', 'name', 'description', 'client_id', 'status', 'location',
    'estimated_start_date', 'estimated_end_date', 'exchange_rate_usd',
    'total_area', 'presupuesto_inicial', 'costos_directos_materiales',
    'costos_directos_equipos', 'costos_indirectos', 'gastos_administrativos',
    'mano_obra_quincenal', 'imprevistos', 'utilidad_esperada',
    'total_budget', 'total_invoiced', 'total_paid', 'total_expenses'
  ];
  
  expectedColumns.forEach((col, index) => {
    const exists = columns.includes(col);
    console.log(`${index + 1}. ${col} ${exists ? '✅' : '❌'}`);
  });
  
  console.log('\n🔍 Columnas faltantes:');
  const missingColumns = expectedColumns.filter(col => !columns.includes(col));
  if (missingColumns.length === 0) {
    console.log('✅ Todas las columnas esperadas están presentes');
  } else {
    console.log('❌ Columnas faltantes:');
    missingColumns.forEach(col => {
      console.log(`   - ${col}`);
    });
  }
  
  console.log('\n🔍 Columnas extra (no esperadas):');
  const extraColumns = columns.filter(col => !expectedColumns.includes(col));
  if (extraColumns.length === 0) {
    console.log('✅ No hay columnas extra');
  } else {
    extraColumns.forEach(col => {
      console.log(`ℹ️ ${col}`);
    });
  }
}

checkProjectsSchema();