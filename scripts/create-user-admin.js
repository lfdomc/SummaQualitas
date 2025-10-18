require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.log('URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.log('Service Key:', supabaseServiceKey ? 'OK' : 'MISSING');
  process.exit(1);
}

// Cliente con permisos de administrador
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUserAdmin() {
  console.log('🔧 CREANDO USUARIO CON PERMISOS DE ADMINISTRADOR');
  console.log('===============================================');
  
  const targetEmail = 'lfdomc@gmail.com';
  const targetPassword = 'Luimorca22';
  
  try {
    // 1. Verificar si el usuario ya existe en la tabla users
    console.log(`\n📋 Verificando usuario existente: ${targetEmail}`);
    
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', targetEmail);
    
    if (checkError) {
      console.log('❌ Error verificando usuario:', checkError.message);
    } else if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Usuario ya existe en tabla users');
      console.log('   - ID:', existingUsers[0].id);
      console.log('   - Email:', existingUsers[0].email);
      console.log('   - Rol:', existingUsers[0].role);
      console.log('   - Activo:', existingUsers[0].is_active ? 'Sí' : 'No');
      
      // Probar login
      console.log('\n🔐 Probando login...');
      const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email: targetEmail,
        password: targetPassword,
      });
      
      if (loginError) {
        console.log('❌ Error en login:', loginError.message);
      } else {
        console.log('✅ Login exitoso!');
      }
      
      return;
    }
    
    // 2. Verificar si existe en Supabase Auth
    console.log('\n🔍 Verificando en Supabase Auth...');
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error listando usuarios de auth:', authError.message);
    } else {
      const authUser = authUsers.users.find(user => user.email === targetEmail);
      
      if (authUser) {
        console.log('✅ Usuario encontrado en Supabase Auth');
        console.log('   - ID:', authUser.id);
        console.log('   - Email:', authUser.email);
        console.log('   - Confirmado:', authUser.email_confirmed_at ? 'Sí' : 'No');
        
        // 3. Crear perfil en tabla users usando el ID de auth
        console.log('\n🔧 Creando perfil en tabla users...');
        
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUser.id,
            email: targetEmail,
            name: 'Luis Fernando Domínguez',
            role: 'gerencia',
            is_active: true,
            created_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.log('❌ Error creando perfil:', insertError.message);
        } else {
          console.log('✅ Perfil creado exitosamente');
          
          // 4. Verificar login final
          console.log('\n🔐 Verificando login final...');
          const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
          const { data: finalLogin, error: finalError } = await supabaseClient.auth.signInWithPassword({
            email: targetEmail,
            password: targetPassword,
          });
          
          if (finalError) {
            console.log('❌ Error en login final:', finalError.message);
          } else {
            console.log('✅ Login final exitoso!');
            console.log('   - Usuario ID:', finalLogin.user?.id);
            console.log('   - Email:', finalLogin.user?.email);
          }
        }
      } else {
        console.log('❌ Usuario no encontrado en Supabase Auth');
        console.log('🔧 Creando usuario en Supabase Auth...');
        
        // Crear usuario en Supabase Auth
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: targetEmail,
          password: targetPassword,
          email_confirm: true,
          user_metadata: {
            name: 'Luis Fernando Domínguez'
          }
        });
        
        if (createError) {
          console.log('❌ Error creando usuario en auth:', createError.message);
        } else {
          console.log('✅ Usuario creado en Supabase Auth');
          console.log('   - ID:', createData.user?.id);
          
          // Crear perfil en tabla users
          if (createData.user) {
            const { data: insertData, error: insertError } = await supabaseAdmin
              .from('users')
              .insert({
                id: createData.user.id,
                email: targetEmail,
                name: 'Luis Fernando Domínguez',
                role: 'gerencia',
                is_active: true,
                created_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.log('❌ Error creando perfil:', insertError.message);
            } else {
              console.log('✅ Perfil creado exitosamente');
              
              // Verificar login
              console.log('\n🔐 Verificando login...');
              const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
              const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
                email: targetEmail,
                password: targetPassword,
              });
              
              if (loginError) {
                console.log('❌ Error en login:', loginError.message);
              } else {
                console.log('✅ Login exitoso!');
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

createUserAdmin().then(() => {
  console.log('\n✅ Proceso completado');
}).catch(error => {
  console.error('❌ Error en proceso:', error);
});