#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Verificación Pre-Despliegue para Vercel\n');

let hasErrors = false;

// Verificar archivos esenciales
const requiredFiles = [
  'package.json',
  'next.config.mjs',
  'vercel.json',
  '.env.local',
  'middleware.ts'
];

console.log('📁 Verificando archivos esenciales...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
    hasErrors = true;
  }
});

// Verificar variables de entorno
console.log('\n🔐 Verificando variables de entorno...');
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar) && !envContent.includes(`${envVar}=your_`)) {
      console.log(`✅ ${envVar}`);
    } else {
      console.log(`❌ ${envVar} - NO CONFIGURADA`);
      hasErrors = true;
    }
  });
} else {
  console.log('❌ Archivo .env.local no encontrado');
  hasErrors = true;
}

// Verificar configuración de Supabase
console.log('\n🗄️ Verificando configuración de Supabase...');
const supabaseFiles = [
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'lib/auth/middleware.ts'
];

supabaseFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
    hasErrors = true;
  }
});

// Verificar build
console.log('\n🔨 Verificando build...');
if (fs.existsSync('.next')) {
  console.log('✅ Directorio .next existe');
  
  // Verificar archivos críticos del build
  const buildFiles = [
    '.next/BUILD_ID',
    '.next/static'
  ];
  
  buildFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`⚠️ ${file} - Ejecuta 'npm run build'`);
    }
  });
} else {
  console.log('❌ Directorio .next no encontrado - Ejecuta \'npm run build\'');
  hasErrors = true;
}

// Verificar package.json scripts
console.log('\n📦 Verificando scripts de package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'start', 'dev'];

requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ Script '${script}' configurado`);
  } else {
    console.log(`❌ Script '${script}' faltante`);
    hasErrors = true;
  }
});

// Verificar dependencias críticas
console.log('\n📚 Verificando dependencias críticas...');
const criticalDeps = [
  '@supabase/supabase-js',
  '@supabase/ssr',
  'next',
  'react',
  'typescript'
];

const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
criticalDeps.forEach(dep => {
  if (allDeps[dep]) {
    console.log(`✅ ${dep} v${allDeps[dep]}`);
  } else {
    console.log(`❌ ${dep} - NO INSTALADA`);
    hasErrors = true;
  }
});

// Resultado final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ VERIFICACIÓN FALLIDA');
  console.log('\n🔧 Acciones requeridas:');
  console.log('1. Corrige los errores mostrados arriba');
  console.log('2. Ejecuta \'npm run build\' para verificar el build');
  console.log('3. Ejecuta este script nuevamente');
  console.log('\n📖 Consulta DEPLOYMENT.md para más detalles');
  process.exit(1);
} else {
  console.log('✅ VERIFICACIÓN EXITOSA');
  console.log('\n🎉 Tu proyecto está listo para desplegar en Vercel!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Sube tu código a Git');
  console.log('2. Conecta tu repositorio en Vercel');
  console.log('3. Configura las variables de entorno en Vercel');
  console.log('4. Despliega tu proyecto');
  console.log('\n📖 Consulta DEPLOYMENT.md para instrucciones detalladas');
  process.exit(0);
}