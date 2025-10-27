-- Pin search_path for another batch of public functions flagged by Supabase Advisor
-- Date: 2025-10-27
-- Functions: register_user, update_user_role, get_user_permissions, has_permission,
--            create_initial_admin, get_current_user_info, update_user_profile,
--            get_system_statistics, get_projects_with_financial_summary
-- Rationale: These functions are present on the remote DB but not defined locally.
--            We pin search_path to 'public' to remove the mutable search_path warning safely.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid,
           n.nspname AS schema_name,
           p.proname AS func_name
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'register_user',
        'update_user_role',
        'get_user_permissions',
        'has_permission',
        'create_initial_admin',
        'get_current_user_info',
        'update_user_profile',
        'get_system_statistics',
        'get_projects_with_financial_summary'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = %L',
      r.schema_name,
      r.func_name,
      pg_get_function_identity_arguments(r.oid),
      'public'
    );
  END LOOP;
END $$;

-- Notes:
-- - Applies to all overloads in public schema.
-- - Consider future hardening to search_path = '' after extracting and fully qualifying references.