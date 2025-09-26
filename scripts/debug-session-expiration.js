const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSessionExpiration() {
  console.log('🔍 Diagnóstico de Expiración de Sesión en Producción\n');
  
  try {
    // 1. Verificar configuración de JWT
    console.log('1️⃣ Verificando configuración de JWT...');
    
    // Leer configuración de Supabase
    const configPath = path.join(__dirname, '..', 'supabase', 'config.toml');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Extraer jwt_expiry
      const jwtExpiryMatch = configContent.match(/jwt_expiry\s*=\s*(\d+)/);
      const jwtExpiry = jwtExpiryMatch ? parseInt(jwtExpiryMatch[1]) : 3600;
      
      console.log(`📊 JWT Expiry configurado: ${jwtExpiry} segundos (${jwtExpiry / 60} minutos)`);
      
      if (jwtExpiry <= 3600) {
        console.log('⚠️  JWT expira en 1 hora o menos - esto puede causar desconexiones frecuentes');
        console.log('💡 Recomendación: Aumentar jwt_expiry a 86400 (24 horas) o más');
      } else {
        console.log('✅ JWT expiry configurado correctamente');
      }
      
      // Verificar refresh token rotation
      const refreshTokenMatch = configContent.match(/enable_refresh_token_rotation\s*=\s*(true|false)/);
      const refreshTokenEnabled = refreshTokenMatch ? refreshTokenMatch[1] === 'true' : true;
      
      console.log(`📊 Refresh Token Rotation: ${refreshTokenEnabled ? 'Habilitado' : 'Deshabilitado'}`);
      
      if (!refreshTokenEnabled) {
        console.log('⚠️  Refresh Token Rotation deshabilitado - puede causar problemas de sesión');
      }
      
    } else {
      console.log('❌ No se encontró archivo de configuración de Supabase');
    }

    // 2. Verificar middleware
    console.log('\n2️⃣ Verificando configuración de middleware...');
    
    const middlewarePath = path.join(__dirname, '..', 'lib', 'supabase', 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      
      if (middlewareContent.includes('getClaims()')) {
        console.log('✅ Middleware usa getClaims() - correcto para SSR');
      } else if (middlewareContent.includes('getUser()')) {
        console.log('⚠️  Middleware usa getUser() - puede causar desconexiones aleatorias');
        console.log('💡 Recomendación: Cambiar a getClaims() para mejor estabilidad');
      }
      
      if (middlewareContent.includes('hasEnvVars')) {
        console.log('✅ Middleware verifica variables de entorno');
      } else {
        console.log('⚠️  Middleware no verifica variables de entorno');
      }
    }

    // 3. Simular autenticación y verificar sesión
    console.log('\n3️⃣ Simulando autenticación...');
    
    try {
      // Intentar autenticación con credenciales de prueba
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@summaqualitas.com',
        password: 'admin123'
      });
      
      if (authError) {
        console.log('⚠️  No se pudo autenticar con credenciales de prueba:', authError.message);
        console.log('💡 Esto es normal si las credenciales no existen');
      } else {
        console.log('✅ Autenticación exitosa');
        
        // Verificar información de la sesión
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const session = sessionData.session;
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = session.expires_at || 0;
          const timeUntilExpiry = expiresAt - now;
          
          console.log(`📊 Sesión expira en: ${timeUntilExpiry} segundos (${Math.floor(timeUntilExpiry / 60)} minutos)`);
          console.log(`📊 Access Token presente: ${session.access_token ? 'Sí' : 'No'}`);
          console.log(`📊 Refresh Token presente: ${session.refresh_token ? 'Sí' : 'No'}`);
          
          if (timeUntilExpiry < 300) { // Menos de 5 minutos
            console.log('⚠️  La sesión expira pronto - esto puede causar el problema');
          }
        }
        
        // Cerrar sesión para limpiar
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.log('⚠️  Error en simulación de autenticación:', error.message);
    }

    // 4. Verificar configuración de cookies
    console.log('\n4️⃣ Verificando configuración de cookies...');
    
    const clientPath = path.join(__dirname, '..', 'lib', 'supabase', 'client.ts');
    if (fs.existsSync(clientPath)) {
      const clientContent = fs.readFileSync(clientPath, 'utf8');
      
      if (clientContent.includes('persistSession: true')) {
        console.log('✅ Persistencia de sesión habilitada');
      } else if (clientContent.includes('persistSession: false')) {
        console.log('⚠️  Persistencia de sesión deshabilitada - puede causar pérdida de sesión');
      } else {
        console.log('📊 Persistencia de sesión: configuración por defecto (habilitada)');
      }
      
      if (clientContent.includes('autoRefreshToken: true')) {
        console.log('✅ Auto-refresh de token habilitado');
      } else if (clientContent.includes('autoRefreshToken: false')) {
        console.log('⚠️  Auto-refresh de token deshabilitado - puede causar expiración');
      } else {
        console.log('📊 Auto-refresh de token: configuración por defecto (habilitado)');
      }
    }

    // 5. Verificar configuración de producción
    console.log('\n5️⃣ Verificando configuración específica de producción...');
    
    console.log('🔧 Variables de entorno requeridas en Vercel:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY (para middleware)');
    
    console.log('\n🔧 Configuración requerida en Supabase Dashboard:');
    console.log('   - Site URL: https://tu-dominio-produccion.vercel.app');
    console.log('   - Redirect URLs:');
    console.log('     * https://tu-dominio-produccion.vercel.app/auth/callback');
    console.log('     * https://tu-dominio-produccion.vercel.app/login');
    console.log('     * https://tu-dominio-produccion.vercel.app/');
    console.log('     * https://tu-dominio-produccion.vercel.app/**');

    // 6. Diagnóstico final y recomendaciones
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('\nPosibles causas del problema "Sesión después del login: {hasSession: false}":');
    console.log('1. ⏰ JWT expira muy rápido (1 hora por defecto)');
    console.log('2. 🔄 Problemas con refresh token rotation');
    console.log('3. 🌐 Configuración incorrecta de Site URL/Redirect URLs en Supabase');
    console.log('4. 🍪 Problemas de cookies entre dominios');
    console.log('5. 🔧 Middleware que causa desconexiones aleatorias');

    console.log('\n💡 SOLUCIONES RECOMENDADAS:');
    console.log('1. 📈 Aumentar jwt_expiry en Supabase a 86400 (24 horas)');
    console.log('2. ✅ Verificar que Site URL y Redirect URLs estén correctos');
    console.log('3. 🔄 Asegurar que refresh token rotation esté habilitado');
    console.log('4. 🍪 Verificar configuración de cookies en producción');
    console.log('5. 🔧 Usar getClaims() en lugar de getUser() en middleware');

    console.log('\n🚀 PASOS INMEDIATOS:');
    console.log('1. Ve a tu Supabase Dashboard > Authentication > Settings');
    console.log('2. Aumenta "JWT expiry" de 3600 a 86400 segundos');
    console.log('3. Verifica que "Site URL" sea tu dominio de producción exacto');
    console.log('4. Agrega todas las URLs de redirect necesarias');
    console.log('5. Redeploya tu aplicación en Vercel');

  } catch (error) {
    console.error('💥 Error general en el diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
debugSessionExpiration();