require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente anónimo (como en el navegador)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
// Cliente de servicio (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugWebRLS() {
  console.log('🔍 Diagnosticando problema RLS en contexto web...\n');

  try {
    // 1. Verificar usuario autenticado en el cliente web
    console.log('1️⃣ Verificando usuario autenticado...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ No hay usuario autenticado en el cliente web');
      console.log('Error:', userError);
      
      // Intentar autenticar con el usuario de gerencia
      console.log('\n🔐 Intentando autenticar con usuario gerencia...');
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: 'lfdomc@gmail.com',
        password: 'password123' // Necesitarás la contraseña real
      });
      
      if (signInError) {
        console.log('❌ Error autenticando:', signInError);
        return;
      } else {
        console.log('✅ Usuario autenticado exitosamente');
      }
    } else {
      console.log('✅ Usuario autenticado:', user.email);
    }

    // 2. Verificar el rol del usuario autenticado
    console.log('\n2️⃣ Verificando rol del usuario autenticado...');
    const { data: roleData, error: roleError } = await supabaseClient.rpc('get_user_role');
    
    if (roleError) {
      console.log('❌ Error obteniendo rol:', roleError);
    } else {
      console.log('✅ Rol del usuario:', roleData);
    }

    // 3. Verificar datos del usuario en la tabla users
    console.log('\n3️⃣ Verificando datos en tabla users...');
    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', user?.id)
      .single();

    if (userDataError) {
      console.log('❌ Error obteniendo datos del usuario:', userDataError);
    } else {
      console.log('✅ Datos del usuario:', userData);
    }

    // 4. Verificar auth.uid() directamente
    console.log('\n4️⃣ Verificando auth.uid()...');
    const { data: authUidData, error: authUidError } = await supabaseClient
      .rpc('get_current_user_id');

    if (authUidError) {
      console.log('❌ Error obteniendo auth.uid():', authUidError);
      
      // Crear la función si no existe
      console.log('📝 Creando función get_current_user_id...');
      const { error: createFuncError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION get_current_user_id()
          RETURNS UUID AS $$
          BEGIN
            RETURN auth.uid();
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      
      if (!createFuncError) {
        const { data: retryAuthUid } = await supabaseClient.rpc('get_current_user_id');
        console.log('✅ auth.uid():', retryAuthUid);
      }
    } else {
      console.log('✅ auth.uid():', authUidData);
    }

    // 5. Probar inserción con datos mínimos
    console.log('\n5️⃣ Probando inserción con datos mínimos...');
    
    // Obtener proyecto válido
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id')
      .limit(1);

    if (projects && projects.length > 0) {
      const testIncome = {
        project_id: projects[0].id,
        amount: 1000.00,
        description: 'Test RLS web',
        received_date: new Date().toISOString().split('T')[0]
      };

      const { data: insertData, error: insertError } = await supabaseClient
        .from('incomes')
        .insert(testIncome)
        .select();

      if (insertError) {
        console.log('❌ Error en inserción:', insertError);
        
        // Mostrar detalles del error
        console.log('📋 Detalles del error:');
        console.log('   - Código:', insertError.code);
        console.log('   - Mensaje:', insertError.message);
        console.log('   - Detalles:', insertError.details);
        console.log('   - Hint:', insertError.hint);
      } else {
        console.log('✅ Inserción exitosa:', insertData[0].id);
        
        // Limpiar
        await supabaseAdmin
          .from('incomes')
          .delete()
          .eq('id', insertData[0].id);
      }
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

debugWebRLS();