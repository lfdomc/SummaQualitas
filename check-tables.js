const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Variables de entorno no encontradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Verificando tablas existentes...');
  
  // Intentar acceder a diferentes tablas
  const tables = ['user_profiles', 'profiles', 'projects', 'users'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabla '${table}': ${error.message}`);
      } else {
        console.log(`✅ Tabla '${table}': existe y es accesible`);
      }
    } catch (err) {
      console.log(`❌ Tabla '${table}': ${err.message}`);
    }
  }
}

checkTables();