// Script para diagnosticar el problema de RLS en la tabla incomes
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnqnqhqjqhqjqhqjqhqj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugRLSIncomes() {
  console.log('🔍 Diagnosticando políticas RLS para la tabla incomes...\n');

  try {
    // 1. Verificar si RLS está habilitado en la tabla incomes
    console.log('1️⃣ Verificando estado de RLS en la tabla incomes:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'incomes');

    if (tableError) {
      console.error('❌ Error al verificar RLS:', tableError);
    } else {
      console.log('📋 Estado RLS:', tableInfo);
    }

    // 2. Listar todas las políticas RLS para la tabla incomes
    console.log('\n2️⃣ Verificando políticas RLS existentes:');
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies_for_table', {
      table_name: 'incomes'
    });

    if (policiesError) {
      console.log('⚠️ No se pudo obtener políticas con RPC, intentando consulta directa...');
      
      // Consulta alternativa para obtener políticas
      const { data: altPolicies, error: altError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'incomes');

      if (altError) {
        console.error('❌ Error al obtener políticas:', altError);
      } else {
        console.log('📋 Políticas encontradas:', altPolicies);
      }
    } else {
      console.log('📋 Políticas RLS:', policies);
    }

    // 3. Verificar el usuario actual y sus roles
    console.log('\n3️⃣ Verificando usuario actual:');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error al obtener usuario:', userError);
    } else {
      console.log('👤 Usuario actual:', user ? user.id : 'No autenticado');
      console.log('📧 Email:', user ? user.email : 'N/A');
    }

    // 4. Intentar obtener información del perfil del usuario
    if (user) {
      console.log('\n4️⃣ Verificando perfil del usuario:');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error al obtener perfil:', profileError);
      } else {
        console.log('👤 Perfil:', profile);
      }
    }

    // 5. Probar una inserción simple para ver el error específico
    console.log('\n5️⃣ Probando inserción de prueba:');
    const testIncome = {
      project_id: '00000000-0000-0000-0000-000000000000', // UUID de prueba
      client_id: '00000000-0000-0000-0000-000000000000',   // UUID de prueba
      description: 'Test income for RLS debugging',
      amount: 100,
      currency: 'CRC',
      received_date: new Date().toISOString().split('T')[0],
      payment_method: 'transferencia',
      category: 'pago_proyecto',
      status: 'pendiente',
      reference: 'TEST-001',
      notes: 'Test note'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('incomes')
      .insert(testIncome)
      .select();

    if (insertError) {
      console.error('❌ Error en inserción de prueba:', insertError);
      console.log('📝 Detalles del error:');
      console.log('   - Código:', insertError.code);
      console.log('   - Mensaje:', insertError.message);
      console.log('   - Detalles:', insertError.details);
      console.log('   - Hint:', insertError.hint);
    } else {
      console.log('✅ Inserción de prueba exitosa:', insertResult);
      
      // Limpiar el registro de prueba
      await supabase
        .from('incomes')
        .delete()
        .eq('id', insertResult[0].id);
      console.log('🧹 Registro de prueba eliminado');
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

debugRLSIncomes();