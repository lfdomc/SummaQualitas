require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserExists() {
  const email = 'lfdomc@gmail.com';
  
  console.log('🔍 Verificando usuario:', email);
  console.log('🔗 Supabase URL:', supabaseUrl);
  
  try {
    // 1. Verificar en Supabase Auth
    console.log('\n1️⃣ Verificando en Supabase Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error al obtener usuarios de Auth:', authError);
    } else {
      const authUser = authUsers.users.find(user => user.email === email);
      if (authUser) {
        console.log('✅ Usuario encontrado en Supabase Auth:');
        console.log('   - ID:', authUser.id);
        console.log('   - Email:', authUser.email);
        console.log('   - Email confirmado:', authUser.email_confirmed_at ? '✅' : '❌');
        console.log('   - Creado:', authUser.created_at);
        console.log('   - Último login:', authUser.last_sign_in_at || 'Nunca');
      } else {
        console.log('❌ Usuario NO encontrado en Supabase Auth');
      }
    }
    
    // 2. Verificar en la tabla users
    console.log('\n2️⃣ Verificando en tabla users...');
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (dbError) {
      console.error('❌ Error al consultar tabla users:', dbError);
    } else {
      if (dbUsers && dbUsers.length > 0) {
        const dbUser = dbUsers[0];
        console.log('✅ Usuario encontrado en tabla users:');
        console.log('   - ID:', dbUser.id);
        console.log('   - Email:', dbUser.email);
        console.log('   - Nombre:', dbUser.name);
        console.log('   - Rol:', dbUser.role);
        console.log('   - Activo:', dbUser.is_active ? '✅' : '❌');
        console.log('   - Creado:', dbUser.created_at);
      } else {
        console.log('❌ Usuario NO encontrado en tabla users');
      }
    }
    
    // 3. Verificar estructura de la tabla users
    console.log('\n3️⃣ Verificando estructura de tabla users...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error al verificar estructura de tabla:', tableError);
    } else {
      console.log('✅ Tabla users accesible');
      if (tableInfo && tableInfo.length > 0) {
        console.log('   - Columnas disponibles:', Object.keys(tableInfo[0]));
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkUserExists();