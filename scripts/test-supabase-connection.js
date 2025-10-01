require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 [Test] Iniciando prueba de conexión con Supabase...');
console.log('📍 URL:', supabaseUrl ? 'Configurada' : 'NO CONFIGURADA');
console.log('🔑 Key:', supabaseKey ? 'Configurada' : 'NO CONFIGURADA');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🔍 Probando conexión básica...');
    
    // Test 1: Verificar conexión básica
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Error en conexión básica:', error.message);
      return false;
    }
    
    console.log('✅ Conexión básica exitosa');
    
    // Test 2: Verificar autenticación
    console.log('\n🔐 Probando estado de autenticación...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError.message);
      return false;
    }
    
    console.log('✅ Estado de autenticación:', session?.user ? 'Usuario logueado' : 'Sin usuario');
    
    // Test 3: Verificar estructura de tabla users
    console.log('\n📋 Verificando estructura de tabla users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error accediendo a tabla users:', usersError.message);
      console.log('💡 Esto podría indicar que la tabla no existe o no tienes permisos');
      return false;
    }
    
    console.log('✅ Tabla users accesible');
    console.log('📊 Estructura verificada:', users?.length > 0 ? 'Con datos' : 'Sin datos');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    return false;
  }
}

async function testAuth() {
  try {
    console.log('\n🧪 Probando flujo de autenticación...');
    
    // Simular un intento de login (sin credenciales reales)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
    // Esperamos que falle, pero sin errores de conexión
    if (error && error.message.includes('Invalid login credentials')) {
      console.log('✅ Flujo de autenticación funciona (credenciales inválidas esperadas)');
      return true;
    } else if (error) {
      console.error('❌ Error inesperado en autenticación:', error.message);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error inesperado en test de auth:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico completo...\n');
  
  const connectionOk = await testConnection();
  const authOk = await testAuth();
  
  console.log('\n📋 RESUMEN:');
  console.log('🔗 Conexión:', connectionOk ? '✅ OK' : '❌ FALLO');
  console.log('🔐 Autenticación:', authOk ? '✅ OK' : '❌ FALLO');
  
  if (connectionOk && authOk) {
    console.log('\n🎉 Supabase está funcionando correctamente');
    console.log('💡 El problema podría estar en la lógica del frontend');
  } else {
    console.log('\n⚠️ Hay problemas con la configuración de Supabase');
    console.log('💡 Revisa la configuración del proyecto en Supabase Dashboard');
  }
}

main().catch(console.error);