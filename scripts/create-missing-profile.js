const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingProfile() {
  console.log('👤 Creando perfil faltante para usuario...');
  
  const userId = 'ae293e0a-f5d7-422d-a3dc-034a850722b3';
  
  try {
    // Primero verificar si el usuario existe en auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('❌ Error al obtener usuario de auth:', authError.message);
      return;
    }
    
    if (!authUser.user) {
      console.error('❌ Usuario no encontrado en auth.users');
      return;
    }
    
    console.log('✅ Usuario encontrado en auth:', authUser.user.email);
    
    // Verificar si ya existe el perfil
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Error al verificar perfil existente:', checkError.message);
      return;
    }
    
    if (existingProfile) {
      console.log('✅ El perfil ya existe:', existingProfile);
      return;
    }
    
    // Crear el perfil
    const newProfile = {
      id: userId,
      email: authUser.user.email,
      full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Usuario',
      role: 'gerencia',
      avatar_url: authUser.user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert(newProfile)
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Error al crear perfil:', profileError.message);
      return;
    }
    
    console.log('✅ Perfil creado exitosamente:', profileData);
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createMissingProfile();