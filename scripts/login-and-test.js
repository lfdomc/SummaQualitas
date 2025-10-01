const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hypravgvtrlfpepslhmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHJhdmd2dHJsZnBlcHNsaG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTg1MDQsImV4cCI6MjA3MzczNDUwNH0.ptXVX62hoQf6tgfwkb342kXK-hKixoejzmbHNkHQDLw';

async function loginAndTest() {
  console.log('🚀 Iniciando login...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Hacer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'lfdomc@gmail.com',
      password: 'Luimorca22'
    });
    
    if (error) {
      console.error('❌ Error en login:', error.message);
      return;
    }
    
    console.log('✅ Login exitoso!');
    console.log('👤 Usuario:', data.user.email);
    console.log('🔑 Sesión establecida');
    
    // Verificar sesión
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('📋 Sesión actual:', {
      hasSession: !!sessionData.session,
      userEmail: sessionData.session?.user?.email
    });
    
    // Obtener perfil
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError.message);
    } else {
      console.log('👤 Perfil:', profile);
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

loginAndTest();