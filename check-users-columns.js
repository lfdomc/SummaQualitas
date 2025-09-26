const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersColumns() {
  console.log('🔍 Verificando columnas de la tabla users...\n');
  
  try {
    // Intentar obtener un registro para ver las columnas disponibles
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error al consultar la tabla users:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Columnas disponibles en la tabla users:');
      const columns = Object.keys(data[0]);
      columns.forEach(column => {
        console.log(`   - ${column}`);
      });
      
      console.log('\n📋 Ejemplo de registro:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️ La tabla users existe pero no tiene registros');
      
      // Intentar hacer una consulta vacía para obtener la estructura
      const { data: emptyData, error: emptyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000'); // ID que no existe
      
      if (emptyError) {
        console.log('❌ Error al obtener estructura:', emptyError);
      }
    }
    
  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

checkUsersColumns();