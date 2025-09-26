require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS en tabla incomes...');
  
  try {
    // Verificar políticas RLS
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'incomes');
    
    if (error) {
      console.error('Error obteniendo políticas:', error);
      return;
    }
    
    console.log('📋 Políticas RLS encontradas:');
    policies.forEach(policy => {
      console.log(`- ${policy.policyname}: ${policy.cmd} - ${policy.qual || policy.with_check}`);
    });
    
    // Verificar el estado de RLS
    const { data: tableInfo, error: tableError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'incomes');
    
    if (!tableError && tableInfo.length > 0) {
      console.log(`🔒 RLS habilitado: ${tableInfo[0].relrowsecurity}`);
    }
    
    // Verificar la función get_user_role
    console.log('\n🔍 Verificando función get_user_role...');
    const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
    
    if (roleError) {
      console.error('Error obteniendo rol:', roleError);
    } else {
      console.log(`👤 Rol actual: ${roleData}`);
    }
    
    // Verificar usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error obteniendo usuario:', userError);
    } else if (user) {
      console.log(`👤 Usuario autenticado: ${user.email}`);
    } else {
      console.log('❌ No hay usuario autenticado');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRLSPolicies();