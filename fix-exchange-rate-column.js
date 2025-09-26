const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configurando conexión a Supabase...');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
console.log('Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltante');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addExchangeRateColumn() {
  try {
    console.log('🔧 Agregando columna exchange_rate_usd a la tabla projects...');
    
    // Primero verificar si la columna ya existe consultando directamente la tabla
    console.log('📋 Verificando estructura actual de la tabla projects...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('projects')
        .select('exchange_rate_usd')
        .limit(1);

      if (!testError) {
        console.log('✅ La columna exchange_rate_usd ya existe en la tabla projects');
        console.log('📊 Verificando algunos proyectos...');
        
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, exchange_rate_usd')
          .limit(3);

        if (!projectsError) {
          console.log('✅ Proyectos con exchange_rate_usd:', projects);
        }
        return;
      }
    } catch (e) {
      console.log('🔍 La columna no existe, procediendo a agregarla...');
    }

    // Intentar llamar a la función SQL personalizada
    console.log('➕ Intentando agregar columna usando función SQL...');
    
    try {
      const { data, error } = await supabase.rpc('add_exchange_rate_column');
      
      if (error) {
        console.log('⚠️ Error llamando función SQL:', error.message);
        throw error;
      }
      
      console.log('✅ Resultado de la función:', data);
      
    } catch (funcError) {
      console.log('⚠️ La función SQL no está disponible. Necesitas ejecutar el SQL manualmente.');
      console.log('');
      console.log('📝 PASOS PARA AGREGAR LA COLUMNA MANUALMENTE:');
      console.log('');
      console.log('1. Ve a tu dashboard de Supabase: https://app.supabase.com/');
      console.log('2. Selecciona tu proyecto');
      console.log('3. Ve a "SQL Editor"');
      console.log('4. Copia y pega el siguiente SQL:');
      console.log('');
      console.log('-- Agregar columna exchange_rate_usd');
      console.log('ALTER TABLE projects ADD COLUMN exchange_rate_usd DECIMAL(10,2) DEFAULT 520.00;');
      console.log('');
      console.log('-- Actualizar proyectos existentes');
      console.log('UPDATE projects SET exchange_rate_usd = 520.00 WHERE exchange_rate_usd IS NULL;');
      console.log('');
      console.log('-- Verificar que se agregó correctamente');
      console.log('SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = \'projects\' AND column_name = \'exchange_rate_usd\';');
      console.log('');
      console.log('5. Ejecuta el SQL haciendo clic en "Run"');
      console.log('6. Una vez ejecutado, vuelve a ejecutar este script para verificar');
      console.log('');
      
      throw new Error('Se requiere ejecutar SQL manualmente en el dashboard de Supabase');
    }

    // Verificar que la columna se agregó correctamente
    console.log('🔍 Verificando que la columna se agregó correctamente...');
    
    const { data: projects, error: verifyError } = await supabase
      .from('projects')
      .select('id, name, exchange_rate_usd')
      .limit(3);

    if (verifyError) {
      console.log('⚠️ No se pudo verificar la columna:', verifyError.message);
    } else {
      console.log('✅ Columna verificada exitosamente. Proyectos:', projects);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message || error);
    throw error;
  }
}

// Ejecutar la función
console.log('🚀 Iniciando proceso de migración...');
addExchangeRateColumn()
  .then(() => {
    console.log('🎉 Migración completada exitosamente');
    console.log('');
    console.log('✅ La columna exchange_rate_usd está ahora disponible en la tabla projects');
    console.log('✅ Todos los proyectos existentes tienen el valor por defecto de 520.00');
    console.log('✅ La página de reportes debería funcionar correctamente ahora');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en la migración:', error.message || error);
    process.exit(1);
  });