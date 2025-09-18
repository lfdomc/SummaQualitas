import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraint() {
  console.log('🔍 VERIFICANDO CONSTRAINT ACTUAL');
  console.log('================================');
  
  try {
    // Intentar insertar diferentes roles para ver cuál falla
    const testRoles = ['gerencia', 'administrativo', 'cliente', 'GERENCIA', 'ADMINISTRATIVO', 'CLIENTE'];
    
    for (const role of testRoles) {
      console.log(`\n🧪 Probando role: '${role}'`);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'test@example.com',
          full_name: 'Test User',
          role: role
        })
        .select();
        
      if (error) {
        console.log(`❌ Error con '${role}':`, error.message);
      } else {
        console.log(`✅ '${role}' funciona correctamente`);
        
        // Limpiar el registro de prueba
        await supabase
          .from('user_profiles')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000001');
      }
    }
    

    
    // Intentar consultar la tabla directamente
    const { data: tableData, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('❌ Error al consultar tabla:', tableError);
    } else {
      console.log('✅ Tabla accesible, registros:', tableData?.length || 0);
    }
    
  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

checkConstraint();