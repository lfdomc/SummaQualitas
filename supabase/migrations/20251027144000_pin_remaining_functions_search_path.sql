-- Pin search_path for remaining public functions flagged by Advisor
-- Date: 2025-10-27
-- Functions: update_sumital_attachments_updated_at, set_presupuesto_original_on_insert
-- Rationale: Ensure consistent resolution of references by pinning search_path to 'public'.

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
        'update_sumital_attachments_updated_at',
        'set_presupuesto_original_on_insert'
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

-- Note: Consider future hardening with search_path = '' and fully qualified references.