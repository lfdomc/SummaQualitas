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

async function verifyAttachmentColumns() {
  console.log('🔍 Verificando columnas de attachment en la tabla incomes...');
  
  try {
    // Verificar que las columnas existen consultando la estructura de la tabla
    const { data: tableData, error: tableError } = await supabase
      .from('incomes')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error accediendo a la tabla incomes:', tableError.message);
      return false;
    }

    console.log('✅ Tabla incomes accesible');

    // Intentar insertar un registro de prueba con las nuevas columnas
    console.log('🧪 Probando inserción con columnas de attachment...');
    
    const testData = {
      description: 'Test de columnas attachment',
      amount: 100.00,
      date: new Date().toISOString().split('T')[0],
      category: 'test',
      attachment_url: 'https://example.com/test.pdf',
      attachment_name: 'test.pdf',
      attachment_type: 'application/pdf',
      attachment_size: 1024
    };

    const { data: insertData, error: insertError } = await supabase
      .from('incomes')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Error insertando datos de prueba:', insertError.message);
      
      // Verificar qué columnas faltan
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        console.log('💡 Parece que las columnas de attachment aún no se han agregado.');
        console.log('📋 Ve a: https://app.supabase.com/project/hypravgvtrlfpepslhmc/editor');
        console.log('🔧 Ejecuta este SQL:');
        console.log(`
ALTER TABLE incomes 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

COMMENT ON COLUMN incomes.attachment_url IS 'URL del archivo adjunto en Supabase Storage';
COMMENT ON COLUMN incomes.attachment_name IS 'Nombre original del archivo adjunto';
COMMENT ON COLUMN incomes.attachment_type IS 'Tipo MIME del archivo adjunto (application/pdf, image/jpeg, etc.)';
COMMENT ON COLUMN incomes.attachment_size IS 'Tamaño del archivo adjunto en bytes';
        `);
      }
      return false;
    }

    console.log('✅ Inserción de prueba exitosa con columnas de attachment');
    console.log('📋 Datos insertados:', insertData[0]);

    // Limpiar el registro de prueba
    if (insertData && insertData[0]) {
      const { error: deleteError } = await supabase
        .from('incomes')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.log('⚠️  Advertencia: No se pudo eliminar el registro de prueba:', deleteError.message);
      } else {
        console.log('🧹 Registro de prueba eliminado');
      }
    }

    // Verificar la estructura final de la tabla
    console.log('📊 Verificando estructura de la tabla...');
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('incomes')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('⚠️  No se pudo obtener datos de muestra:', sampleError.message);
    } else {
      const columns = sampleData && sampleData[0] ? Object.keys(sampleData[0]) : [];
      const attachmentColumns = columns.filter(col => col.startsWith('attachment_'));
      
      console.log('📋 Columnas de attachment encontradas:');
      attachmentColumns.forEach(col => {
        console.log(`  ✓ ${col}`);
      });

      if (attachmentColumns.length === 4) {
        console.log('🎉 ¡Todas las columnas de attachment están presentes!');
        return true;
      } else {
        console.log(`⚠️  Se encontraron ${attachmentColumns.length}/4 columnas de attachment`);
        return false;
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    return false;
  }
}

// Ejecutar la verificación
verifyAttachmentColumns()
  .then(success => {
    if (success) {
      console.log('🎉 ¡Verificación completada exitosamente!');
      console.log('💡 Las columnas de attachment están listas para usar.');
      console.log('🚀 Puedes proceder a probar la funcionalidad de subida de archivos.');
    } else {
      console.log('❌ La verificación falló. Revisa los errores arriba.');
      console.log('💡 Asegúrate de ejecutar el SQL en el dashboard de Supabase primero.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });