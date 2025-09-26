require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyGetUserRoleFunction() {
  console.log('🔧 Aplicando función get_user_role...');
  
  try {
    // Crear la función get_user_role
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_user_role()
      RETURNS TEXT AS $$
      DECLARE
          user_role_val TEXT;
      BEGIN
          -- Obtener el rol del usuario desde la tabla users
          SELECT role INTO user_role_val 
          FROM users 
          WHERE id = auth.uid() AND is_active = true;
          
          -- Si no se encuentra el usuario o no tiene rol, devolver 'operativo' por defecto
          RETURN COALESCE(user_role_val, 'operativo');
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { 
      sql: createFunctionSQL 
    });
    
    if (functionError) {
      console.error('❌ Error creando función:', functionError);
      return;
    }
    
    console.log('✅ Función get_user_role creada exitosamente');
    
    // Probar la función
    console.log('\n🧪 Probando función get_user_role...');
    const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
    
    if (roleError) {
      console.error('❌ Error probando función:', roleError);
    } else {
      console.log(`✅ Función funciona correctamente. Rol: ${roleData}`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

applyGetUserRoleFunction();