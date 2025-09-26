const { createClient } = require('@supabase/supabase-js');

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
      
      console.log(`📊 Tiempo hasta expiración: ${Math.floor(timeUntilExpiry / 3600)} horas`);
      
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

verifySessionFix();