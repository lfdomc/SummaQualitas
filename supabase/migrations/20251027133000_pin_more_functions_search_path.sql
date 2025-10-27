-- Pin search_path for more public functions flagged by Supabase Advisor
-- Date: 2025-10-27
-- Rationale: These functions exist on the remote database but are not defined in the local repo.
--            To remove the mutable search_path warning safely, we pin them to 'public'.

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
        'validate_rental_dates',
        'calculate_rental_cost',
        'auto_update_project_status',
        'handle_new_user',
        'handle_user_update',
        'trigger_calculate_project_summary_expenses',
        'trigger_calculate_project_summary_payments',
        'get_project_financial_summary',
        'get_equipment_availability'
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
-- - This applies to all overloads of the listed functions in the public schema.
-- - Pinning to 'public' removes the warning while avoiding breaking unqualified references.
-- - Consider migrating to search_path = '' with fully-qualified references in a future hardening pass.