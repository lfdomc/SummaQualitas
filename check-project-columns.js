const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectColumns() {
  console.log('🔍 Verificando columnas de la tabla projects...\n');
  
  try {
    // Intentar obtener la estructura de la tabla projects
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error al acceder a la tabla projects:', error.message);
      return;
    }
    
    console.log('✅ Tabla projects accesible');
    
    // Intentar hacer una consulta que incluya todas las columnas esperadas
    const testColumns = [
      'id', 'name', 'client_id', 'status', 'created_at', 'updated_at',
      'description', 'manager_id', 'location', 'total_area',
      'presupuesto_inicial', 'costos_directos', 'costos_indirectos', 
      'mano_obra', 'administracion', 'imprevistos', 'utilidad',
      'estimated_start_date', 'estimated_end_date', 
      'actual_start_date', 'actual_end_date'
    ];
    
    console.log('🔍 Verificando columnas específicas...\n');
    
    const existingColumns = [];
    const missingColumns = [];
    
    for (const column of testColumns) {
      try {
        const { error: columnError } = await supabase
          .from('projects')
          .select(column)
          .limit(1);
        
        if (columnError) {
          missingColumns.push(column);
          console.log(`❌ ${column} - NO EXISTE`);
        } else {
          existingColumns.push(column);
          console.log(`✅ ${column} - EXISTE`);
        }
      } catch (err) {
        missingColumns.push(column);
        console.log(`❌ ${column} - ERROR: ${err.message}`);
      }
    }
    
    console.log('\n📊 RESUMEN:');
    console.log('===================');
    console.log(`✅ Columnas existentes: ${existingColumns.length}`);
    console.log(`❌ Columnas faltantes: ${missingColumns.length}`);
    
    if (missingColumns.length > 0) {
      console.log('\n🚨 Columnas que faltan:');
      missingColumns.forEach(col => console.log(`   - ${col}`));
      console.log('\n💡 Ejecuta el SQL proporcionado en Supabase para agregar las columnas faltantes.');
    } else {
      console.log('\n🎉 ¡Todas las columnas están presentes!');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkProjectColumns();