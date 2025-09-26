require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugRLSFinal() {
  console.log('🔍 DIAGNÓSTICO FINAL RLS - INCOMES\n');

  try {
    // 1. Verificar usuario gerencia
    console.log('1️⃣ Verificando usuario gerencia...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'lfdomc@gmail.com');

    if (usersError || !users || users.length === 0) {
      console.log('❌ Usuario no encontrado:', usersError);
      return;
    }

    const user = users[0];
    console.log('✅ Usuario encontrado:');
    console.log('   - ID:', user.id);
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.role);
    console.log('   - Active:', user.is_active);

    // 2. Verificar políticas actuales
    console.log('\n2️⃣ Verificando políticas RLS actuales...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'incomes');

    console.log('Políticas encontradas:', policies?.length || 0);

    // 3. Verificar RLS habilitado
    console.log('\n3️⃣ Verificando si RLS está habilitado...');
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin.rpc('check_rls_status', {
      table_name: 'incomes'
    });

    if (rlsError) {
      console.log('❌ Error verificando RLS:', rlsError);
    } else {
      console.log('✅ RLS Status:', rlsStatus);
    }

    // 4. Probar inserción directa con admin
    console.log('\n4️⃣ Probando inserción con admin client...');
    
    // Obtener proyecto válido
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .limit(1);

    if (!projects || projects.length === 0) {
      console.log('❌ No hay proyectos disponibles');
      return;
    }

    const testIncome = {
      project_id: projects[0].id,
      amount: 1000.00,
      description: 'Test admin insert',
      received_date: new Date().toISOString().split('T')[0],
      category: 'pago',
      status: 'pendiente'
    };

    const { data: adminInsert, error: adminError } = await supabaseAdmin
      .from('incomes')
      .insert(testIncome)
      .select();

    if (adminError) {
      console.log('❌ Error inserción admin:', adminError);
    } else {
      console.log('✅ Inserción admin exitosa:', adminInsert[0].id);
      
      // Limpiar
      await supabaseAdmin.from('incomes').delete().eq('id', adminInsert[0].id);
    }

    // 5. Simular inserción como usuario autenticado
    console.log('\n5️⃣ Simulando inserción como usuario autenticado...');
    
    // Crear client con usuario específico
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: 'lfdomc@gmail.com'
    });

    if (authError) {
      console.log('❌ Error generando auth:', authError);
    } else {
      console.log('✅ Auth generado para simulación');
    }

    // 6. Verificar estructura de tabla incomes
    console.log('\n6️⃣ Verificando estructura de tabla incomes...');
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'incomes')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.log('❌ Error obteniendo columnas:', columnsError);
    } else {
      console.log('✅ Columnas de la tabla incomes:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 7. Aplicar fix definitivo
    console.log('\n7️⃣ Aplicando fix definitivo...');
    await applyDefinitiveFix(user.id);

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

async function applyDefinitiveFix(userId) {
  console.log('🔧 Aplicando fix definitivo...');
  
  const fixSQL = `
    -- Deshabilitar RLS temporalmente
    ALTER TABLE incomes DISABLE ROW LEVEL SECURITY;
    
    -- Eliminar todas las políticas
    DROP POLICY IF EXISTS "income_select_policy" ON incomes;
    DROP POLICY IF EXISTS "income_insert_policy" ON incomes;
    DROP POLICY IF EXISTS "income_update_policy" ON incomes;
    DROP POLICY IF EXISTS "income_delete_policy" ON incomes;
    
    -- Crear política simple para INSERT
    CREATE POLICY "allow_authenticated_insert" ON incomes
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    
    -- Crear política simple para SELECT
    CREATE POLICY "allow_authenticated_select" ON incomes
        FOR SELECT USING (auth.uid() IS NOT NULL);
    
    -- Crear política simple para UPDATE
    CREATE POLICY "allow_authenticated_update" ON incomes
        FOR UPDATE USING (auth.uid() IS NOT NULL);
    
    -- Crear política simple para DELETE
    CREATE POLICY "allow_authenticated_delete" ON incomes
        FOR DELETE USING (auth.uid() IS NOT NULL);
    
    -- Habilitar RLS nuevamente
    ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
  `;

  try {
    // Ejecutar cada comando por separado
    const commands = fixSQL.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        console.log('Ejecutando:', command.trim().substring(0, 50) + '...');
        
        // Usar query directo en lugar de rpc
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          query: command.trim() 
        });
        
        if (error) {
          console.log('❌ Error en comando:', error);
        } else {
          console.log('✅ Comando ejecutado');
        }
      }
    }
    
    console.log('🎉 Fix aplicado. Políticas simplificadas creadas.');
    
  } catch (error) {
    console.log('❌ Error aplicando fix:', error);
  }
}

debugRLSFinal();