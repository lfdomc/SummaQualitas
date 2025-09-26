require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUpdatePermissions() {
  console.log('🔍 Verificando permisos de actualización...');
  
  const orderId = '550e8400-e29b-41d4-a716-446655441001';
  
  try {
    // 1. Obtener información de la orden
    const { data: orderData, error: orderError } = await supabase
      .from('change_orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError) {
      console.error('❌ Error obteniendo orden:', orderError);
      return;
    }
    
    console.log('📋 Información de la orden:');
    console.log('🆔 ID:', orderData.id);
    console.log('📧 Requested by:', orderData.requested_by);
    console.log('📊 Status actual:', orderData.status);
    
    // 2. Verificar usuarios en la tabla users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role, is_active');
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }
    
    console.log('\n👥 Usuarios en la tabla users:');
    usersData.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ID: ${user.id} - Activo: ${user.is_active}`);
    });
    
    // 3. Verificar si el requested_by existe en users
    const requestedByUser = usersData.find(u => u.id === orderData.requested_by);
    if (requestedByUser) {
      console.log(`\n✅ Usuario que solicitó la orden: ${requestedByUser.email} (${requestedByUser.role})`);
    } else {
      console.log(`\n❌ Usuario que solicitó la orden (${orderData.requested_by}) NO existe en tabla users`);
    }
    
    // 4. Verificar usuarios de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios de auth:', authError);
      return;
    }
    
    console.log('\n🔐 Usuarios en auth:');
    authUsers.users.forEach(user => {
      console.log(`- ${user.email} - ID: ${user.id} - Confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'}`);
    });
    
    // 5. Intentar actualización directa con service role (sin RLS)
    console.log('\n🧪 Probando actualización directa con service role...');
    const { data: updateData, error: updateError } = await supabase
      .from('change_orders')
      .update({ notes: 'Test update from script' })
      .eq('id', orderId)
      .select();
    
    if (updateError) {
      console.error('❌ Error en actualización directa:', updateError);
    } else {
      console.log('✅ Actualización directa exitosa:', updateData);
      
      // Revertir el cambio
      await supabase
        .from('change_orders')
        .update({ notes: orderData.notes })
        .eq('id', orderId);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugUpdatePermissions();