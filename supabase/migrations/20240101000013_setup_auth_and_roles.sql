-- Authentication and Roles Setup for Summa Qualitas Construction Management System
-- This script configures authentication, roles, and user management

-- Create a function to handle user registration with role assignment
CREATE OR REPLACE FUNCTION register_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT,
    user_role TEXT DEFAULT 'operativo'
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Validate role
    IF user_role NOT IN ('gerencia', 'administrativo', 'operativo', 'cliente') THEN
        RAISE EXCEPTION 'Invalid role. Must be one of: gerencia, administrativo, operativo, cliente';
    END IF;
    
    -- This function would typically be called from the application layer
    -- since direct user creation in Supabase requires admin privileges
    
    result := json_build_object(
        'success', true,
        'message', 'User registration parameters validated',
        'email', user_email,
        'name', user_name,
        'role', user_role
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user role (only for gerencia)
CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS JSON AS $$
DECLARE
    current_user_role TEXT;
    result JSON;
BEGIN
    -- Get current user role
    current_user_role := get_user_role();
    
    -- Only gerencia can update roles
    IF current_user_role != 'gerencia' THEN
        RAISE EXCEPTION 'Only gerencia can update user roles';
    END IF;
    
    -- Validate new role
    IF new_role NOT IN ('gerencia', 'administrativo', 'operativo', 'cliente') THEN
        RAISE EXCEPTION 'Invalid role. Must be one of: gerencia, administrativo, operativo, cliente';
    END IF;
    
    -- Update user role
    UPDATE users 
    SET role = new_role::user_role, updated_at = NOW()
    WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    result := json_build_object(
        'success', true,
        'message', 'User role updated successfully',
        'user_id', target_user_id,
        'new_role', new_role
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate user (only for gerencia)
CREATE OR REPLACE FUNCTION deactivate_user(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_user_role TEXT;
    result JSON;
BEGIN
    -- Get current user role
    current_user_role := get_user_role();
    
    -- Only gerencia can deactivate users
    IF current_user_role != 'gerencia' THEN
        RAISE EXCEPTION 'Only gerencia can deactivate users';
    END IF;
    
    -- Deactivate user
    UPDATE users 
    SET is_active = false, updated_at = NOW()
    WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    result := json_build_object(
        'success', true,
        'message', 'User deactivated successfully',
        'user_id', target_user_id
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions based on role
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    user_role_val TEXT;
    permissions JSON;
    target_user_id UUID;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(user_uuid, get_user_id());
    
    -- Get user role
    SELECT role INTO user_role_val FROM users WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Define permissions based on role
    CASE user_role_val
        WHEN 'gerencia' THEN
            permissions := json_build_object(
                'can_manage_users', true,
                'can_manage_clients', true,
                'can_manage_projects', true,
                'can_manage_equipment', true,
                'can_manage_expenses', true,
                'can_manage_payments', true,
                'can_view_reports', true,
                'can_approve_change_orders', true,
                'can_delete_records', true
            );
        WHEN 'administrativo' THEN
            permissions := json_build_object(
                'can_manage_users', false,
                'can_manage_clients', true,
                'can_manage_projects', true,
                'can_manage_equipment', true,
                'can_manage_expenses', true,
                'can_manage_payments', true,
                'can_view_reports', true,
                'can_approve_change_orders', true,
                'can_delete_records', false
            );
        WHEN 'operativo' THEN
            permissions := json_build_object(
                'can_manage_users', false,
                'can_manage_clients', false,
                'can_manage_projects', false,
                'can_manage_equipment', true,
                'can_manage_expenses', true,
                'can_manage_payments', false,
                'can_view_reports', false,
                'can_approve_change_orders', false,
                'can_delete_records', false
            );
        WHEN 'cliente' THEN
            permissions := json_build_object(
                'can_manage_users', false,
                'can_manage_clients', false,
                'can_manage_projects', false,
                'can_manage_equipment', false,
                'can_manage_expenses', false,
                'can_manage_payments', false,
                'can_view_reports', false,
                'can_approve_change_orders', false,
                'can_delete_records', false
            );
        ELSE
            permissions := json_build_object();
    END CASE;
    
    RETURN json_build_object(
        'user_id', target_user_id,
        'role', user_role_val,
        'permissions', permissions
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSON;
    has_perm BOOLEAN := false;
BEGIN
    user_permissions := get_user_permissions();
    has_perm := COALESCE((user_permissions->'permissions'->>permission_name)::BOOLEAN, false);
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create initial admin user (to be run once during setup)
CREATE OR REPLACE FUNCTION create_initial_admin(
    admin_email TEXT,
    admin_name TEXT
)
RETURNS JSON AS $$
DECLARE
    admin_id UUID;
    result JSON;
BEGIN
    -- Generate a UUID for the admin user
    admin_id := gen_random_uuid();
    
    -- Insert admin user
    INSERT INTO users (id, email, name, role, is_active)
    VALUES (admin_id, admin_email, admin_name, 'gerencia', true);
    
    result := json_build_object(
        'success', true,
        'message', 'Initial admin user created',
        'admin_id', admin_id,
        'email', admin_email,
        'name', admin_name,
        'role', 'gerencia'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate user session and get user info
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    user_info JSON;
BEGIN
    current_user_id := get_user_id();
    
    SELECT json_build_object(
        'id', id,
        'email', email,
        'name', name,
        'role', role,
        'phone', phone,
        'avatar_url', avatar_url,
        'is_active', is_active,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO user_info
    FROM users
    WHERE id = current_user_id AND is_active = true;
    
    IF user_info IS NULL THEN
        RAISE EXCEPTION 'User not found or inactive';
    END IF;
    
    RETURN user_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
    user_name TEXT DEFAULT NULL,
    user_phone TEXT DEFAULT NULL,
    user_avatar_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    result JSON;
BEGIN
    current_user_id := get_user_id();
    
    -- Update user profile
    UPDATE users 
    SET 
        name = COALESCE(user_name, name),
        phone = COALESCE(user_phone, phone),
        avatar_url = COALESCE(user_avatar_url, avatar_url),
        updated_at = NOW()
    WHERE id = current_user_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found or inactive';
    END IF;
    
    -- Return updated user info
    result := get_current_user_info();
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for user management (only accessible by gerencia)
CREATE OR REPLACE VIEW user_management_view AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.phone,
    u.is_active,
    u.created_at,
    u.updated_at,
    COUNT(p.id) as managed_projects
FROM users u
LEFT JOIN projects p ON u.id = p.manager_id
GROUP BY u.id, u.email, u.name, u.role, u.phone, u.is_active, u.created_at, u.updated_at
ORDER BY u.created_at DESC;

-- Grant access to the view based on RLS
ALTER VIEW user_management_view OWNER TO postgres;

-- Note: RLS policies cannot be applied directly to views
-- Access control is handled through the underlying table policies

-- Function to get system statistics (for dashboard)
CREATE OR REPLACE FUNCTION get_system_statistics()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    -- Only gerencia and administrativo can view system statistics
    IF get_user_role() NOT IN ('gerencia', 'administrativo') THEN
        RAISE EXCEPTION 'Insufficient permissions to view system statistics';
    END IF;
    
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users WHERE is_active = true),
        'total_clients', (SELECT COUNT(*) FROM clients WHERE status = 'activo'),
        'total_projects', (SELECT COUNT(*) FROM projects),
        'active_projects', (SELECT COUNT(*) FROM projects WHERE status IN ('planificacion', 'en_progreso')),
        'total_equipment', (SELECT COUNT(*) FROM equipment),
        'available_equipment', (SELECT COUNT(*) FROM equipment WHERE status = 'disponible'),
        'total_expenses_this_month', (
            SELECT COALESCE(SUM(amount), 0) 
            FROM expenses 
            WHERE expense_date >= date_trunc('month', CURRENT_DATE)
            AND payment_status != 'cancelado'
        ),
        'total_income_this_month', (
            SELECT COALESCE(SUM(amount), 0) 
            FROM client_payments 
            WHERE payment_date >= date_trunc('month', CURRENT_DATE)
            AND status != 'cancelado'
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for auth-related queries
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;