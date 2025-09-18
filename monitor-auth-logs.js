const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 MONITOR DE LOGS DE AUTENTICACIÓN');
console.log('==================================');
console.log('📝 Monitoreando eventos de autenticación...');
console.log('💡 Intenta hacer login en la aplicación web para ver los logs');
console.log('🔄 Presiona Ctrl+C para detener el monitor\n');

// Función para formatear timestamp
function formatTimestamp() {
  return new Date().toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

// Función para mostrar logs de autenticación
function logAuthEvent(event, data) {
  const timestamp = formatTimestamp();
  console.log(`\n[${timestamp}] 🔐 EVENTO DE AUTENTICACIÓN`);
  console.log(`📋 Tipo: ${event}`);
  
  if (data?.user) {
    console.log(`👤 Usuario ID: ${data.user.id}`);
    console.log(`📧 Email: ${data.user.email}`);
    console.log(`✅ Email confirmado: ${data.user.email_confirmed_at ? 'Sí' : 'No'}`);
    console.log(`📅 Creado: ${data.user.created_at}`);
    console.log(`🔄 Última actualización: ${data.user.updated_at}`);
    
    if (data.user.user_metadata && Object.keys(data.user.user_metadata).length > 0) {
      console.log(`📊 Metadata:`, JSON.stringify(data.user.user_metadata, null, 2));
    }
  }
  
  if (data?.session) {
    console.log(`🎫 Token de acceso: ${data.session.access_token.substring(0, 20)}...`);
    console.log(`🔄 Token de refresh: ${data.session.refresh_token.substring(0, 20)}...`);
    console.log(`⏰ Expira en: ${new Date(data.session.expires_at * 1000).toLocaleString('es-ES')}`);
  }
  
  console.log('─'.repeat(60));
}

// Función para mostrar errores de autenticación
function logAuthError(event, error) {
  const timestamp = formatTimestamp();
  console.log(`\n[${timestamp}] ❌ ERROR DE AUTENTICACIÓN`);
  console.log(`📋 Evento: ${event}`);
  console.log(`🚨 Error: ${error.message}`);
  console.log(`🔍 Código: ${error.code || 'N/A'}`);
  console.log(`📊 Detalles:`, error);
  console.log('─'.repeat(60));
}

// Escuchar eventos de autenticación
supabase.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'INITIAL_SESSION':
      if (session) {
        logAuthEvent('SESIÓN INICIAL ENCONTRADA', { user: session.user, session });
      } else {
        console.log(`\n[${formatTimestamp()}] ℹ️  No hay sesión inicial activa`);
      }
      break;
      
    case 'SIGNED_IN':
      logAuthEvent('INICIO DE SESIÓN EXITOSO', { user: session?.user, session });
      break;
      
    case 'SIGNED_OUT':
      console.log(`\n[${formatTimestamp()}] 🚪 CIERRE DE SESIÓN`);
      console.log('👤 Usuario ha cerrado sesión');
      console.log('─'.repeat(60));
      break;
      
    case 'TOKEN_REFRESHED':
      logAuthEvent('TOKEN RENOVADO', { user: session?.user, session });
      break;
      
    case 'USER_UPDATED':
      logAuthEvent('USUARIO ACTUALIZADO', { user: session?.user, session });
      break;
      
    case 'PASSWORD_RECOVERY':
      console.log(`\n[${formatTimestamp()}] 🔑 RECUPERACIÓN DE CONTRASEÑA`);
      console.log('📧 Se ha iniciado el proceso de recuperación de contraseña');
      console.log('─'.repeat(60));
      break;
      
    default:
      console.log(`\n[${formatTimestamp()}] 🔄 EVENTO DESCONOCIDO: ${event}`);
      if (session) {
        logAuthEvent(event, { user: session.user, session });
      }
      break;
  }
});

// Función para verificar el estado actual
async function checkCurrentState() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logAuthError('VERIFICACIÓN DE ESTADO', error);
      return;
    }
    
    if (session) {
      logAuthEvent('ESTADO ACTUAL - SESIÓN ACTIVA', { user: session.user, session });
    } else {
      console.log(`\n[${formatTimestamp()}] ℹ️  ESTADO ACTUAL: No hay sesión activa`);
    }
  } catch (error) {
    console.error(`\n[${formatTimestamp()}] ❌ Error verificando estado:`, error);
  }
}

// Verificar estado inicial
checkCurrentState();

// Mantener el script corriendo
console.log('\n🔄 Monitor activo. Esperando eventos de autenticación...');
console.log('💡 Ve a http://localhost:3000/auth/login e intenta hacer login');

// Manejar cierre del script
process.on('SIGINT', () => {
  console.log('\n\n🛑 Deteniendo monitor de autenticación...');
  console.log('✅ Monitor detenido');
  process.exit(0);
});

// Mantener el proceso vivo
setInterval(() => {
  // Solo para mantener el proceso activo
}, 1000);