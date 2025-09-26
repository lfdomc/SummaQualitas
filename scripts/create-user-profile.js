const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserProfile() {
  console.log('👤 Creando perfil de usuario...');
  
  try {
    // Obtener el usuario de autenticación existente
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error al obtener usuarios:', authError.message);
      return;
    }
    
    const adminUser = authUsers.users.find(user => user.email === 'admin@summa.com');
    
    if (!adminUser) {
      console.error('❌ Usuario admin@summa.com no encontrado en auth');
      return;
    }
    
    console.log('✅ Usuario de autenticación encontrado:', adminUser.email);
    
    // Verificar si ya existe el perfil
    const { data: existingProfile, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (existingProfile) {
      console.log('✅ El perfil ya existe:', existingProfile.email);
      console.log('👑 Rol:', existingProfile.role);
      console.log('🎉 ¡Usuario listo para usar!');
      console.log('\n📝 Puedes hacer login con:');
      console.log('   Email: admin@summa.com');
      console.log('   Password: admin123456');
      return;
    }
    
    // Crear perfil de usuario
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: adminUser.id,
        email: adminUser.email,
        name: 'Administrador Summa',
        role: 'gerencia',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Error al crear perfil:', profileError.message);
      console.error('📋 Detalles:', profileError);
      return;
    }
    
    console.log('✅ Perfil de usuario creado:', profileData.email);
    console.log('📧 Email: admin@summa.com');
    console.log('🔑 Password: admin123456');
    console.log('👑 Rol: gerencia');
    console.log('🎉 ¡Usuario de prueba creado exitosamente!');
    console.log('\n📝 Ahora puedes hacer login con:');
    console.log('   Email: admin@summa.com');
    console.log('   Password: admin123456');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createUserProfile();