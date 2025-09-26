const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExpensesStructure() {
  console.log('🔍 Verificando estructura de la tabla expenses...\n');
  
  try {
    // Primero, intentar obtener un registro existente para ver la estructura
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1)
      .single();

    if (sampleRecord) {
      console.log('📝 Estructura basada en registro existente:');
      console.log('==================================================');
      Object.keys(sampleRecord).forEach(key => {
        const value = sampleRecord[key];
        const type = value === null ? 'null' : typeof value;
        console.log(`  • ${key}: ${type} (ejemplo: ${value})`);
      });
      
      // Verificar si existe la columna category
      if ('category' in sampleRecord) {
        console.log('\n🎯 La columna "category" SÍ existe en la tabla');
        console.log(`  - Valor actual: ${sampleRecord.category}`);
      } else {
        console.log('\n⚠️ La columna "category" NO existe en la tabla');
      }
    } else {
      console.log('📝 No hay registros existentes. Probando inserción vacía para detectar campos requeridos...\n');
      
      // Intentar insertar un registro vacío para ver qué campos son requeridos
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({});
      
      if (insertError) {
        console.log('💡 Error al insertar registro vacío (esto nos muestra los campos requeridos):');
        console.log(`  - Código: ${insertError.code}`);
        console.log(`  - Mensaje: ${insertError.message}`);
        console.log(`  - Detalles: ${insertError.details}`);
        
        // Analizar el mensaje de error para identificar campos NOT NULL
        if (insertError.message && insertError.message.includes('not-null constraint')) {
          const match = insertError.message.match(/column "([^"]+)"/);
          if (match) {
            console.log(`\n🎯 Campo requerido detectado: "${match[1]}"`);
          }
        }
      }
    }

    // Intentar insertar un registro con datos mínimos para ver qué falta
    console.log('\n🧪 Probando inserción con datos mínimos...');
    const testData = {
      description: 'Test expense',
      amount: 100,
      project_id: null // Esto podría fallar si es requerido
    };

    const { error: testInsertError } = await supabase
      .from('expenses')
      .insert(testData);

    if (testInsertError) {
      console.log('❌ Error en inserción de prueba:');
      console.log(`  - Código: ${testInsertError.code}`);
      console.log(`  - Mensaje: ${testInsertError.message}`);
      
      // Si el error menciona category, confirmamos que es requerido
      if (testInsertError.message && testInsertError.message.includes('category')) {
        console.log('\n🎯 CONFIRMADO: La columna "category" es requerida (NOT NULL)');
      }
    } else {
      console.log('✅ Inserción de prueba exitosa (eliminando registro de prueba...)');
      // Eliminar el registro de prueba
      await supabase
        .from('expenses')
        .delete()
        .eq('description', 'Test expense');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkExpensesStructure();