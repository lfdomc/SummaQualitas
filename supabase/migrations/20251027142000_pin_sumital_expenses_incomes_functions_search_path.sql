-- Pin search_path for public functions related to expenses/incomes/sumitals flagged by Advisor
-- Date: 2025-10-27
-- Functions: search_expenses_fulltext, get_expenses_by_category_period, get_incomes_with_project_info,
--            set_expenses_created_by, get_next_sumital_number, set_sumital_number,
--            update_sumitals_updated_at, set_sumital_created_by, set_sumital_updated_by
-- Rationale: Ensure consistent and secure resolution of unqualified references by pinning search_path.

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
        'search_expenses_fulltext',
        'get_expenses_by_category_period',
        'get_incomes_with_project_info',
        'set_expenses_created_by',
        'get_next_sumital_number',
        'set_sumital_number',
        'update_sumitals_updated_at',
        'set_sumital_created_by',
        'set_sumital_updated_by'
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

-- Note: Consider a future hardening pass to set search_path = '' and fully qualify references.