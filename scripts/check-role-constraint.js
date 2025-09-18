import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRoleConstraint() {
  console.log('🔍 VERIFICANDO CONSTRAINT DEL CAMPO ROLE');
  console.log('========================================');
  
  try {
    // Intentar consultar la estructura de la tabla usando una consulta SQL
    const { data, error } = await supabase.rpc('get_table_constraints', {
      table_name: 'user_profiles'
    });
    
    if (error) {
      console.log('⚠️  No se pudo obtener constraints via RPC, intentando método alternativo...');
      
      // Método alternativo: intentar insertar valores de prueba para ver qué falla
      const testRoles = ['gerencia', 'administrativo', 'cliente', 'GERENCIA', 'ADMINISTRATIVO', 'CLIENTE'];
      
      for (const role of testRoles) {
        console.log(`\n🧪 Probando role: '${role}'`);
        
        const testProfile = {
          id: crypto.randomUUID(),
          email: `test-${Date.now()}@example.com`,
          full_name: 'Test User',
          role: role,
          avatar_url: null
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('user_profiles')
          .insert(testProfile)
          .select()
          .single();
        
        if (insertError) {
          console.log(`❌ Role '${role}' FALLÓ:`, insertError.message);
        } else {
          console.log(`✅ Role '${role}' FUNCIONÓ`);
          
          // Limpiar el registro de prueba
          await supabase
            .from('user_profiles')
            .delete()
            .eq('id', testProfile.id);
        }
      }
    } else {
      console.log('✅ Constraints obtenidos:', data);
    }
    
    // También intentar consultar registros existentes para ver qué roles están en uso
    console.log('\n📊 CONSULTANDO ROLES EXISTENTES EN LA TABLA');
    console.log('============================================');
    
    const { data: existingProfiles, error: selectError } = await supabase
      .from('user_profiles')
      .select('role')
      .limit(10);
    
    if (selectError) {
      console.log('❌ Error consultando roles existentes:', selectError.message);
    } else {
      const uniqueRoles = [...new Set(existingProfiles.map(p => p.role))];
      console.log('📋 Roles encontrados en la tabla:', uniqueRoles);
    }
    
  } catch (err) {
    console.error('💥 Error inesperado:', err);
  }
}

checkRoleConstraint();