const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.log('Asegúrate de que .env.local contenga:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addExchangeRateToExpenses() {
  try {
    console.log('🔧 Agregando columna exchange_rate_usd a la tabla expenses...');
    
    // Primero verificar si la columna ya existe
    console.log('📋 Verificando estructura actual de la tabla expenses...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('expenses')
        .select('exchange_rate_usd')
        .limit(1);

      if (!testError) {
        console.log('✅ La columna exchange_rate_usd ya existe en la tabla expenses');
        console.log('📊 Verificando algunos gastos...');
        
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('id, description, amount, currency, exchange_rate_usd')
          .limit(3);

        if (!expensesError) {
          console.log('✅ Gastos con exchange_rate_usd:', expenses);
        }
        return;
      }
    } catch (e) {
      console.log('🔍 La columna no existe, procediendo a agregarla...');
    }

    // Ejecutar la migración SQL
    console.log('➕ Agregando columna exchange_rate_usd...');
    
    const migrationSQL = `
      -- Agregar columna exchange_rate_usd a la tabla expenses
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS exchange_rate_usd DECIMAL(10,4);

      -- Agregar comentario descriptivo
      COMMENT ON COLUMN expenses.exchange_rate_usd IS 'Tipo de cambio USD/CRC utilizado para la conversión de moneda';

      -- Actualizar gastos existentes con un valor por defecto
      UPDATE expenses 
      SET exchange_rate_usd = 520.00 
      WHERE exchange_rate_usd IS NULL AND currency = 'USD';

      UPDATE expenses 
      SET exchange_rate_usd = 1.00 
      WHERE exchange_rate_usd IS NULL AND currency = 'CRC';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.log('⚠️ Error ejecutando migración con RPC, intentando método alternativo...');
      
      // Método alternativo: ejecutar cada comando por separado
      console.log('🔄 Intentando agregar columna directamente...');
      
      // Nota: Supabase no permite ALTER TABLE directamente desde el cliente
      // El usuario necesitará ejecutar el SQL manualmente
      console.log('');
      console.log('📝 NECESITAS EJECUTAR EL SQL MANUALMENTE:');
      console.log('');
      console.log('1. Ve a tu dashboard de Supabase: https://app.supabase.com/');
      console.log('2. Selecciona tu proyecto');
      console.log('3. Ve a "SQL Editor"');
      console.log('4. Copia y pega el contenido del archivo: add-exchange-rate-to-expenses.sql');
      console.log('5. Ejecuta el SQL haciendo clic en "Run"');
      console.log('');
      console.log('Una vez ejecutado, la aplicación debería funcionar correctamente.');
      
      return;
    }
    
    console.log('✅ Migración ejecutada exitosamente');
    
    // Verificar que la columna se agregó correctamente
    console.log('🔍 Verificando que la columna se agregó...');
    
    const { data: expenses, error: verifyError } = await supabase
      .from('expenses')
      .select('id, description, amount, currency, exchange_rate_usd')
      .limit(3);

    if (verifyError) {
      console.log('⚠️ Error verificando la columna:', verifyError.message);
    } else {
      console.log('✅ Verificación exitosa. Algunos gastos:');
      console.log(expenses);
    }

  } catch (error) {
    console.error('💥 Error en la migración:', error.message || error);
    console.log('');
    console.log('📝 SOLUCIÓN MANUAL:');
    console.log('Ejecuta el archivo add-exchange-rate-to-expenses.sql en el SQL Editor de Supabase');
  }
}

// Ejecutar la función
console.log('🚀 Iniciando migración de exchange_rate_usd para expenses...');
addExchangeRateToExpenses()
  .then(() => {
    console.log('🎉 Proceso completado');
    console.log('');
    console.log('✅ La columna exchange_rate_usd debería estar disponible en la tabla expenses');
    console.log('✅ La página de gastos debería funcionar sin errores de columna faltante');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error.message || error);
    process.exit(1);
  });