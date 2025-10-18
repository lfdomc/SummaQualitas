require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserWithCorrectRole() {
  console.log('🔧 CREANDO USUARIO CON ROL CORRECTO');
  console.log('==================================');
  
  const targetEmail = 'lfdomc@gmail.com';
  const targetPassword = 'Luimorca22';
  
  try {
    // Verificar si el usuario ya existe en la tabla users
    console.log(`\n📋 Verificando si el usuario ya existe...`);
    
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail);
    
    if (checkError) {
      console.log('❌ Error verificando usuario existente:', checkError.message);
    } else if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Usuario ya existe en tabla users:', existingUsers[0].email);
      console.log('   - Rol actual:', existingUsers[0].role);
      console.log('   - Activo:', existingUsers[0].is_active ? 'Sí' : 'No');
      
      // Intentar hacer login para verificar que funciona
      console.log('\n🔐 Probando login con credenciales existentes...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPassword,
      });
      
      if (loginError) {
        console.log('❌ Error en login:', loginError.message);
      } else {
        console.log('✅ Login exitoso!');
        console.log('   - Usuario ID:', loginData.user?.id);
        console.log('   - Email:', loginData.user?.email);
      }
      
      return;
    }
    
    // Verificar si existe en Supabase Auth pero no en la tabla users
    console.log('\n🔍 Verificando usuario en Supabase Auth...');
    
    // Intentar hacer login para ver si existe en auth
    const { data: authCheck, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    });
    
    if (!authError && authCheck.user) {
      console.log('✅ Usuario existe en Supabase Auth pero no en tabla users');
      console.log('🔧 Creando perfil en tabla users...');
      
      // Crear perfil en tabla users con rol correcto
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authCheck.user.id,
          email: targetEmail,
          name: 'Luis Fernando Domínguez',
          role: 'gerencia', // Usar rol válido
          is_active: true,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.log('❌ Error creando perfil en users:', insertError.message);
      } else {
        console.log('✅ Perfil creado exitosamente en tabla users');
        
        // Verificar que el login funciona ahora
        console.log('\n🔐 Verificando login después de crear perfil...');
        const { data: finalLogin, error: finalError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: targetPassword,
        });
        
        if (finalError) {
          console.log('❌ Error en login final:', finalError.message);
        } else {
          console.log('✅ Login final exitoso!');
        }
      }
    } else {
      console.log('❌ Usuario no existe en Supabase Auth');
      console.log('🔧 El usuario ya fue creado anteriormente, pero puede haber un problema');
      
      // Intentar crear el perfil directamente con un ID generado
      console.log('\n🔧 Intentando crear perfil con ID generado...');
      
      // Generar un UUID simple para prueba
      const crypto = require('crypto');
      const userId = crypto.randomUUID();
      
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: targetEmail,
          name: 'Luis Fernando Domínguez',
          role: 'gerencia',
          is_active: true,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.log('❌ Error creando perfil con ID generado:', insertError.message);
      } else {
        console.log('✅ Perfil creado con ID generado');
        console.log('⚠️  Nota: Este usuario no tendrá autenticación en Supabase Auth');
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

createUserWithCorrectRole().then(() => {
  console.log('\n✅ Proceso completado');
}).catch(error => {
  console.error('❌ Error en proceso:', error);
});