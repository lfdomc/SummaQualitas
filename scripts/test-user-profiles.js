import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserProfiles() {
  console.log('🔍 PROBANDO TABLA user_profiles');
  console.log('================================');
  
  try {
    // 1. Verificar que la tabla existe
    console.log('\n📋 Verificando que la tabla existe...');
    const { data: tableExists, error: tableError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Error al acceder a la tabla:', tableError.message);
      return;
    } else {
      console.log('✅ Tabla user_profiles existe y es accesible');
    }
    
    // 2. Probar constraint de roles con diferentes valores
    console.log('\n🔒 Probando constraint de roles...');
    const testRoles = [
      { role: 'gerencia', shouldWork: true },
      { role: 'administrativo', shouldWork: true },
      { role: 'cliente', shouldWork: true },
      { role: 'invalid_role', shouldWork: false }
    ];
    
    for (const test of testRoles) {
       try {
         // Usar un UUID válido para cada prueba
         const testId = randomUUID();
         
         const { data, error } = await supabase
           .from('user_profiles')
           .insert({
             id: testId,
             email: `test-${test.role}@example.com`,
             full_name: `Test ${test.role}`,
             role: test.role
           })
           .select();
        
        if (error) {
          if (test.shouldWork) {
            if (error.code === '23503') {
              console.log(`⚠️ Role '${test.role}': Error de FK (esperado sin usuarios reales)`);
            } else if (error.code === '23514') {
              console.log(`❌ Role '${test.role}': Constraint de role falló (no debería)`);
            } else {
              console.log(`⚠️ Role '${test.role}': Error:`, error.message);
            }
          } else {
            if (error.code === '23514') {
              console.log(`✅ Role '${test.role}': Constraint funcionó correctamente (rechazado)`);
            } else {
              console.log(`⚠️ Role '${test.role}': Error inesperado:`, error.message);
            }
          }
        } else {
          if (test.shouldWork) {
            console.log(`✅ Role '${test.role}': Insertado correctamente`);
            // Limpiar
            await supabase
              .from('user_profiles')
              .delete()
              .eq('id', testId);
          } else {
            console.log(`❌ Role '${test.role}': Se insertó pero no debería`);
            // Limpiar
            await supabase
              .from('user_profiles')
              .delete()
              .eq('id', testId);
          }
        }
      } catch (err) {
        console.log(`❌ Role '${test.role}': Error de conexión:`, err.message);
      }
    }
    
    // 3. Verificar perfiles existentes (sin políticas problemáticas)
    console.log('\n📊 Verificando perfiles existentes...');
    const { data: profiles, error: profilesError, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Error al obtener perfiles:', profilesError.message);
    } else {
      console.log(`✅ Perfiles encontrados: ${count || 0}`);
      if (profiles && profiles.length > 0) {
        console.log('📋 Primeros perfiles:');
        profiles.forEach(profile => {
          console.log(`  - ${profile.email} (${profile.role})`);
        });
      }
    }
    
    console.log('\n🎉 Pruebas completadas');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testUserProfiles();