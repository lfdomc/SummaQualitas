const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla change_orders...\n');
    
    // Verificar algunos registros existentes para ver qué valores de status hay
    const { data: sampleData, error: sampleError } = await supabase
      .from('change_orders')
      .select('id, status, title')
      .limit(10);

    if (sampleError) {
      console.error('❌ Error obteniendo datos de muestra:', sampleError);
      return;
    }

    console.log('📊 Datos de muestra (status):');
    console.table(sampleData);

    // Intentar insertar un registro de prueba para ver qué valores acepta
    console.log('\n🧪 Probando inserción con diferentes valores de status...');
    
    // Probar con valor en español
    const testData = {
      project_id: '550e8400-e29b-41d4-a716-446655440301',
      title: 'Test - Orden de prueba',
      description: 'Prueba de inserción',
      amount: 1000,
      status: 'pendiente'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('change_orders')
      .insert(testData)
      .select('id, status');

    if (insertError) {
      console.error('❌ Error insertando con status "pendiente":', insertError);
      
      // Probar con valor en inglés
      testData.status = 'pending_approval';
      testData.title = 'Test - Orden de prueba 2';
      
      const { data: insertResult2, error: insertError2 } = await supabase
        .from('change_orders')
        .insert(testData)
        .select('id, status');

      if (insertError2) {
        console.error('❌ Error insertando con status "pending_approval":', insertError2);
      } else {
        console.log('✅ Inserción exitosa con status "pending_approval":', insertResult2);
        
        // Eliminar el registro de prueba
        await supabase.from('change_orders').delete().eq('id', insertResult2[0].id);
        console.log('🗑️ Registro de prueba eliminado');
      }
    } else {
      console.log('✅ Inserción exitosa con status "pendiente":', insertResult);
      
      // Eliminar el registro de prueba
      await supabase.from('change_orders').delete().eq('id', insertResult[0].id);
      console.log('🗑️ Registro de prueba eliminado');
    }

    // Verificar qué valores únicos de status existen
    const { data: statusValues, error: statusError } = await supabase
      .from('change_orders')
      .select('status')
      .not('status', 'is', null);

    if (!statusError && statusValues) {
      const uniqueStatuses = [...new Set(statusValues.map(item => item.status))];
      console.log('\n📋 Valores únicos de status en la base de datos:');
      console.log(uniqueStatuses);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkTableStructure();