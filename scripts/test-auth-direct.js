const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

async function testAuth() {
  console.log('🔍 Probando autenticación directa...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Verificar sesión actual
    console.log('1. Verificando sesión actual...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError.message);
    } else {
      console.log('✅ Sesión obtenida:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        expiresAt: session?.expires_at
      });
    }
    
    // 2. Intentar login con credenciales de prueba
    console.log('\n2. Intentando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'lfdomc@gmail.com',
      password: 'Luimorca22'
    });
    
    if (loginError) {
      console.error('❌ Error en login:', loginError.message);
    } else {
      console.log('✅ Login exitoso:', {
        hasUser: !!loginData.user,
        userEmail: loginData.user?.email,
        hasSession: !!loginData.session
      });
    }
    
    // 3. Verificar sesión después del login
    console.log('\n3. Verificando sesión después del login...');
    const { data: { session: newSession }, error: newSessionError } = await supabase.auth.getSession();
    
    if (newSessionError) {
      console.error('❌ Error obteniendo nueva sesión:', newSessionError.message);
    } else {
      console.log('✅ Nueva sesión:', {
        hasSession: !!newSession,
        hasUser: !!newSession?.user,
        userEmail: newSession?.user?.email
      });
    }
    
    // 4. Probar acceso a datos protegidos
    console.log('\n4. Probando acceso a datos protegidos...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(5);
    
    if (projectsError) {
      console.error('❌ Error accediendo a proyectos:', projectsError.message);
    } else {
      console.log('✅ Proyectos obtenidos:', projects?.length || 0);
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message);
  }
}

testAuth().catch(console.error);