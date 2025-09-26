-- Solución definitiva para el problema de RLS en incomes
-- Este script corrige la función get_user_role y ajusta las políticas RLS

-- 1. Corregir la función get_user_role para obtener el rol de la tabla users
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

-- 2. Eliminar políticas existentes para incomes
DROP POLICY IF EXISTS "Gerencia and administrativo can insert incomes" ON incomes;
DROP POLICY IF EXISTS "Users can view own incomes" ON incomes;
DROP POLICY IF EXISTS "Gerencia and administrativo can update incomes" ON incomes;
DROP POLICY IF EXISTS "Gerencia can delete incomes" ON incomes;

-- 3. Crear nuevas políticas RLS más flexibles para incomes
-- Política para SELECT (ver incomes)
CREATE POLICY "Users can view incomes based on role" ON incomes FOR SELECT USING (
    CASE 
        WHEN get_user_role() = 'gerencia' THEN true
        WHEN get_user_role() = 'administrativo' THEN true
        WHEN get_user_role() = 'operativo' THEN true
        WHEN get_user_role() = 'cliente' THEN 
            -- Los clientes solo pueden ver incomes de sus proyectos
            project_id IN (
                SELECT id FROM projects WHERE client_id = auth.uid()
            )
        ELSE false
    END
);

-- Política para INSERT (crear incomes)
CREATE POLICY "Authorized users can insert incomes" ON incomes FOR INSERT WITH CHECK (
    get_user_role() IN ('gerencia', 'administrativo', 'operativo')
);

-- Política para UPDATE (actualizar incomes)
CREATE POLICY "Authorized users can update incomes" ON incomes FOR UPDATE USING (
    get_user_role() IN ('gerencia', 'administrativo')
) WITH CHECK (
    get_user_role() IN ('gerencia', 'administrativo')
);

-- Política para DELETE (eliminar incomes)
CREATE POLICY "Only gerencia can delete incomes" ON incomes FOR DELETE USING (
    get_user_role() = 'gerencia'
);

-- 4. Verificar que RLS esté habilitado en la tabla incomes
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- 5. Función de prueba para verificar el rol actual
CREATE OR REPLACE FUNCTION test_current_user_role()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    result := json_build_object(
        'user_id', auth.uid(),
        'user_role', get_user_role(),
        'timestamp', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mensaje de confirmación
SELECT 'RLS policies for incomes have been updated successfully' as status;