#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

console.log('🔗 Verificación de URLs de Callback para Supabase\n');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL no está configurada');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectId = new URL(supabaseUrl).hostname.split('.')[0];

console.log(`📋 Proyecto Supabase: ${projectId}`);
console.log(`🌐 URL del proyecto: ${supabaseUrl}\n`);

console.log('🔧 URLs que DEBEN estar configuradas en Supabase Auth Settings:\n');

console.log('📍 Site URL (URL principal del sitio):');
console.log('   Para desarrollo: http://localhost:3000');
console.log('   Para producción: https://tu-dominio-de-produccion.com');
console.log('   (Esta debe ser la URL base de tu aplicación en producción)\n');

console.log('📍 Redirect URLs (URLs de redirección permitidas):');
console.log('   Para desarrollo:');
console.log('   - http://localhost:3000/auth/callback');
console.log('   - http://localhost:3000/login');
console.log('   - http://localhost:3000/');
console.log('');
console.log('   Para producción:');
console.log('   - https://tu-dominio-de-produccion.com/auth/callback');
console.log('   - https://tu-dominio-de-produccion.com/login');
console.log('   - https://tu-dominio-de-produccion.com/');
console.log('');
console.log('   Si usas Vercel:');
console.log('   - https://tu-proyecto.vercel.app/auth/callback');
console.log('   - https://tu-proyecto.vercel.app/login');
console.log('   - https://tu-proyecto.vercel.app/');
console.log('   - https://tu-proyecto-*.vercel.app/auth/callback (para preview deployments)');
console.log('   - https://tu-proyecto-*.vercel.app/login');
console.log('   - https://tu-proyecto-*.vercel.app/\n');

console.log('🚨 PROBLEMA COMÚN EN PRODUCCIÓN:');
console.log('Si estás logueado pero ves "Acceso Requerido", probablemente:');
console.log('1. La URL de producción NO está en las Redirect URLs de Supabase');
console.log('2. La Site URL no coincide con tu dominio de producción');
console.log('3. Las cookies no se están configurando correctamente\n');

console.log('📝 PASOS PARA SOLUCIONARLO:');
console.log('1. Ve a: https://supabase.com/dashboard/project/' + projectId + '/auth/url-configuration');
console.log('2. Agrega tu URL de producción a "Redirect URLs"');
console.log('3. Configura la "Site URL" con tu dominio de producción');
console.log('4. Guarda los cambios');
console.log('5. Espera unos minutos para que se propaguen los cambios');
console.log('6. Intenta hacer login nuevamente en producción\n');

console.log('🔍 VERIFICACIÓN ADICIONAL:');
console.log('Si el problema persiste, verifica en las herramientas de desarrollador:');
console.log('1. Network tab: busca errores 401/403 en las llamadas a Supabase');
console.log('2. Application tab: verifica que las cookies de sesión estén presentes');
console.log('3. Console: busca errores de CORS o autenticación\n');

console.log('💡 CONSEJO:');
console.log('Puedes probar temporalmente agregando "*" como wildcard en Redirect URLs');
console.log('para verificar si es un problema de configuración de URLs.');
console.log('¡IMPORTANTE: Quita el wildcard después de identificar las URLs correctas!\n');

// Verificar si hay archivos de configuración de Vercel
const fs = require('fs');
if (fs.existsSync('vercel.json')) {
  console.log('📁 Detectado vercel.json - Configuración para Vercel encontrada');
  
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    if (vercelConfig.regions) {
      console.log(`🌍 Regiones configuradas: ${vercelConfig.regions.join(', ')}`);
    }
  } catch (error) {
    console.log('⚠️ Error leyendo vercel.json');
  }
}

console.log('\n✅ Verificación completada. Sigue los pasos arriba para solucionar el problema.');