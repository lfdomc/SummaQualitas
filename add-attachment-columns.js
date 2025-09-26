const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.log('Asegúrate de que NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén configuradas en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAttachmentColumns() {
  console.log('🔧 Iniciando proceso para agregar columnas de attachment...');
  
  try {
    // Verificar si las columnas ya existen
    console.log('📋 Verificando estructura actual de la tabla incomes...');
    
    const { data: existingData, error: selectError } = await supabase
      .from('incomes')
      .select('attachment_url, attachment_name, attachment_type, attachment_size')
      .limit(1);
    
    if (!selectError) {
      console.log('✅ Las columnas de attachment ya existen en la tabla incomes');
      console.log('📊 Estructura verificada exitosamente');
      return;
    }
    
    console.log('⚠️  Las columnas de attachment no existen. Necesitan ser agregadas manualmente.');
    console.log('\n📝 INSTRUCCIONES PARA AGREGAR LAS COLUMNAS MANUALMENTE:');
    console.log('1. Ve a tu panel de Supabase: https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a "Table Editor" en el menú lateral');
    console.log('4. Selecciona la tabla "incomes"');
    console.log('5. Haz clic en "Add Column" y agrega las siguientes columnas:');
    console.log('');
    console.log('   📎 attachment_url:');
    console.log('      - Tipo: text');
    console.log('      - Nullable: true');
    console.log('      - Default: null');
    console.log('');
    console.log('   📎 attachment_name:');
    console.log('      - Tipo: text');
    console.log('      - Nullable: true');
    console.log('      - Default: null');
    console.log('');
    console.log('   📎 attachment_type:');
    console.log('      - Tipo: text');
    console.log('      - Nullable: true');
    console.log('      - Default: null');
    console.log('');
    console.log('   📎 attachment_size:');
    console.log('      - Tipo: bigint');
    console.log('      - Nullable: true');
    console.log('      - Default: null');
    console.log('');
    console.log('6. Guarda los cambios');
    console.log('');
    console.log('💡 Alternativamente, puedes ejecutar este SQL en el SQL Editor de Supabase:');
    console.log('');
    console.log('ALTER TABLE incomes');
    console.log('ADD COLUMN attachment_url text,');
    console.log('ADD COLUMN attachment_name text,');
    console.log('ADD COLUMN attachment_type text,');
    console.log('ADD COLUMN attachment_size bigint;');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    console.log('\n📝 Por favor, agrega las columnas manualmente siguiendo las instrucciones anteriores.');
  }
}

// Ejecutar el proceso
addAttachmentColumns()
  .then(() => {
    console.log('\n🎯 Proceso completado.');
    console.log('💡 Ejecuta este script nuevamente después de agregar las columnas para verificar.');
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });