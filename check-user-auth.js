require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserAuth() {
  console.log('🔍 Verificando autenticación del usuario...');
  
  try {
    // 1. Verificar sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('❌ No hay sesión activa');
      return;
    }
    
    console.log('✅ Sesión activa encontrada');
    console.log('📧 Email:', session.user.email);
    console.log('🆔 User ID:', session.user.id);
    
    // 2. Verificar si el usuario existe en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      console.error('❌ Error consultando tabla users:', userError);
      
      // Si el usuario no existe en la tabla users, intentar crearlo
      if (userError.code === 'PGRST116') {
        console.log('⚠️ Usuario no encontrado en tabla users, intentando crear...');
        
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            role: 'gerencia', // Asignar rol de gerencia por defecto para pruebas
            is_active: true
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Error creando usuario:', insertError);
        } else {
          console.log('✅ Usuario creado exitosamente:', insertData);
        }
      }
      return;
    }
    
    console.log('✅ Usuario encontrado en tabla users:');
    console.log('📧 Email:', userData.email);
    console.log('👤 Nombre:', userData.name);
    console.log('🎭 Rol:', userData.role);
    console.log('✅ Activo:', userData.is_active);
    
    // 3. Probar la función get_user_role
    console.log('\n🧪 Probando función get_user_role...');
    const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
    
    if (roleError) {
      console.error('❌ Error ejecutando get_user_role:', roleError);
    } else {
      console.log('✅ get_user_role() devuelve:', roleData);
    }
    
    // 4. Verificar permisos para change_orders
    console.log('\n🔐 Verificando permisos para change_orders...');
    const { data: changeOrderData, error: changeOrderError } = await supabase
      .from('change_orders')
      .select('id, status, requested_by')
      .limit(1);
    
    if (changeOrderError) {
      console.error('❌ Error consultando change_orders:', changeOrderError);
    } else {
      console.log('✅ Puede consultar change_orders:', changeOrderData?.length || 0, 'registros');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkUserAuth();