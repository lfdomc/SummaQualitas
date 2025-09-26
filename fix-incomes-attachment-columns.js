const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixAttachmentColumns() {
  console.log('🔍 Verificando columnas de attachment en la tabla incomes...');
  
  try {
    // Intentar hacer un SELECT con las columnas de attachment
    console.log('📋 Probando acceso a columnas de attachment...');
    
    const { data, error } = await supabase
      .from('incomes')
      .select('id, attachment_url, attachment_name, attachment_type, attachment_size')
      .limit(1);
    
    if (error) {
      console.log('❌ Error detectado:', error.message);
      
      if (error.message.includes('attachment_name') || 
          error.message.includes('attachment_url') ||
          error.message.includes('attachment_type') ||
          error.message.includes('attachment_size')) {
        
        console.log('🔧 Las columnas de attachment no existen. Necesitan ser agregadas.');
        console.log('\n📝 INSTRUCCIONES PARA CORREGIR EL PROBLEMA:');
        console.log('\n1. Ve a tu panel de Supabase: https://supabase.com/dashboard');
        console.log('2. Selecciona tu proyecto');
        console.log('3. Ve a "SQL Editor" en el menú lateral');
        console.log('4. Copia y pega el siguiente SQL:');
        console.log('\n' + '='.repeat(60));
        console.log('ALTER TABLE incomes');
        console.log('ADD COLUMN IF NOT EXISTS attachment_url TEXT,');
        console.log('ADD COLUMN IF NOT EXISTS attachment_name TEXT,');
        console.log('ADD COLUMN IF NOT EXISTS attachment_type TEXT,');
        console.log('ADD COLUMN IF NOT EXISTS attachment_size INTEGER;');
        console.log('\n-- Agregar comentarios para documentar');
        console.log("COMMENT ON COLUMN incomes.attachment_url IS 'URL del archivo adjunto en Supabase Storage';");
        console.log("COMMENT ON COLUMN incomes.attachment_name IS 'Nombre original del archivo adjunto';");
        console.log("COMMENT ON COLUMN incomes.attachment_type IS 'Tipo MIME del archivo adjunto';");
        console.log("COMMENT ON COLUMN incomes.attachment_size IS 'Tamaño del archivo adjunto en bytes';");
        console.log('='.repeat(60));
        console.log('\n5. Ejecuta el SQL haciendo clic en "Run"');
        console.log('6. Verifica que las columnas se hayan agregado correctamente');
        console.log('\n💡 Alternativamente, puedes usar el archivo: add-incomes-attachment-columns.sql');
        
      } else {
        console.log('❌ Error diferente:', error.message);
      }
    } else {
      console.log('✅ Las columnas de attachment ya existen y funcionan correctamente');
      console.log('📊 Estructura verificada exitosamente');
      
      // Verificar si hay datos con attachments
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('incomes')
        .select('id, attachment_name')
        .not('attachment_url', 'is', null)
        .limit(5);
      
      if (!attachmentError && attachmentData) {
        console.log(`📎 Se encontraron ${attachmentData.length} ingresos con archivos adjuntos`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    console.log('\n📝 Por favor, agrega las columnas manualmente siguiendo las instrucciones anteriores.');
  }
}

// Función adicional para probar la inserción con attachment
async function testAttachmentInsertion() {
  console.log('\n🧪 Probando inserción con datos de attachment...');
  
  try {
    const testData = {
      project_id: '00000000-0000-0000-0000-000000000000', // ID temporal
      description: 'Test attachment',
      amount: 100,
      currency: 'CRC',
      received_date: new Date().toISOString().split('T')[0],
      category: 'payment',
      status: 'pending',
      attachment_url: 'https://example.com/test.pdf',
      attachment_name: 'test.pdf',
      attachment_type: 'application/pdf',
      attachment_size: 1024
    };
    
    const { data, error } = await supabase
      .from('incomes')
      .insert(testData)
      .select();
    
    if (error) {
      console.log('❌ Error en prueba de inserción:', error.message);
    } else {
      console.log('✅ Prueba de inserción exitosa');
      // Limpiar el registro de prueba
      if (data && data[0]) {
        await supabase.from('incomes').delete().eq('id', data[0].id);
        console.log('🧹 Registro de prueba eliminado');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando verificación y corrección de columnas de attachment...\n');
  
  await checkAndFixAttachmentColumns();
  
  // Solo hacer la prueba si las columnas existen
  const { data, error } = await supabase
    .from('incomes')
    .select('attachment_url')
    .limit(1);
  
  if (!error) {
    await testAttachmentInsertion();
  }
  
  console.log('\n✨ Proceso completado');
}

main().catch(console.error);