require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.log('Asegúrate de que .env.local contenga:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExpensesAttachmentColumns() {
  console.log('🔍 Verificando columnas de attachment en la tabla expenses...\n');
  
  try {
    // Intentar hacer una consulta que incluya las columnas de attachment
    const { data, error } = await supabase
      .from('expenses')
      .select('id, attachment_url, attachment_name, attachment_type, attachment_size')
      .limit(1);
    
    if (error) {
      console.log('❌ Error al consultar columnas de attachment:', error.message);
      
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\n🔧 SOLUCIÓN REQUERIDA:');
        console.log('Las columnas de attachment no existen en la tabla expenses.');
        console.log('\n📝 PASOS PARA SOLUCIONARLO:');
        console.log('1. Ve a tu dashboard de Supabase: https://app.supabase.com/');
        console.log('2. Selecciona tu proyecto');
        console.log('3. Ve a "SQL Editor"');
        console.log('4. Copia y pega el siguiente SQL:');
        console.log('\n' + '='.repeat(60));
        console.log('-- Agregar columnas de attachment a la tabla expenses');
        console.log('ALTER TABLE expenses');
        console.log('ADD COLUMN IF NOT EXISTS attachment_url TEXT,');
        console.log('ADD COLUMN IF NOT EXISTS attachment_name TEXT,');
        console.log('ADD COLUMN IF NOT EXISTS attachment_type TEXT,');
        console.log('ADD COLUMN IF NOT EXISTS attachment_size INTEGER;');
        console.log('\n-- Agregar comentarios para documentar');
        console.log("COMMENT ON COLUMN expenses.attachment_url IS 'URL del archivo adjunto en Supabase Storage';");
        console.log("COMMENT ON COLUMN expenses.attachment_name IS 'Nombre original del archivo adjunto';");
        console.log("COMMENT ON COLUMN expenses.attachment_type IS 'Tipo MIME del archivo adjunto';");
        console.log("COMMENT ON COLUMN expenses.attachment_size IS 'Tamaño del archivo adjunto en bytes';");
        console.log('='.repeat(60));
        console.log('\n5. Ejecuta el SQL haciendo clic en "Run"');
        console.log('6. Verifica que las columnas se hayan agregado correctamente');
        console.log('\n💡 Alternativamente, puedes usar el archivo: add-expenses-attachment-columns.sql');
        
      } else {
        console.log('❌ Error diferente:', error.message);
      }
    } else {
      console.log('✅ Las columnas de attachment ya existen y funcionan correctamente');
      console.log('📊 Estructura verificada exitosamente');
      
      // Verificar si hay datos con attachments
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('expenses')
        .select('id, attachment_name')
        .not('attachment_url', 'is', null)
        .limit(5);
      
      if (!attachmentError && attachmentData) {
        console.log(`📎 Se encontraron ${attachmentData.length} gastos con archivos adjuntos`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    console.log('\n📝 Por favor, agrega las columnas manualmente siguiendo las instrucciones anteriores.');
  }
}

// Ejecutar la verificación
checkExpensesAttachmentColumns();