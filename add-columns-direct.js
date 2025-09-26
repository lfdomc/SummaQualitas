// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExecuteSQLFunction() {
  console.log('🔧 Creando función para ejecutar SQL...');
  
  try {
    // Primero crear una función que nos permita ejecutar SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_text TEXT)
      RETURNS TEXT
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
        RETURN 'SQL executed successfully';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'Error: ' || SQLERRM;
      END;
      $$;
    `;

    // Intentar crear la función usando una petición HTTP directa
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql_text: createFunctionSQL
      })
    });

    if (!response.ok) {
      console.log('⚠️  No se pudo crear la función, intentando método alternativo...');
      return false;
    }

    console.log('✅ Función creada exitosamente');
    return true;

  } catch (error) {
    console.log('⚠️  Error creando función:', error.message);
    return false;
  }
}

async function addColumnsDirectly() {
  console.log('🔧 Agregando columnas de attachment directamente...');
  
  try {
    // Intentar crear la función primero
    const functionCreated = await createExecuteSQLFunction();
    
    if (functionCreated) {
      // Usar la función para agregar las columnas
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_text: `
          ALTER TABLE incomes 
          ADD COLUMN IF NOT EXISTS attachment_url TEXT,
          ADD COLUMN IF NOT EXISTS attachment_name TEXT,
          ADD COLUMN IF NOT EXISTS attachment_type TEXT,
          ADD COLUMN IF NOT EXISTS attachment_size INTEGER;
        `
      });

      if (error) {
        console.error('❌ Error ejecutando SQL:', error);
        return false;
      }

      console.log('✅ Columnas agregadas:', data);
      return true;
    }

    // Si no se pudo crear la función, mostrar instrucciones manuales
    console.log('📋 Instrucciones para agregar las columnas manualmente:');
    console.log('');
    console.log('1. Ve al SQL Editor de Supabase:');
    console.log('   https://app.supabase.com/project/hypravgvtrlfpepslhmc/sql/new');
    console.log('');
    console.log('2. Copia y pega este SQL:');
    console.log('');
    console.log('-- Agregar columnas de attachment');
    console.log('ALTER TABLE incomes');
    console.log('ADD COLUMN IF NOT EXISTS attachment_url TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS attachment_name TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS attachment_type TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS attachment_size INTEGER;');
    console.log('');
    console.log('-- Agregar comentarios');
    console.log("COMMENT ON COLUMN incomes.attachment_url IS 'URL del archivo adjunto en Supabase Storage';");
    console.log("COMMENT ON COLUMN incomes.attachment_name IS 'Nombre original del archivo adjunto';");
    console.log("COMMENT ON COLUMN incomes.attachment_type IS 'Tipo MIME del archivo adjunto';");
    console.log("COMMENT ON COLUMN incomes.attachment_size IS 'Tamaño del archivo adjunto en bytes';");
    console.log('');
    console.log('3. Haz clic en "Run" para ejecutar el SQL');
    console.log('');
    console.log('4. Después ejecuta: node verify-attachment-columns.js');
    console.log('');

    return false;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Ejecutar la función
addColumnsDirectly()
  .then(success => {
    if (success) {
      console.log('🎉 ¡Columnas agregadas exitosamente!');
      console.log('💡 Ejecuta "node verify-attachment-columns.js" para verificar.');
    } else {
      console.log('💡 Sigue las instrucciones arriba para agregar las columnas manualmente.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });