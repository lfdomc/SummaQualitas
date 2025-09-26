require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Corrigiendo políticas RLS para la tabla incomes...\n');

  try {
    // 1. Verificar usuario gerencia existe
    console.log('1️⃣ Verificando usuario gerencia...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_active')
      .eq('email', 'lfdomc@gmail.com');

    if (usersError || !users || users.length === 0) {
      console.log('❌ Usuario gerencia no encontrado:', usersError);
      return;
    }

    console.log('✅ Usuario gerencia encontrado:', users[0]);

    // 2. Eliminar políticas existentes y crear nuevas
    console.log('\n2️⃣ Aplicando nuevas políticas RLS...');
    
    const fixSQL = `
      -- Eliminar políticas existentes
      DROP POLICY IF EXISTS "income_select_policy" ON incomes;
      DROP POLICY IF EXISTS "income_insert_policy" ON incomes;
      DROP POLICY IF EXISTS "income_update_policy" ON incomes;
      DROP POLICY IF EXISTS "income_delete_policy" ON incomes;

      -- Política de SELECT: Usuarios autenticados pueden ver ingresos
      CREATE POLICY "income_select_policy" ON incomes
          FOR SELECT USING (
              auth.uid() IS NOT NULL AND
              EXISTS (
                  SELECT 1 FROM users 
                  WHERE id = auth.uid() 
                  AND is_active = true
              )
          );

      -- Política de INSERT: Usuarios gerencia y administrativo pueden crear ingresos
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

      -- Política de UPDATE: Usuarios gerencia y administrativo pueden actualizar ingresos
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

      -- Política de DELETE: Solo usuarios gerencia pueden eliminar ingresos
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

    // Ejecutar SQL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: fixSQL });
    
    if (error) {
      console.log('❌ Error aplicando políticas SQL:', error);
      
      // Intentar método alternativo - ejecutar cada política por separado
      console.log('\n🔄 Intentando método alternativo...');
      await applyPoliciesIndividually();
    } else {
      console.log('✅ Políticas RLS aplicadas exitosamente');
    }

    // 3. Verificar que las políticas se aplicaron
    console.log('\n3️⃣ Verificando políticas aplicadas...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, tablename, cmd, qual, with_check')
      .eq('tablename', 'incomes');

    if (policiesError) {
      console.log('❌ Error verificando políticas:', policiesError);
    } else {
      console.log('✅ Políticas activas:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log('\n🎉 Corrección completada. Ahora los usuarios gerencia deberían poder crear ingresos.');
    console.log('💡 Intenta crear un ingreso nuevamente en la aplicación web.');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

async function applyPoliciesIndividually() {
  const policies = [
    {
      name: 'income_select_policy',
      sql: `CREATE POLICY "income_select_policy" ON incomes FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true));`
    },
    {
      name: 'income_insert_policy', 
      sql: `CREATE POLICY "income_insert_policy" ON incomes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true AND role IN ('gerencia', 'administrativo')));`
    },
    {
      name: 'income_update_policy',
      sql: `CREATE POLICY "income_update_policy" ON incomes FOR UPDATE USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true AND role IN ('gerencia', 'administrativo')));`
    },
    {
      name: 'income_delete_policy',
      sql: `CREATE POLICY "income_delete_policy" ON incomes FOR DELETE USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true AND role = 'gerencia'));`
    }
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy.sql });
      if (error) {
        console.log(`❌ Error aplicando ${policy.name}:`, error);
      } else {
        console.log(`✅ ${policy.name} aplicada`);
      }
    } catch (err) {
      console.log(`❌ Error en ${policy.name}:`, err);
    }
  }
}

fixRLSPolicies();