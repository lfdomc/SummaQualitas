#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Script de Corrección para Autenticación en Producción\n');

console.log('🎯 PROBLEMA IDENTIFICADO:');
console.log('Estás logueado en producción pero el sistema muestra "Acceso Requerido"');
console.log('Esto indica un problema de configuración de URLs o cookies.\n');

console.log('🔍 CAUSAS MÁS COMUNES:\n');

console.log('1. 🌐 URLs de Callback no configuradas en Supabase');
console.log('   - La URL de producción no está en las "Redirect URLs" de Supabase');
console.log('   - La "Site URL" no coincide con el dominio de producción\n');

console.log('2. 🍪 Problemas de Cookies en Producción');
console.log('   - Configuración de cookies secure/sameSite incorrecta');
console.log('   - Dominio de cookies no coincide\n');

console.log('3. 🔒 Configuración de Middleware');
console.log('   - El middleware no está reconociendo la sesión');
console.log('   - Problemas con la verificación de claims\n');

console.log('📋 SOLUCIONES PASO A PASO:\n');

console.log('🔧 PASO 1: Configurar URLs en Supabase');
console.log('1. Ve a: https://supabase.com/dashboard/project/hypravgvtrlfpepslhmc/auth/url-configuration');
console.log('2. En "Site URL", pon tu URL de producción (ej: https://tu-app.vercel.app)');
console.log('3. En "Redirect URLs", agrega:');
console.log('   - https://tu-app.vercel.app/auth/callback');
console.log('   - https://tu-app.vercel.app/login');
console.log('   - https://tu-app.vercel.app/');
console.log('   - https://tu-app-*.vercel.app/auth/callback (para previews)');
console.log('4. Guarda los cambios\n');

console.log('🔧 PASO 2: Verificar Variables de Entorno en Vercel');
console.log('1. Ve a tu proyecto en Vercel Dashboard');
console.log('2. Settings > Environment Variables');
console.log('3. Verifica que estén configuradas:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   - SUPABASE_SERVICE_ROLE_KEY');
console.log('4. Redeploy después de cambios\n');

console.log('🔧 PASO 3: Verificar Configuración de Cookies');
console.log('Revisando configuración actual de cookies...\n');

// Verificar configuración de cookies en server.ts
const serverTsPath = path.join(process.cwd(), 'lib', 'supabase', 'server.ts');
if (fs.existsSync(serverTsPath)) {
  const content = fs.readFileSync(serverTsPath, 'utf8');
  
  console.log('📁 Configuración en lib/supabase/server.ts:');
  
  if (content.includes('secure: process.env.NODE_ENV === \'production\'')) {
    console.log('✅ Configuración de cookies secure: CORRECTA');
  } else {
    console.log('⚠️ Configuración de cookies secure: REVISAR');
  }
  
  if (content.includes('sameSite: \'lax\'')) {
    console.log('✅ Configuración sameSite: CORRECTA');
  } else {
    console.log('⚠️ Configuración sameSite: REVISAR');
  }
  
  if (content.includes('httpOnly: true')) {
    console.log('✅ Configuración httpOnly: CORRECTA');
  } else {
    console.log('⚠️ Configuración httpOnly: REVISAR');
  }
} else {
  console.log('❌ No se encontró lib/supabase/server.ts');
}

console.log('\n🔧 PASO 4: Verificar Middleware');
const middlewarePath = path.join(process.cwd(), 'lib', 'supabase', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const content = fs.readFileSync(middlewarePath, 'utf8');
  
  console.log('📁 Configuración en lib/supabase/middleware.ts:');
  
  if (content.includes('getClaims()')) {
    console.log('✅ Usando getClaims(): CORRECTO');
  } else {
    console.log('⚠️ No usa getClaims(): REVISAR');
  }
  
  if (content.includes('hasEnvVars')) {
    console.log('✅ Verificación de variables de entorno: PRESENTE');
  } else {
    console.log('⚠️ No verifica variables de entorno: REVISAR');
  }
} else {
  console.log('❌ No se encontró lib/supabase/middleware.ts');
}

console.log('\n🔧 PASO 5: Debugging en Producción');
console.log('Para debuggear en producción:');
console.log('1. Abre las herramientas de desarrollador en tu sitio de producción');
console.log('2. Ve a la pestaña "Application" > "Cookies"');
console.log('3. Busca cookies que empiecen con "sb-" (cookies de Supabase)');
console.log('4. Si no hay cookies de sesión, el problema es de autenticación');
console.log('5. Si hay cookies pero sigues viendo "Acceso Requerido", es problema de middleware\n');

console.log('🔧 PASO 6: Solución Temporal (Solo para Testing)');
console.log('Si necesitas una solución temporal para verificar que es problema de URLs:');
console.log('1. Ve a Supabase Auth Settings');
console.log('2. Agrega temporalmente "*" en Redirect URLs');
console.log('3. Prueba el login en producción');
console.log('4. Si funciona, confirma que es problema de URLs');
console.log('5. ¡IMPORTANTE: Quita el "*" y configura las URLs correctas!\n');

console.log('🚨 ACCIONES INMEDIATAS:');
console.log('1. Configura las URLs en Supabase (PASO 1)');
console.log('2. Verifica variables de entorno en Vercel (PASO 2)');
console.log('3. Redeploy tu aplicación');
console.log('4. Prueba el login nuevamente\n');

console.log('📞 Si el problema persiste:');
console.log('1. Revisa los logs de Vercel para errores específicos');
console.log('2. Verifica que no haya errores de CORS en la consola');
console.log('3. Confirma que la configuración de RLS en Supabase sea correcta\n');

console.log('✅ Script completado. Sigue los pasos arriba para solucionar el problema.');