const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('👤 Creando usuario de prueba...');
  
  const userData = {
    email: 'lfdomc@gmail.com',
    password: 'Luimorca22',
    name: 'Luis Fernando Domínguez',
    role: 'gerencia'
  };
  
  try {
    // 1. Crear usuario en Supabase Auth
    console.log('🔐 Creando usuario en Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        name: userData.name,
        role: userData.role
      }
    });

    if (authError) {
      console.error('❌ Error al crear usuario en Auth:', authError.message);
      return;
    }

    console.log('✅ Usuario creado en Auth:', authData.user.email);
    console.log('🆔 User ID:', authData.user.id);

    // 2. Crear perfil en la tabla users
    console.log('📝 Creando perfil de usuario...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error al crear perfil:', profileError.message);
      console.error('📋 Detalles:', profileError);
      
      // Si falla el perfil, eliminar el usuario de Auth
      console.log('🧹 Limpiando usuario de Auth...');
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('✅ Perfil de usuario creado:', profileData.email);
    console.log('🎉 ¡Usuario de prueba creado exitosamente!');
    console.log('\n📝 Credenciales de login:');
    console.log('   📧 Email:', userData.email);
    console.log('   🔑 Password:', userData.password);
    console.log('   👑 Rol:', userData.role);
    console.log('\n🚀 ¡Ahora puedes hacer login!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
createTestUser().then(() => {
  console.log('✨ Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});