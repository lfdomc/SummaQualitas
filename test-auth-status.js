require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthStatus() {
  console.log('🔍 Verificando estado de autenticación...\n');

  try {
    // 1. Verificar usuarios disponibles
    console.log('1️⃣ Usuarios disponibles en la base de datos:');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_active')
      .eq('is_active', true);

    if (usersError) {
      console.log('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });

    // 2. Verificar si hay sesión activa
    console.log('\n2️⃣ Verificando sesión activa...');
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Error obteniendo sesión:', sessionError);
    } else if (session) {
      console.log('✅ Sesión activa encontrada:', session.user.email);
    } else {
      console.log('❌ No hay sesión activa');
    }

    // 3. Intentar autenticar con el usuario gerencia
    console.log('\n3️⃣ Intentando crear sesión con usuario gerencia...');
    
    // Primero, obtener el usuario gerencia
    const gerenciaUser = users.find(u => u.role === 'gerencia');
    if (!gerenciaUser) {
      console.log('❌ No se encontró usuario con rol gerencia');
      return;
    }

    console.log(`📧 Usuario gerencia encontrado: ${gerenciaUser.email}`);
    
    // Generar un magic link para autenticación
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: gerenciaUser.email,
      options: {
        redirectTo: 'http://localhost:3000/incomes'
      }
    });

    if (magicLinkError) {
      console.log('❌ Error generando magic link:', magicLinkError);
    } else {
      console.log('✅ Magic link generado exitosamente');
      console.log('🔗 Link de autenticación:');
      console.log(magicLinkData.properties.action_link);
      console.log('\n📋 Instrucciones:');
      console.log('1. Copia el link de arriba');
      console.log('2. Pégalo en tu navegador');
      console.log('3. Esto te autenticará automáticamente');
      console.log('4. Luego intenta crear un ingreso nuevamente');
    }

    // 4. Verificar políticas RLS
    console.log('\n4️⃣ Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT policyname, cmd, qual 
          FROM pg_policies 
          WHERE tablename = 'incomes' 
          AND schemaname = 'public';
        `
      });

    if (!policiesError && policies) {
      console.log('📋 Políticas RLS activas:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testAuthStatus();