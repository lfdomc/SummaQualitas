const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
  console.log('🔍 Iniciando debug de autenticación...');
  
  try {
    // Verificar conexión a Supabase
    console.log('\n📡 Verificando conexión a Supabase...');
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return;
    }
    
    console.log('✅ Conexión exitosa a Supabase');
    console.log(`📊 Total de perfiles de usuario: ${data?.length || 0}`);
    
    // Verificar perfiles existentes
    console.log('\n👥 Verificando perfiles de usuario...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, role, full_name, created_at')
      .limit(10);
    
    if (profilesError) {
      console.error('❌ Error al obtener perfiles:', profilesError.message);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Perfiles encontrados:');
      profiles.forEach(profile => {
        console.log(`  - ${profile.email} (${profile.role}) - ${profile.full_name}`);
      });
    } else {
      console.log('⚠️  No se encontraron perfiles de usuario');
    }
    
    // Verificar constraint de roles
    console.log('\n🔒 Verificando constraint de roles...');
    try {
      const testProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'gerencia'
      };
      
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(testProfile);
      
      if (insertError) {
        if (insertError.message.includes('violates check constraint')) {
          console.log('❌ Constraint de roles está causando problemas:', insertError.message);
        } else {
          console.log('ℹ️  Error esperado (usuario de prueba):', insertError.message);
        }
      } else {
        // Limpiar el usuario de prueba
        await supabase.from('user_profiles').delete().eq('id', 'test-user-id');
        console.log('✅ Constraint de roles funciona correctamente');
      }
    } catch (error) {
      console.error('❌ Error al probar constraint:', error.message);
    }
    
    console.log('\n🎉 Debug completado');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugAuth();