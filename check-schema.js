const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProjectsSchema() {
  console.log('🔍 Verificando esquema actual de la tabla projects...\n');
  
  // Lista de columnas esperadas del formulario
  const expectedColumns = [
    'id', 'name', 'description', 'client_id', 'manager_id', 'status', 
    'location', 'exchange_rate_usd', 'total_area', 'presupuesto_inicial',
    'costos_directos', 'costos_indirectos', 'mano_obra', 'administracion',
    'imprevistos', 'utilidad', 'estimated_start_date', 'estimated_end_date',
    'actual_start_date', 'actual_end_date', 'created_at', 'updated_at'
  ];
  
  try {
    // Usar una consulta SQL directa para obtener la estructura de la tabla
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns 
          WHERE table_name = 'projects' 
            AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (schemaError) {
      console.log('⚠️ No se puede usar exec_sql, intentando método alternativo...\n');
      
      // Método alternativo: consultar una tabla vacía para obtener metadatos
      const { data: emptyData, error: emptyError } = await supabase
        .from('projects')
        .select('*')
        .limit(0);
      
      if (!emptyError) {
        console.log('✅ Tabla projects accesible');
        console.log('📋 Intentando detectar columnas con consulta de ejemplo...\n');
        
        // Intentar obtener un registro existente
        const { data: sampleData, error: sampleError } = await supabase
          .from('projects')
          .select('*')
          .limit(1);
        
        if (!sampleError && sampleData && sampleData.length > 0) {
          const actualColumns = Object.keys(sampleData[0]);
          console.log('✅ Columnas detectadas desde registro existente:');
          console.log('================================================');
          actualColumns.forEach((col, index) => {
            const isExpected = expectedColumns.includes(col);
            const status = isExpected ? '✅' : '❓';
            console.log(`${index + 1}. ${col} ${status}`);
          });
          
          analyzeColumns(actualColumns, expectedColumns);
        } else {
          console.log('⚠️ No hay registros en la tabla para detectar columnas');
          console.log('💡 Sugerencia: Ejecuta el script SQL en Supabase primero');
        }
      } else {
        console.error('❌ Error al acceder a la tabla:', emptyError);
      }
    } else {
      console.log('✅ Esquema obtenido exitosamente:');
      console.log('================================================');
      
      if (schemaData && schemaData.length > 0) {
        const actualColumns = schemaData.map(col => col.column_name);
        
        schemaData.forEach((col, index) => {
          const isExpected = expectedColumns.includes(col.column_name);
          const status = isExpected ? '✅' : '❓';
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          console.log(`${index + 1}. ${col.column_name} (${col.data_type}) ${nullable} ${status}`);
        });
        
        analyzeColumns(actualColumns, expectedColumns);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
  
  console.log('\n✅ Verificación completada');
}

function analyzeColumns(actualColumns, expectedColumns) {
  console.log('\n🔍 Análisis de columnas:');
  console.log('================================================');
  
  // Verificar columnas faltantes
  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
  if (missingColumns.length > 0) {
    console.log('❌ Columnas faltantes:');
    missingColumns.forEach(col => console.log(`   - ${col}`));
  } else {
    console.log('✅ Todas las columnas esperadas están presentes');
  }
  
  // Verificar columnas extra
  const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));
  if (extraColumns.length > 0) {
    console.log('\n📝 Columnas adicionales (no esperadas en el formulario):');
    extraColumns.forEach(col => console.log(`   - ${col}`));
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Total de columnas: ${actualColumns.length}`);
  console.log(`   Columnas esperadas: ${expectedColumns.length}`);
  console.log(`   Columnas faltantes: ${missingColumns.length}`);
  console.log(`   Columnas adicionales: ${extraColumns.length}`);
  
  // Verificar si el formulario puede funcionar
  if (missingColumns.length === 0) {
    console.log('\n🎉 ¡El esquema está completo! El formulario debería funcionar correctamente.');
  } else {
    console.log('\n⚠️ Faltan columnas. Ejecuta el script SQL en Supabase para completar el esquema.');
  }
}

checkProjectsSchema().catch(console.error);