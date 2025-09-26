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

async function addAttachmentColumns() {
  console.log('🔧 Agregando columnas de attachment a la tabla incomes...');
  
  try {
    // Primero verificamos si las columnas ya existen
    console.log('🔍 Verificando columnas existentes...');
    
    const { data: existingColumns, error: checkError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'incomes' 
          AND table_schema = 'public'
          AND column_name LIKE 'attachment%';
        `
      });
    
    if (checkError) {
      console.log('⚠️  No se pudo verificar columnas existentes, continuando...');
    } else {
      console.log('📋 Columnas de attachment existentes:', existingColumns?.length || 0);
    }
    
    // Ejecutar el SQL para agregar las columnas
    console.log('📝 Ejecutando SQL para agregar columnas...');
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: `
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
    
    console.log('✅ Columnas agregadas exitosamente');
    
    // Agregar comentarios
    console.log('📝 Agregando comentarios a las columnas...');
    
    const { error: commentError } = await supabase.rpc('exec_sql', { 
      sql_query: `
        COMMENT ON COLUMN incomes.attachment_url IS 'URL del archivo adjunto en Supabase Storage';
        COMMENT ON COLUMN incomes.attachment_name IS 'Nombre original del archivo adjunto';
        COMMENT ON COLUMN incomes.attachment_type IS 'Tipo MIME del archivo adjunto (application/pdf, image/jpeg, etc.)';
        COMMENT ON COLUMN incomes.attachment_size IS 'Tamaño del archivo adjunto en bytes';
      `
    });
    
    if (commentError) {
      console.log('⚠️  Advertencia: No se pudieron agregar comentarios:', commentError.message);
    } else {
      console.log('✅ Comentarios agregados exitosamente');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Ejecutar la función
addAttachmentColumns()
  .then(success => {
    if (success) {
      console.log('🎉 ¡Proceso completado exitosamente!');
      console.log('💡 Ahora puedes probar la funcionalidad de subida de archivos en los ingresos.');
    } else {
      console.log('❌ El proceso falló. Revisa los errores arriba.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });