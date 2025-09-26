const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumnsWithSQL() {
  try {
    console.log('🔧 Agregando columnas de attachment usando SQL directo...');
    
    const sql = `
      ALTER TABLE incomes 
      ADD COLUMN IF NOT EXISTS attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS attachment_name TEXT,
      ADD COLUMN IF NOT EXISTS attachment_type TEXT,
      ADD COLUMN IF NOT EXISTS attachment_size INTEGER;
    `;
    
    console.log('📄 Ejecutando SQL:');
    console.log(sql);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log('❌ Error ejecutando SQL:', error.message);
      console.log('🔄 Intentando método alternativo...');
      
      // Intentar ejecutar cada comando por separado
      const commands = [
        'ALTER TABLE incomes ADD COLUMN IF NOT EXISTS attachment_url TEXT;',
        'ALTER TABLE incomes ADD COLUMN IF NOT EXISTS attachment_name TEXT;',
        'ALTER TABLE incomes ADD COLUMN IF NOT EXISTS attachment_type TEXT;',
        'ALTER TABLE incomes ADD COLUMN IF NOT EXISTS attachment_size INTEGER;'
      ];
      
      for (const command of commands) {
        try {
          console.log(`🔄 Ejecutando: ${command}`);
          const { data: cmdData, error: cmdError } = await supabase.rpc('exec_sql', { sql_query: command });
          
          if (cmdError) {
            console.log(`⚠️  Error en comando: ${cmdError.message}`);
          } else {
            console.log(`✅ Comando ejecutado exitosamente`);
          }
        } catch (err) {
          console.log(`⚠️  Error ejecutando comando: ${err.message}`);
        }
      }
    } else {
      console.log('✅ SQL ejecutado exitosamente');
    }
    
    // Verificar que las columnas se agregaron
    console.log('\n🔍 Verificando que las columnas se agregaron...');
    
    const testData = {
      project_id: '00000000-0000-0000-0000-000000000000',
      client_id: '00000000-0000-0000-0000-000000000000',
      amount: 100,
      currency: 'CRC',
      received_date: new Date().toISOString().split('T')[0],
      category: 'pago_proyecto',
      status: 'pendiente',
      reference: 'test-verification',
      description: 'Verificación de columnas',
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
      console.log('❌ Las columnas aún no existen:', insertError.message);
      console.log('\n📝 INSTRUCCIONES MANUALES:');
      console.log('1. Ve al panel de Supabase Dashboard');
      console.log('2. Abre el SQL Editor');
      console.log('3. Ejecuta este SQL:');
      console.log(`
ALTER TABLE incomes 
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_name TEXT,
ADD COLUMN attachment_type TEXT,
ADD COLUMN attachment_size INTEGER;
      `);
    } else {
      console.log('✅ ¡Columnas agregadas exitosamente!');
      console.log('📋 Registro de prueba creado:');
      console.log(insertData[0]);
      
      // Eliminar el registro de prueba
      await supabase.from('incomes').delete().eq('reference', 'test-verification');
      console.log('🧹 Registro de prueba eliminado');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

addColumnsWithSQL();