require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const email = 'lfdomc@gmail.com';
  const password = 'Luimorca22';
  
  console.log('🔍 Probando login con:', email);
  console.log('🔗 Supabase URL:', supabaseUrl);
  
  try {
    console.log('\n1️⃣ Intentando login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Error de login:', error);
      console.error('   - Código:', error.status);
      console.error('   - Mensaje:', error.message);
      return;
    }

    if (data.user) {
      console.log('✅ Login exitoso!');
      console.log('   - User ID:', data.user.id);
      console.log('   - Email:', data.user.email);
      console.log('   - Email confirmado:', data.user.email_confirmed_at ? '✅' : '❌');
      
      if (data.session) {
        console.log('   - Session token:', data.session.access_token ? '✅ Presente' : '❌ Ausente');
        console.log('   - Expira en:', new Date(data.session.expires_at * 1000));
      }
    }

    // Verificar el usuario actual
    console.log('\n2️⃣ Verificando sesión actual...');
    const { data: currentUser, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error al obtener usuario actual:', userError);
    } else if (currentUser.user) {
      console.log('✅ Usuario autenticado:', currentUser.user.email);
    } else {
      console.log('❌ No hay usuario autenticado');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testLogin();