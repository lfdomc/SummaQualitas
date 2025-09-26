// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  console.log('💡 Asegúrate de tener un archivo .env.local con:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addReferenceAttachmentColumns() {
  console.log('🔧 Agregando columnas de adjunto de referencia a la tabla expenses...');
  
  try {
    // SQL para agregar las columnas
    const alterTableSQL = `
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS reference_attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS reference_attachment_name TEXT,
      ADD COLUMN IF NOT EXISTS reference_attachment_type TEXT,
      ADD COLUMN IF NOT EXISTS reference_attachment_size INTEGER;
    `;

    console.log('📝 Ejecutando SQL:', alterTableSQL);

    // Intentar usando fetch directo a la API de Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql_query: alterTableSQL })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error ejecutando SQL:', errorText);
      
      // Intentar método alternativo usando el cliente de Supabase
      console.log('🔄 Intentando con el cliente de Supabase...');
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: alterTableSQL 
      });

      if (error) {
        console.error('❌ Error con cliente de Supabase:', error);
        console.log('💡 Nota: Es posible que necesites agregar las columnas manualmente en el dashboard de Supabase.');
        console.log('💡 SQL a ejecutar:');
        console.log(alterTableSQL);
        return false;
      }

      console.log('✅ Columnas agregadas exitosamente usando cliente de Supabase');
    } else {
      const result = await response.json();
      console.log('✅ Columnas agregadas exitosamente usando API directa');
      console.log('📋 Resultado:', result);
    }

    // Verificar que las columnas se agregaron correctamente haciendo una consulta simple
    console.log('🔍 Verificando que las columnas se agregaron...');
    
    const { data: testData, error: testError } = await supabase
      .from('expenses')
      .select('id, reference_attachment_url, reference_attachment_name, reference_attachment_type, reference_attachment_size')
      .limit(1);

    if (testError) {
      console.error('❌ Error verificando columnas:', testError);
      console.log('💡 Las columnas podrían no haberse agregado correctamente.');
      return false;
    }

    console.log('✅ Verificación exitosa: las columnas están disponibles');
    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    console.log('💡 Nota: Es posible que necesites agregar las columnas manualmente en el dashboard de Supabase.');
    console.log('💡 SQL a ejecutar:');
    console.log(`
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS reference_attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS reference_attachment_name TEXT,
      ADD COLUMN IF NOT EXISTS reference_attachment_type TEXT,
      ADD COLUMN IF NOT EXISTS reference_attachment_size INTEGER;
    `);
    return false;
  }
}

// Ejecutar la función
addReferenceAttachmentColumns()
  .then(success => {
    if (success) {
      console.log('🎉 ¡Proceso completado exitosamente!');
      console.log('💡 Ahora puedes probar la funcionalidad de subida de archivos de referencia en los gastos.');
    } else {
      console.log('❌ El proceso falló. Revisa los errores arriba.');
      console.log('💡 Puedes agregar las columnas manualmente en Supabase Dashboard.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });