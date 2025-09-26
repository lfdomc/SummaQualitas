require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Configuración de Supabase:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Configurada' : 'No configurada');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullLogin() {
  try {
    console.log('\n🔐 Paso 1: Probando login...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'lfdomc@gmail.com',
      password: 'admin123',
    });

    if (error) {
      console.error('❌ Error en login:', error.message);
      return;
    }

    console.log('✅ Login exitoso!');
    console.log('Usuario:', data.user?.email);
    console.log('Access Token:', data.session?.access_token ? 'Presente' : 'Ausente');
    console.log('Refresh Token:', data.session?.refresh_token ? 'Presente' : 'Ausente');
    
    console.log('\n📋 Paso 2: Verificando sesión...');
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Usuario en sesión:', sessionData.session?.user?.email || 'No hay usuario');
    
    console.log('\n👤 Paso 3: Obteniendo perfil...');
    if (sessionData.session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', sessionData.session.user.email)
        .single();
        
      if (profileError) {
        console.error('❌ Error obteniendo perfil:', profileError.message);
      } else {
        console.log('✅ Perfil encontrado:', profile.name, '-', profile.role);
      }
    }
    
    console.log('\n🍪 Paso 4: Información de cookies/tokens...');
    console.log('Session expires at:', new Date(sessionData.session?.expires_at * 1000));
    
    // Simular espera y verificar que la sesión persiste
    console.log('\n⏳ Paso 5: Esperando 2 segundos y verificando persistencia...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: persistedSession } = await supabase.auth.getSession();
    console.log('Sesión persistida:', persistedSession.session?.user?.email || 'No persistida');
    
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
  }
}

testFullLogin();