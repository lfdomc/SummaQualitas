// Script temporal para verificar el rol del usuario actual
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hypravgvtrlfpepslhmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHJhdmd2dHJsZnBlcHNsaG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTg1MDQsImV4cCI6MjA3MzczNDUwNH0.ptXVX62hoQf6tgfwkb342kXK-hKixoejzmbHNkHQDLw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRole() {
  try {
    // Obtener la sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError);
      return;
    }
    
    if (!session?.user) {
      console.log('❌ No hay usuario autenticado');
      return;
    }
    
    console.log('✅ Usuario autenticado:', session.user.email);
    console.log('🆔 User ID:', session.user.id);
    
    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError);
      return;
    }
    
    console.log('👤 Perfil del usuario:', profile);
    
    // Verificar la función get_user_role()
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_user_role');
    
    if (roleError) {
      console.error('❌ Error ejecutando get_user_role():', roleError);
    } else {
      console.log('🎭 Resultado de get_user_role():', roleData);
    }
    
    // Verificar el JWT
    const jwt = session.access_token;
    console.log('🔑 JWT token (primeros 50 chars):', jwt.substring(0, 50) + '...');
    
    // Decodificar el JWT para ver su contenido
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      console.log('📋 JWT payload:', payload);
    } catch (e) {
      console.error('❌ Error decodificando JWT:', e);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkUserRole();