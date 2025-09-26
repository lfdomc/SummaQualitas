require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingUser() {
  console.log('👤 Creando usuario faltante en tabla users...');
  
  try {
    // Información del usuario autenticado que falta
    const userId = '755d660d-395c-4117-a470-45cdc7eadd38';
    const userEmail = 'lfdomc@gmail.com';
    
    // Crear el usuario en la tabla users con rol de gerencia
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userEmail,
        name: 'Luis Fernando', // Nombre basado en el email
        role: 'gerencia', // Asignar rol de gerencia para tener permisos completos
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error creando usuario:', insertError);
      return;
    }
    
    console.log('✅ Usuario creado exitosamente:');
    console.log('📧 Email:', insertData.email);
    console.log('👤 Nombre:', insertData.name);
    console.log('🎭 Rol:', insertData.role);
    console.log('🆔 ID:', insertData.id);
    
    // Verificar que la función get_user_role funciona ahora
    console.log('\n🧪 Verificando función get_user_role...');
    
    // Crear un cliente con el usuario autenticado para probar
    const userSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Simular autenticación (esto no funcionará en script, pero podemos verificar la función directamente)
    const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
    
    if (roleError) {
      console.error('❌ Error ejecutando get_user_role:', roleError);
    } else {
      console.log('✅ get_user_role() devuelve:', roleData);
    }
    
    console.log('\n🎉 Usuario creado. Ahora deberías poder guardar cambios en la aplicación.');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createMissingUser();