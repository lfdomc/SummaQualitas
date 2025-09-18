require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE AUTENTICACIÓN');
  console.log('====================================');
  
  try {
    // Verificar usuarios en auth.users
    console.log('\n📋 Verificando usuarios en auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error accediendo a auth.users:', authError.message);
      console.log('ℹ️  Esto es normal si no tienes permisos de admin');
    } else {
      console.log(`✅ Usuarios en auth.users: ${authUsers?.users?.length || 0}`);
      
      if (authUsers?.users && authUsers.users.length > 0) {
        console.log('\n👥 USUARIOS ENCONTRADOS:');
        authUsers.users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}`);
          console.log(`      Email: ${user.email}`);
          console.log(`      Creado: ${user.created_at}`);
          console.log(`      Confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'}`);
        });
        
        // Para cada usuario, verificar si tiene perfil
        console.log('\n🔍 VERIFICANDO PERFILES PARA CADA USUARIO:');
        for (const user of authUsers.users) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id);
            
          if (profileError) {
            console.log(`   ❌ Error verificando perfil para ${user.email}:`, profileError.message);
          } else {
            console.log(`   Usuario ${user.email}: ${profile?.length || 0} perfiles encontrados`);
            if (profile && profile.length > 1) {
              console.log(`   ⚠️  MÚLTIPLES PERFILES DETECTADOS para ${user.email}`);
              profile.forEach((p, i) => {
                console.log(`      Perfil ${i + 1}: ${JSON.stringify(p, null, 2)}`);
              });
            }
          }
        }
      }
    }
    
    // Verificar sesión actual
    console.log('\n🔐 Verificando sesión actual...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Error obteniendo sesión:', sessionError.message);
    } else if (session?.session) {
      console.log('✅ Sesión activa encontrada:');
      console.log(`   Usuario ID: ${session.session.user.id}`);
      console.log(`   Email: ${session.session.user.email}`);
      
      // Intentar obtener el perfil del usuario actual
      console.log('\n🔍 Intentando obtener perfil del usuario actual...');
      try {
        const { data: currentProfile, error: currentProfileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.session.user.id)
          .single();
          
        if (currentProfileError) {
          console.log('❌ Error obteniendo perfil actual:', currentProfileError.message);
          console.log('   Código:', currentProfileError.code);
          
          if (currentProfileError.code === 'PGRST116') {
            console.log('ℹ️  No se encontró perfil para este usuario');
            
            // Crear perfil automáticamente
            console.log('\n🔧 Creando perfil automáticamente...');
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: session.session.user.id,
                email: session.session.user.email,
                full_name: session.session.user.user_metadata?.full_name || session.session.user.email?.split('@')[0] || 'Usuario',
                role: 'cliente'
              })
              .select()
              .single();
              
            if (createError) {
              console.log('❌ Error creando perfil:', createError.message);
            } else {
              console.log('✅ Perfil creado exitosamente:', newProfile);
            }
          }
        } else {
          console.log('✅ Perfil encontrado:', currentProfile);
        }
      } catch (error) {
        console.log('❌ Error inesperado obteniendo perfil:', error.message);
      }
    } else {
      console.log('ℹ️  No hay sesión activa');
    }
    
    // Verificar políticas RLS
    console.log('\n🛡️  Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'user_profiles' })
      .catch(() => ({ data: null, error: { message: 'RPC no disponible' } }));
      
    if (policiesError) {
      console.log('ℹ️  No se pudieron verificar las políticas RLS:', policiesError.message);
    } else {
      console.log('✅ Políticas RLS verificadas');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkAuthStatus()
  .then(() => {
    console.log('\n✅ Verificación de autenticación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });