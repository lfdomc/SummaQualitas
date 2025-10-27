-- Pin search_path for additional public functions flagged by Supabase Advisor
-- Date: 2025-10-27
-- Rationale: The Advisor warns that several functions have a mutable search_path.
--            We pin their search_path to 'public' to ensure consistent resolution
--            without breaking existing unqualified references. Later we can migrate
--            them to search_path = '' with fully-qualified names.

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
        'deactivate_user',
        'get_user_role',
        'get_user_id',
        'calculate_project_summary',
        'update_equipment_status',
        'get_project_summary',
        'get_expenses_paginated',
        'validate_project_dates',
        'get_dashboard_kpis'
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

-- Note:
-- 1) This pins the search_path to 'public' for all overloaded variants of the listed
--    functions that exist in the public schema.
-- 2) Pinning to 'public' removes the mutable search_path warning while avoiding
--    breakage for functions that rely on unqualified references to public objects.
-- 3) As a follow-up, consider rewriting these functions with fully-qualified names
--    and setting search_path = '' for stronger hardening.