-- Script corregido para aplicar la función get_user_role y políticas RLS
-- Primero crear/actualizar la función get_user_role

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

-- Eliminar todas las políticas existentes de la tabla incomes
DROP POLICY IF EXISTS "Users can view incomes" ON incomes;
DROP POLICY IF EXISTS "Users can insert incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update incomes" ON incomes;
DROP POLICY IF EXISTS "Users can delete incomes" ON incomes;
DROP POLICY IF EXISTS "Gerencia and administrativo can insert incomes" ON incomes;
DROP POLICY IF EXISTS "Gerencia and administrativo can update incomes" ON incomes;
DROP POLICY IF EXISTS "Gerencia can delete incomes" ON incomes;
DROP POLICY IF EXISTS "Gerencia and administrativo can view incomes" ON incomes;

-- Crear las nuevas políticas RLS con nombres únicos
CREATE POLICY "income_select_policy" ON incomes
    FOR SELECT USING (
        get_user_role() IN ('gerencia', 'administrativo', 'operativo')
    );

CREATE POLICY "income_insert_policy" ON incomes
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo')
    );

CREATE POLICY "income_update_policy" ON incomes
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo')
    );

CREATE POLICY "income_delete_policy" ON incomes
    FOR DELETE USING (
        get_user_role() = 'gerencia'
    );

-- Verificar que la función funciona
SELECT 'Función get_user_role creada exitosamente' as status;