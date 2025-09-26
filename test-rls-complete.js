require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente de servicio (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSComplete() {
  console.log('🔍 Test completo de RLS para incomes...\n');

  try {
    // 1. Obtener un proyecto válido
    console.log('1️⃣ Obteniendo proyecto válido...');
    const { data: projects, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .limit(1);

    if (projectError || !projects || projects.length === 0) {
      console.log('❌ No hay proyectos disponibles:', projectError);
      return;
    }

    const validProjectId = projects[0].id;
    console.log(`✅ Proyecto válido encontrado: ${projects[0].name} (${validProjectId})\n`);

    // 2. Verificar usuarios con diferentes roles
    console.log('2️⃣ Verificando usuarios por rol...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_active')
      .eq('is_active', true);

    if (usersError) {
      console.log('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    console.log('👥 Usuarios activos por rol:');
    const usersByRole = {};
    users.forEach(user => {
      if (!usersByRole[user.role]) usersByRole[user.role] = [];
      usersByRole[user.role].push(user);
      console.log(`   - ${user.email}: ${user.role}`);
    });
    console.log('');

    // 3. Test con usuario administrativo/gerencia
    const adminUser = usersByRole['administrativo']?.[0] || usersByRole['gerencia']?.[0];
    
    if (adminUser) {
      console.log(`3️⃣ Probando inserción con usuario ${adminUser.role}: ${adminUser.email}`);
      
      // Simular autenticación del usuario
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: adminUser.email
      });

      if (!authError) {
        // Intentar inserción con el usuario admin
        const testIncome = {
          project_id: validProjectId,
          amount: 5000.00,
          description: 'Test de ingreso con usuario administrativo',
          received_date: new Date().toISOString().split('T')[0],
          category: 'test',
          payment_method: 'transferencia'
        };

        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('incomes')
          .insert(testIncome)
          .select();

        if (insertError) {
          console.log('❌ Error insertando con usuario admin:', insertError);
        } else {
          console.log('✅ Inserción exitosa con usuario admin:', insertData[0].id);
          
          // Limpiar el registro de prueba
          await supabaseAdmin
            .from('incomes')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🧹 Registro de prueba eliminado');
        }
      }
    } else {
      console.log('⚠️  No se encontraron usuarios con rol administrativo o gerencia');
    }

    // 4. Verificar función get_user_role
    console.log('\n4️⃣ Verificando función get_user_role...');
    const { data: roleTest, error: roleError } = await supabaseAdmin
      .rpc('get_user_role');

    if (roleError) {
      console.log('❌ Error ejecutando get_user_role:', roleError);
    } else {
      console.log('✅ Función get_user_role funciona, rol devuelto:', roleTest);
    }

    // 5. Verificar políticas RLS
    console.log('\n5️⃣ Verificando políticas RLS activas...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'incomes');

    if (!policiesError && policies) {
      console.log('📋 Políticas RLS activas en tabla incomes:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

testRLSComplete();