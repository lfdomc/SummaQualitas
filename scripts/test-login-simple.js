const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔐 Diagnóstico Simple de Login\n');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  const email = 'lfdomc@gmail.com';
  const password = 'Luimorca22';
  
  console.log('📧 Probando login con:', email);
  console.log('');

  try {
    // Test 1: Verificar conexión básica
    console.log('1️⃣ Verificando conexión básica...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (projectsError) {
      console.error('❌ Error de conexión:', projectsError.message);
      return;
    }
    console.log('✅ Conexión a base de datos exitosa');
    console.log('');

    // Test 2: Intentar login directo
    console.log('2️⃣ Intentando login con Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (authError) {
      console.error('❌ Error en login:', authError.message);
      console.error('   🔍 Código de error:', authError.status);
      console.error('   📝 Tipo de error:', authError.name);
      
      // Verificar si es un problema de usuario no encontrado
      if (authError.message.includes('Invalid login credentials')) {
        console.log('\n🔍 Posibles causas:');
        console.log('   1. El usuario no existe en Supabase Auth');
        console.log('   2. La contraseña es incorrecta');
        console.log('   3. El email no está confirmado');
        console.log('   4. El usuario está deshabilitado');
      }
    } else {
      console.log('✅ Login exitoso');
      console.log('   👤 Usuario autenticado:', {
        id: authData.user?.id,
        email: authData.user?.email,
        email_confirmed: authData.user?.email_confirmed_at ? 'Sí' : 'No',
        created_at: authData.user?.created_at,
        last_sign_in: authData.user?.last_sign_in_at
      });
      
      if (authData.session) {
        console.log('   🎫 Sesión creada exitosamente');
        console.log('   ⏰ Expira en:', new Date(authData.session.expires_at * 1000).toLocaleString());
      }
    }

    console.log('');

    // Test 3: Verificar usuarios en auth.users (si tenemos permisos)
    console.log('3️⃣ Verificando configuración de autenticación...');
    console.log('   🌐 Supabase URL:', supabaseUrl);
    console.log('   🔑 Anon Key configurada:', supabaseKey ? 'Sí' : 'No');
    
    // Test 4: Verificar sesión después del login
    console.log('');
    console.log('4️⃣ Verificando sesión actual...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError.message);
    } else {
      console.log('✅ Sesión verificada');
      console.log('   📊 Estado:', {
        hasSession: !!sessionData.session,
        user: sessionData.session?.user?.email || 'No autenticado'
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('   📋 Stack:', error.stack);
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico simple de login...\n');
  await testLogin();
  console.log('\n🎯 Diagnóstico completado');
}

main().catch(console.error);