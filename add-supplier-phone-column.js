require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de servicio');
  console.log('Intentando con clave anónima...');
  
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    console.error('❌ No hay claves disponibles');
    process.exit(1);
  }
}

// Usar la clave de servicio si está disponible, sino la anónima
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addSupplierPhoneColumn() {
  try {
    console.log('🔧 Agregando columna supplier_phone a la tabla sumitals...');
    
    // Usar una consulta SQL directa
    const { data, error } = await supabase
      .from('sumitals')
      .select('supplier_phone')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('📋 La columna supplier_phone no existe, necesita ser agregada');
      
      // Intentar agregar la columna usando una función personalizada
      const { data: result, error: addError } = await supabase.rpc('add_supplier_phone_column');
      
      if (addError) {
        console.log('⚠️  La función RPC no existe, intentando método alternativo...');
        
        // Método alternativo: usar el cliente con privilegios de servicio
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
          
          // Intentar ejecutar SQL directamente (esto requiere privilegios especiales)
          console.log('🔑 Usando clave de servicio para ejecutar SQL...');
          console.log('⚠️  Nota: Esta operación requiere acceso directo a la base de datos');
          console.log('💡 Recomendación: Ejecutar manualmente en el dashboard de Supabase:');
          console.log('   ALTER TABLE sumitals ADD COLUMN IF NOT EXISTS supplier_phone VARCHAR(50);');
          
        } else {
          console.log('💡 Para agregar la columna, ejecuta este SQL en el dashboard de Supabase:');
          console.log('   ALTER TABLE sumitals ADD COLUMN IF NOT EXISTS supplier_phone VARCHAR(50);');
        }
        
        return;
      }
      
      console.log('✅ Columna agregada:', result);
    } else if (error) {
      console.error('❌ Error verificando columna:', error.message);
      return;
    } else {
      console.log('✅ La columna supplier_phone ya existe');
    }

    // Verificar que la columna funciona
    console.log('🔍 Verificando que la columna funciona...');
    const { data: testData, error: testError } = await supabase
      .from('sumitals')
      .select('supplier_phone')
      .limit(1);

    if (testError) {
      console.error('❌ Error verificando columna:', testError.message);
    } else {
      console.log('✅ Columna supplier_phone verificada correctamente');
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

addSupplierPhoneColumn();