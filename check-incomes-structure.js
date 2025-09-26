require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncomesStructure() {
  console.log('🔍 Verificando estructura de la tabla incomes...');
  
  try {
    // Intentar obtener información de las columnas usando información del esquema
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'incomes')
      .eq('table_schema', 'public');

    if (error) {
      console.log('⚠️ No se pudo acceder a information_schema, intentando método alternativo...');
      
      // Método alternativo: hacer una consulta simple para ver qué columnas existen
      const { data: testData, error: testError } = await supabase
        .from('incomes')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('❌ Error accediendo a la tabla incomes:', testError.message);
        return;
      }
      
      if (testData && testData.length > 0) {
        console.log('✅ Estructura de la tabla incomes (basada en datos existentes):');
        console.log('📋 Columnas encontradas:', Object.keys(testData[0]));
      } else {
        console.log('⚠️ La tabla incomes existe pero está vacía');
        
        // Intentar insertar un registro mínimo para ver qué columnas son requeridas
        const { error: insertError } = await supabase
          .from('incomes')
          .insert({});
        
        if (insertError) {
          console.log('💡 Error al insertar registro vacío (esto nos ayuda a ver las columnas requeridas):');
          console.log(insertError.message);
        }
      }
    } else {
      console.log('✅ Estructura de la tabla incomes:');
      console.table(data);
      
      // Verificar específicamente las columnas de attachment
      const attachmentColumns = data.filter(col => 
        col.column_name.startsWith('attachment_')
      );
      
      if (attachmentColumns.length > 0) {
        console.log('✅ Columnas de attachment encontradas:');
        console.table(attachmentColumns);
      } else {
        console.log('❌ No se encontraron columnas de attachment');
      }
    }
    
  } catch (err) {
    console.error('❌ Error verificando estructura:', err.message);
  }
}

checkIncomesStructure();