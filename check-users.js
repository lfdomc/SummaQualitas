const { config } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    // Verificar usuarios en auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error al obtener usuarios de auth:', authError);
    } else {
      console.log(`✅ Usuarios en auth.users: ${authUsers.users?.length || 0}`);
      if (authUsers.users && authUsers.users.length > 0) {
        authUsers.users.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}, ID: ${user.id}, Confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'}`);
        });
      }
    }

    // Verificar tabla users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Error al obtener usuarios de tabla users:', usersError);
    } else {
      console.log(`\n✅ Usuarios en tabla users: ${users?.length || 0}`);
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`${index + 1}. Nombre: ${user.full_name || user.name}, Email: ${user.email}, Rol: ${user.role || 'N/A'}`);
        });
      }
    }

    // Intentar login con el usuario existente
    console.log('\n🔐 Intentando hacer login con el usuario existente...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'lfdomc@gmail.com',
      password: 'admin123' // Contraseña común de prueba
    });

    if (loginError) {
      console.log('❌ Login falló con contraseña admin123:', loginError.message);
      
      // Intentar resetear la contraseña
      console.log('🔧 Reseteando contraseña del usuario...');
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        '7bb6050b-06aa-4060-8cf7-de19a2badec3',
        { password: 'admin123' }
      );

      if (resetError) {
        console.error('❌ Error al resetear contraseña:', resetError);
      } else {
        console.log('✅ Contraseña reseteada a "admin123"');
      }
    } else {
      console.log('✅ Login exitoso:', loginData.user?.email);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkUsers();