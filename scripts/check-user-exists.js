require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserExists() {
  console.log('🔍 VERIFICANDO USUARIO ESPECÍFICO');
  console.log('================================');
  
  const targetEmail = 'lfdomc@gmail.com';
  
  try {
    // Verificar en tabla users (si existe)
    console.log(`\n📋 Buscando usuario: ${targetEmail}`);
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail);
    
    if (usersError) {
      console.log('❌ Error accediendo a tabla users:', usersError.message);
    } else {
      console.log(`✅ Usuarios encontrados en tabla 'users': ${users?.length || 0}`);
      if (users && users.length > 0) {
        console.log('👤 DATOS DEL USUARIO:');
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}`);
          console.log(`      Email: ${user.email}`);
          console.log(`      Nombre: ${user.name || 'No especificado'}`);
          console.log(`      Activo: ${user.is_active ? 'Sí' : 'No'}`);
          console.log(`      Tiene contraseña: ${user.password_hash ? 'Sí' : 'No'}`);
          console.log(`      Rol: ${user.role || 'No especificado'}`);
          console.log(`      Creado: ${user.created_at}`);
        });
      }
    }
    
    // Verificar en tabla user_profiles (si existe)
    console.log(`\n📋 Buscando en user_profiles...`);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', targetEmail);
    
    if (profilesError) {
      console.log('❌ Error accediendo a tabla user_profiles:', profilesError.message);
    } else {
      console.log(`✅ Perfiles encontrados en tabla 'user_profiles': ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        console.log('👤 DATOS DEL PERFIL:');
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ID: ${profile.id}`);
          console.log(`      Email: ${profile.email}`);
          console.log(`      Nombre: ${profile.full_name || 'No especificado'}`);
          console.log(`      Rol: ${profile.role || 'No especificado'}`);
        });
      }
    }
    
    // Intentar crear usuario si no existe
    if ((!users || users.length === 0) && (!profiles || profiles.length === 0)) {
      console.log('\n🔧 USUARIO NO ENCONTRADO - Intentando crear...');
      
      // Primero intentar registrar en Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: targetEmail,
        password: 'Luimorca22',
        options: {
          data: {
            name: 'Luis Fernando Domínguez'
          }
        }
      });
      
      if (signUpError) {
        console.log('❌ Error creando usuario en auth:', signUpError.message);
      } else {
        console.log('✅ Usuario creado en auth:', signUpData.user?.email);
        
        // Intentar crear perfil en tabla users
        if (signUpData.user) {
          const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert({
              id: signUpData.user.id,
              email: targetEmail,
              name: 'Luis Fernando Domínguez',
              role: 'admin',
              is_active: true,
              created_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.log('❌ Error creando perfil en users:', insertError.message);
          } else {
            console.log('✅ Perfil creado en tabla users');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkUserExists().then(() => {
  console.log('\n✅ Verificación completada');
}).catch(error => {
  console.error('❌ Error en verificación:', error);
});