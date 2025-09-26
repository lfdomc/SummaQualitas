-- Corregir la función get_user_role para obtener el rol de la tabla users
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

-- Verificar que la función funciona correctamente
SELECT get_user_role() as current_user_role;