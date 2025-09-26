const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('👤 Creando usuario de prueba...');
  
  try {
    // Crear usuario de autenticación
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@summa.com',
      password: 'admin123456',
      email_confirm: true
    });
    
    if (authError) {
      console.error('❌ Error al crear usuario de auth:', authError.message);
      return;
    }
    
    console.log('✅ Usuario de autenticación creado:', authData.user.email);
    
    // Crear perfil de usuario
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: 'Administrador Summa',
        role: 'gerencia',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Error al crear perfil:', profileError.message);
      return;
    }
    
    console.log('✅ Perfil de usuario creado:', profileData.email);
    console.log('📧 Email: admin@summa.com');
    console.log('🔑 Password: admin123456');
    console.log('👑 Rol: gerencia');
    
    // Verificar que el usuario fue creado correctamente
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@summa.com')
      .single();
    
    if (verifyError) {
      console.error('❌ Error al verificar usuario:', verifyError.message);
      return;
    }
    
    console.log('✅ Usuario verificado correctamente');
    console.log('🎉 ¡Usuario de prueba creado exitosamente!');
    console.log('\n📝 Ahora puedes hacer login con:');
    console.log('   Email: admin@summa.com');
    console.log('   Password: admin123456');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createTestUser();