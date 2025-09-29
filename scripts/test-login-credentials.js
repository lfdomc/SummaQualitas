const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔐 Diagnóstico de Login - Credenciales Específicas\n');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginCredentials() {
  const email = 'lfdomc@gmail.com';
  const password = 'Luimorca22';
  
  console.log('📧 Probando login con:', email);
  console.log('🔑 Contraseña:', password.replace(/./g, '*'));
  console.log('');

  try {
    // Test 1: Verificar si el usuario existe
    console.log('1️⃣ Verificando si el usuario existe...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role')
      .eq('email', email);
    
    if (usersError) {
      console.error('❌ Error consultando user_profiles:', usersError.message);
    } else {
      console.log('✅ Consulta a user_profiles exitosa');
      console.log(`   👤 Usuarios encontrados: ${users?.length || 0}`);
      if (users && users.length > 0) {
        console.log('   📋 Usuario:', {
          id: users[0].id,
          email: users[0].email,
          full_name: users[0].full_name,
          role: users[0].role
        });
      }
    }

    console.log('');

    // Test 2: Intentar login
    console.log('2️⃣ Intentando login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (authError) {
      console.error('❌ Error en login:', authError.message);
      console.error('   🔍 Código de error:', authError.status);
      console.error('   📝 Detalles:', authError);
    } else {
      console.log('✅ Login exitoso');
      console.log('   👤 Usuario autenticado:', {
        id: authData.user?.id,
        email: authData.user?.email,
        email_confirmed: authData.user?.email_confirmed_at ? 'Sí' : 'No',
        last_sign_in: authData.user?.last_sign_in_at
      });
      console.log('   🎫 Sesión:', {
        access_token: authData.session?.access_token ? 'Presente' : 'Ausente',
        refresh_token: authData.session?.refresh_token ? 'Presente' : 'Ausente',
        expires_at: authData.session?.expires_at
      });
    }

    console.log('');

    // Test 3: Verificar sesión actual
    console.log('3️⃣ Verificando sesión actual...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError.message);
    } else {
      console.log('✅ Sesión obtenida');
      console.log('   📊 Estado de sesión:', {
        hasSession: !!sessionData.session,
        user: sessionData.session?.user?.email || 'No autenticado',
        expires_at: sessionData.session?.expires_at
      });
    }

    console.log('');

    // Test 4: Verificar configuración de autenticación
    console.log('4️⃣ Verificando configuración de autenticación...');
    console.log('   🌐 Supabase URL:', supabaseUrl);
    console.log('   🔑 Anon Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'No configurada');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('   📋 Stack:', error.stack);
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico de login...\n');
  
  // Verificar conexión básica
  console.log('🔗 Verificando conexión a Supabase...');
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return;
    }
    console.log('✅ Conexión exitosa\n');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return;
  }

  await testLoginCredentials();
  
  console.log('\n🎯 Diagnóstico de login completado');
}

main().catch(console.error);