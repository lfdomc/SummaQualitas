#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Diagnóstico de Autenticación para Producción\n');

// Verificar variables de entorno
console.log('📋 Variables de entorno:');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ No configurada'}`);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('\n❌ Variables de entorno faltantes. Verifica tu archivo .env.local');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  console.log('\n🔗 Probando conexión a Supabase...');
  
  try {
    // Probar conexión básica
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log(`❌ Error de conexión: ${error.message}`);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.log(`❌ Error de conexión: ${error.message}`);
    return false;
  }
}

async function testAuth() {
  console.log('\n🔐 Probando autenticación...');
  
  try {
    // Verificar estado de sesión
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log(`❌ Error al obtener sesión: ${error.message}`);
      return;
    }
    
    if (session) {
      console.log('✅ Sesión activa encontrada');
      console.log(`Usuario: ${session.user.email}`);
      console.log(`Expira: ${new Date(session.expires_at * 1000).toLocaleString()}`);
    } else {
      console.log('ℹ️ No hay sesión activa');
    }
    
    // Verificar usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log(`❌ Error al obtener usuario: ${userError.message}`);
      return;
    }
    
    if (user) {
      console.log('✅ Usuario autenticado');
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Último login: ${new Date(user.last_sign_in_at).toLocaleString()}`);
    } else {
      console.log('ℹ️ No hay usuario autenticado');
    }
    
  } catch (error) {
    console.log(`❌ Error en autenticación: ${error.message}`);
  }
}

async function testRLS() {
  console.log('\n🛡️ Probando Row Level Security (RLS)...');
  
  try {
    // Probar acceso a tabla con RLS
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST301') {
        console.log('❌ RLS está bloqueando el acceso - Usuario no autenticado o sin permisos');
      } else {
        console.log(`❌ Error RLS: ${error.message}`);
      }
    } else {
      console.log('✅ RLS permite el acceso');
      console.log(`Registros accesibles: ${data.length}`);
    }
  } catch (error) {
    console.log(`❌ Error probando RLS: ${error.message}`);
  }
}

async function checkEnvironment() {
  console.log('\n🌍 Verificando entorno...');
  
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Entorno detectado: ${process.env.NODE_ENV === 'production' ? 'Producción' : 'Desarrollo'}`);
  
  // Verificar URL de Supabase
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(`Proyecto Supabase: ${url.hostname.split('.')[0]}`);
  console.log(`Región: ${url.hostname.includes('aws') ? 'AWS' : 'Desconocida'}`);
}

async function main() {
  await checkEnvironment();
  
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ No se puede continuar sin conexión a Supabase');
    process.exit(1);
  }
  
  await testAuth();
  await testRLS();
  
  console.log('\n📋 Recomendaciones para producción:');
  console.log('1. Verifica que las variables de entorno estén configuradas en Vercel');
  console.log('2. Asegúrate de que la URL de callback esté configurada en Supabase');
  console.log('3. Verifica que las políticas RLS estén correctamente configuradas');
  console.log('4. Revisa los logs de Vercel para errores específicos');
  
  console.log('\n🔗 URLs importantes:');
  console.log(`- Dashboard Supabase: https://supabase.com/dashboard/project/${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]}`);
  console.log('- Configuración de Auth: Authentication > Settings');
  console.log('- Políticas RLS: Database > Tables > [tabla] > RLS');
}

main().catch(console.error);