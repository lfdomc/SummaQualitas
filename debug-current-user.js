require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugCurrentUser() {
  console.log('🔍 Verificando usuario actual y políticas RLS...\n');

  try {
    // 1. Verificar usuario autenticado
    console.log('1️⃣ Verificando usuario autenticado...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ No hay usuario autenticado');
      console.log('Error:', userError);
      return;
    }

    console.log('✅ Usuario autenticado:', user.email);
    console.log('   - ID:', user.id);

    // 2. Verificar datos del usuario en la tabla users
    console.log('\n2️⃣ Verificando datos en tabla users...');
    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', user.id)
      .single();

    if (userDataError) {
      console.log('❌ Error obteniendo datos del usuario:', userDataError);
      
      // Verificar con admin client
      const { data: adminUserData, error: adminUserError } = await supabaseAdmin
        .from('users')
        .select('id, email, role, is_active')
        .eq('id', user.id)
        .single();
      
      if (adminUserError) {
        console.log('❌ Usuario no existe en tabla users:', adminUserError);
        console.log('🔧 Necesitas crear el usuario en la tabla users');
        return;
      } else {
        console.log('✅ Usuario encontrado con admin client:', adminUserData);
        userData = adminUserData;
      }
    } else {
      console.log('✅ Datos del usuario:', userData);
    }

    // 3. Probar función get_user_role
    console.log('\n3️⃣ Probando función get_user_role...');
    const { data: roleData, error: roleError } = await supabaseClient.rpc('get_user_role');
    
    if (roleError) {
      console.log('❌ Error ejecutando get_user_role:', roleError);
    } else {
      console.log('✅ Rol obtenido:', roleData);
    }

    // 4. Verificar si el usuario puede insertar según las políticas
    console.log('\n4️⃣ Probando inserción directa...');
    
    // Obtener proyecto válido
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .limit(1);

    if (projects && projects.length > 0) {
      const testIncome = {
        project_id: projects[0].id,
        amount: 1000.00,
        description: 'Test de inserción con usuario autenticado',
        received_date: new Date().toISOString().split('T')[0],
        category: 'pago', // Usar valor en español que acepta la BD
        status: 'pendiente'
      };

      console.log('📝 Intentando insertar:', testIncome);

      const { data: insertData, error: insertError } = await supabaseClient
        .from('incomes')
        .insert(testIncome)
        .select();

      if (insertError) {
        console.log('❌ Error en inserción:', insertError);
        console.log('   - Código:', insertError.code);
        console.log('   - Mensaje:', insertError.message);
        
        // Si es error RLS, vamos a corregir las políticas
        if (insertError.code === '42501') {
          console.log('\n🔧 Error RLS detectado. Aplicando corrección...');
          await fixRLSPolicies();
        }
      } else {
        console.log('✅ Inserción exitosa:', insertData[0].id);
        
        // Limpiar
        await supabaseAdmin
          .from('incomes')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Registro de prueba eliminado');
      }
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

async function fixRLSPolicies() {
  console.log('🔧 Corrigiendo políticas RLS...');
  
  const fixSQL = `
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "income_select_policy" ON incomes;
    DROP POLICY IF EXISTS "income_insert_policy" ON incomes;
    DROP POLICY IF EXISTS "income_update_policy" ON incomes;
    DROP POLICY IF EXISTS "income_delete_policy" ON incomes;

    -- Crear políticas más permisivas para usuarios autenticados
    CREATE POLICY "income_select_policy" ON incomes
        FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "income_insert_policy" ON incomes
        FOR INSERT WITH CHECK (
            auth.uid() IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND is_active = true 
                AND role IN ('gerencia', 'administrativo')
            )
        );

    CREATE POLICY "income_update_policy" ON incomes
        FOR UPDATE USING (
            auth.uid() IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND is_active = true 
                AND role IN ('gerencia', 'administrativo')
            )
        );

    CREATE POLICY "income_delete_policy" ON incomes
        FOR DELETE USING (
            auth.uid() IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND is_active = true 
                AND role = 'gerencia'
            )
        );
  `;

  try {
    // Ejecutar con admin client
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: fixSQL });
    
    if (error) {
      console.log('❌ Error aplicando corrección SQL:', error);
    } else {
      console.log('✅ Políticas RLS corregidas exitosamente');
    }
  } catch (error) {
    console.log('❌ Error en corrección:', error);
  }
}

debugCurrentUser();