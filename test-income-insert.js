require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Probando inserción en tabla incomes...');

async function testIncomeInsert() {
  // Probar con cliente anónimo (como en el navegador)
  console.log('\n1️⃣ Probando con cliente anónimo (browser client)...');
  const browserClient = createClient(supabaseUrl, supabaseAnonKey);
  
  // Verificar usuario actual
  const { data: { user }, error: userError } = await browserClient.auth.getUser();
  
  if (userError) {
    console.error('❌ Error obteniendo usuario:', userError);
  } else if (user) {
    console.log(`✅ Usuario autenticado: ${user.email}`);
  } else {
    console.log('❌ No hay usuario autenticado en el cliente browser');
  }
  
  // Verificar función get_user_role
  try {
    const { data: roleData, error: roleError } = await browserClient.rpc('get_user_role');
    
    if (roleError) {
      console.error('❌ Error obteniendo rol:', roleError);
    } else {
      console.log(`👤 Rol actual: ${roleData}`);
    }
  } catch (error) {
    console.error('❌ Error llamando get_user_role:', error);
  }
  
  // Intentar insertar un ingreso de prueba
  const testIncomeData = {
    project_id: '123e4567-e89b-12d3-a456-426614174000', // UUID de prueba
    client_id: '123e4567-e89b-12d3-a456-426614174001',  // UUID de prueba
    description: 'Ingreso de prueba',
    amount: 1000.00,
    currency: 'CRC',
    received_date: new Date().toISOString().split('T')[0],
    category: 'pago_proyecto',
    status: 'pendiente',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('\n🧪 Intentando insertar ingreso de prueba...');
  const { data, error } = await browserClient
    .from('incomes')
    .insert(testIncomeData)
    .select('*')
    .single();
  
  if (error) {
    console.error('❌ Error insertando ingreso:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('Detalles:', error.details);
  } else {
    console.log('✅ Ingreso insertado exitosamente:', data);
  }
  
  // Probar con cliente de servicio (admin)
  console.log('\n2️⃣ Probando con cliente de servicio (admin)...');
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: adminData, error: adminError } = await adminClient
    .from('incomes')
    .insert(testIncomeData)
    .select('*')
    .single();
  
  if (adminError) {
    console.error('❌ Error insertando con admin:', adminError);
  } else {
    console.log('✅ Ingreso insertado con admin exitosamente:', adminData);
    
    // Limpiar el registro de prueba
    await adminClient.from('incomes').delete().eq('id', adminData.id);
    console.log('🧹 Registro de prueba eliminado');
  }
}

testIncomeInsert().catch(console.error);