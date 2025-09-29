// Script de diagnóstico para verificar la configuración de autenticación
console.log('🔍 [Debug Auth] Verificando configuración de Supabase...');

// Verificar variables de entorno
console.log('📋 [Debug Auth] Variables de entorno:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada ✅' : 'No configurada ❌');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada ✅' : 'No configurada ❌');

// Verificar que las variables no estén vacías
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está configurada');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada');
}

// Verificar formato de URL
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('✅ URL de Supabase tiene formato válido');
  } catch (error) {
    console.error('❌ URL de Supabase tiene formato inválido:', error.message);
  }
}

// Verificar formato de JWT
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const parts = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.');
  if (parts.length === 3) {
    console.log('✅ ANON_KEY tiene formato JWT válido');
  } else {
    console.error('❌ ANON_KEY no tiene formato JWT válido');
  }
}

console.log('🔍 [Debug Auth] Diagnóstico completado');