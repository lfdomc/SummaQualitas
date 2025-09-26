require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Configuración de Supabase:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Configurada' : 'No configurada');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  try {
    console.log('\n🔐 Probando login con credenciales...');
    
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
    console.log('Session:', data.session ? 'Activa' : 'No activa');
    
    // Verificar sesión actual
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('\n📋 Sesión actual:');
    console.log('Usuario en sesión:', sessionData.session?.user?.email || 'No hay usuario');
    
    // Probar obtener el perfil
    if (sessionData.session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', sessionData.session.user.email)
        .single();
        
      if (profileError) {
        console.error('❌ Error obteniendo perfil:', profileError.message);
      } else {
        console.log('👤 Perfil encontrado:', profile);
      }
    }
    
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
  }
}

testLogin();