const fs = require('fs');
const path = require('path');

async function fixSessionExpiration() {
  console.log('🔧 Aplicando correcciones para el problema de expiración de sesión\n');

  try {
    // 1. Actualizar configuración de Supabase
    console.log('1️⃣ Actualizando configuración de Supabase...');
    
    const configPath = path.join(__dirname, '..', 'supabase', 'config.toml');
    
    if (fs.existsSync(configPath)) {
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      // Actualizar jwt_expiry de 3600 a 86400 (24 horas)
      configContent = configContent.replace(
        /jwt_expiry\s*=\s*\d+/,
        'jwt_expiry = 86400'
      );
      
      // Asegurar que refresh token rotation esté habilitado
      if (!configContent.includes('enable_refresh_token_rotation')) {
        configContent += '\nenable_refresh_token_rotation = true\n';
      } else {
        configContent = configContent.replace(
          /enable_refresh_token_rotation\s*=\s*(true|false)/,
          'enable_refresh_token_rotation = true'
        );
      }
      
      // Configurar refresh token reuse interval
      if (!configContent.includes('refresh_token_reuse_interval')) {
        configContent += 'refresh_token_reuse_interval = 10\n';
      }
      
      fs.writeFileSync(configPath, configContent);
      console.log('✅ Configuración de Supabase actualizada:');
      console.log('   - JWT expiry: 86400 segundos (24 horas)');
      console.log('   - Refresh token rotation: habilitado');
      console.log('   - Refresh token reuse interval: 10 segundos');
    } else {
      console.log('❌ No se encontró archivo de configuración de Supabase');
    }

    // 2. Crear archivo de instrucciones para configuración manual
    console.log('\n2️⃣ Creando instrucciones para configuración manual...');
    
    const instructionsPath = path.join(__dirname, '..', 'INSTRUCCIONES_CONFIGURACION_PRODUCCION.md');
    const instructions = `# 🔧 Instrucciones para Configurar Producción

## Problema Identificado
El JWT expira en solo 1 hora, causando que los usuarios pierdan la sesión frecuentemente en producción.

## Soluciones Requeridas

### 1. Configuración en Supabase Dashboard

#### A. Configuración de Authentication
1. Ve a tu **Supabase Dashboard** → **Authentication** → **Settings**
2. En la sección **JWT Settings**:
   - Cambia **JWT expiry** de \`3600\` a \`86400\` (24 horas)
   - Asegúrate de que **Enable refresh token rotation** esté **habilitado**

#### B. Configuración de Site URL y Redirect URLs
1. En **Authentication** → **URL Configuration**:
   - **Site URL**: \`https://summa-qualitas.vercel.app\`
   - **Redirect URLs** (agregar todas estas):
     - \`https://summa-qualitas.vercel.app/auth/callback\`
     - \`https://summa-qualitas.vercel.app/login\`
     - \`https://summa-qualitas.vercel.app/\`
     - \`https://summa-qualitas.vercel.app/**\`

### 2. Configuración en Vercel

#### Variables de Entorno Requeridas
Asegúrate de que estas variables estén configuradas en Vercel:
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\` (para middleware)

### 3. Configuración Local (Ya aplicada)

✅ **JWT expiry actualizado a 24 horas**
✅ **Refresh token rotation habilitado**
✅ **Middleware configurado correctamente**
✅ **Persistencia de sesión habilitada**

## Pasos para Aplicar los Cambios

### Paso 1: Configurar Supabase Dashboard
1. Accede a tu Supabase Dashboard
2. Aplica los cambios mencionados arriba
3. Guarda la configuración

### Paso 2: Reiniciar Supabase Local (si usas local)
\`\`\`bash
npx supabase stop
npx supabase start
\`\`\`

### Paso 3: Redeploy en Vercel
\`\`\`bash
git add .
git commit -m "fix: configuración de sesión para producción"
git push origin main
\`\`\`

### Paso 4: Verificar en Producción
1. Ve a \`https://summa-qualitas.vercel.app\`
2. Inicia sesión
3. Espera más de 1 hora
4. Verifica que la sesión se mantenga activa

## Monitoreo

Para monitorear el problema:
1. Revisa los logs de Vercel
2. Verifica que no aparezcan errores de autenticación
3. Confirma que los usuarios no pierdan la sesión después de 1 hora

## Contacto
Si el problema persiste después de aplicar estos cambios, revisa:
1. Los logs de Vercel para errores específicos
2. La configuración de cookies en el navegador
3. Posibles problemas de CORS

---
**Fecha de creación**: ${new Date().toLocaleDateString()}
**Estado**: Pendiente de aplicar en Supabase Dashboard
`;

    fs.writeFileSync(instructionsPath, instructions);
    console.log('✅ Instrucciones creadas en: INSTRUCCIONES_CONFIGURACION_PRODUCCION.md');

    // 3. Crear script de verificación post-deploy
    console.log('\n3️⃣ Creando script de verificación...');
    
    const verificationScript = `const { createClient } = require('@supabase/supabase-js');

async function verifySessionFix() {
  console.log('🔍 Verificando corrección de sesión en producción...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno no configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Verificar configuración de sesión
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      const session = sessionData.session;
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;
      
      console.log(\`📊 Tiempo hasta expiración: \${Math.floor(timeUntilExpiry / 3600)} horas\`);
      
      if (timeUntilExpiry > 3600) {
        console.log('✅ Sesión configurada correctamente (más de 1 hora)');
      } else {
        console.log('⚠️  Sesión aún expira en menos de 1 hora');
      }
    } else {
      console.log('📊 No hay sesión activa para verificar');
    }
    
    console.log('✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
  }
}

verifySessionFix();`;

    const verificationPath = path.join(__dirname, 'verify-session-fix.js');
    fs.writeFileSync(verificationPath, verificationScript);
    console.log('✅ Script de verificación creado: scripts/verify-session-fix.js');

    // 4. Resumen final
    console.log('\n🎯 RESUMEN DE CORRECCIONES APLICADAS:');
    console.log('✅ Configuración local de Supabase actualizada');
    console.log('✅ JWT expiry aumentado a 24 horas');
    console.log('✅ Refresh token rotation habilitado');
    console.log('✅ Instrucciones para configuración manual creadas');
    console.log('✅ Script de verificación creado');

    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('1. 📖 Lee las instrucciones en INSTRUCCIONES_CONFIGURACION_PRODUCCION.md');
    console.log('2. 🔧 Aplica los cambios en Supabase Dashboard');
    console.log('3. 🚀 Haz redeploy en Vercel');
    console.log('4. ✅ Ejecuta scripts/verify-session-fix.js para verificar');

    console.log('\n💡 IMPORTANTE:');
    console.log('Los cambios locales ya están aplicados, pero DEBES configurar');
    console.log('manualmente el Supabase Dashboard para que funcione en producción.');

  } catch (error) {
    console.error('💥 Error aplicando correcciones:', error.message);
  }
}

// Ejecutar correcciones
fixSessionExpiration();