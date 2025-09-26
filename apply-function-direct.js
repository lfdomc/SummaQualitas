require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFunction() {
  console.log('🔧 Aplicando función get_user_role directamente...');
  
  try {
    // Primero, vamos a verificar si la función ya existe
    console.log('\n1️⃣ Verificando función existente...');
    const { data: existingFunction, error: checkError } = await supabase.rpc('get_user_role');
    
    if (!checkError) {
      console.log('✅ La función get_user_role ya existe y funciona');
      console.log(`Resultado: ${existingFunction}`);
      return;
    }
    
    console.log('❌ La función no existe o no funciona:', checkError.message);
    
    // Intentar crear la función usando una consulta SQL directa
    console.log('\n2️⃣ Intentando crear la función...');
    
    // Como no podemos ejecutar SQL directamente, vamos a usar el SQL Editor de Supabase
    console.log(`
📋 INSTRUCCIONES PARA APLICAR LA FUNCIÓN MANUALMENTE:

1. Ve al dashboard de Supabase: https://app.supabase.com/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql

2. Ejecuta el siguiente SQL en el SQL Editor:

\`\`\`sql
-- Corregir la función get_user_role
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

-- Actualizar las políticas RLS para la tabla incomes
DROP POLICY IF EXISTS "Users can view incomes" ON incomes;
DROP POLICY IF EXISTS "Users can insert incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update incomes" ON incomes;
DROP POLICY IF EXISTS "Users can delete incomes" ON incomes;

-- Crear nuevas políticas RLS
CREATE POLICY "Users can view incomes" ON incomes
    FOR SELECT USING (
        get_user_role() IN ('gerencia', 'administrativo', 'operativo')
    );

CREATE POLICY "Gerencia and administrativo can insert incomes" ON incomes
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo')
    );

CREATE POLICY "Gerencia and administrativo can update incomes" ON incomes
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo')
    );

CREATE POLICY "Gerencia can delete incomes" ON incomes
    FOR DELETE USING (
        get_user_role() = 'gerencia'
    );
\`\`\`

3. Después de ejecutar el SQL, vuelve a probar la creación de ingresos en la aplicación.
    `);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyFunction();