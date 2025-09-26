const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkIncomesTable() {
  try {
    console.log('🔍 Verificando estructura de la tabla incomes...');
    
    // Intentar insertar un registro de prueba para ver qué columnas acepta
    const testData = {
      project_id: 'test',
      client_id: 'test',
      amount: 100,
      currency: 'CRC',
      received_date: new Date().toISOString().split('T')[0],
      category: 'payment',
      status: 'pending',
      reference: 'test',
      notes: 'test'
    };
    
    console.log('🧪 Probando inserción con columnas básicas...');
    const { data: insertData, error: insertError } = await supabase
      .from('incomes')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.log('❌ Error en inserción básica:', insertError.message);
    } else {
      console.log('✅ Inserción básica exitosa');
      console.log('📋 Columnas que acepta la tabla incomes:');
      if (insertData && insertData.length > 0) {
        Object.keys(insertData[0]).forEach(column => {
          console.log(`  - ${column}`);
        });
      }
      
      // Eliminar el registro de prueba
      await supabase.from('incomes').delete().eq('reference', 'test');
    }
    
    // Probar con attachment_name
    console.log('\n🧪 Probando con attachment_name...');
    const testDataWithAttachment = {
      ...testData,
      attachment_name: 'test.pdf'
    };
    
    const { data: attachData, error: attachError } = await supabase
      .from('incomes')
      .insert(testDataWithAttachment)
      .select();
    
    if (attachError) {
      console.log('❌ Error con attachment_name:', attachError.message);
    } else {
      console.log('✅ attachment_name funciona correctamente');
      // Eliminar el registro de prueba
      await supabase.from('incomes').delete().eq('reference', 'test');
    }
    
    // Probar con attachment_url
    console.log('\n🧪 Probando con attachment_url...');
    const testDataWithUrl = {
      ...testData,
      attachment_url: 'https://example.com/test.pdf'
    };
    
    const { data: urlData, error: urlError } = await supabase
      .from('incomes')
      .insert(testDataWithUrl)
      .select();
    
    if (urlError) {
      console.log('❌ Error con attachment_url:', urlError.message);
    } else {
      console.log('✅ attachment_url funciona correctamente');
      // Eliminar el registro de prueba
      await supabase.from('incomes').delete().eq('reference', 'test');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkIncomesTable();