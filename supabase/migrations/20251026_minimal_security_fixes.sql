-- Minimal, non-invasive security fixes for Supabase project
-- Focus: enable/force RLS where policies already exist, restrict view access without changing its definition
-- Safe: no data changes; only access control DDL.

BEGIN;

-- 1) public.suppliers: enable and force RLS (policies already exist)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers FORCE ROW LEVEL SECURITY;
-- Note: We do NOT change existing GRANT/REVOKE here to keep impact minimal.
-- If needed later, we can explicitly manage privileges for anon/authenticated.

-- 2) public.migration_log: enable and force RLS, and deny access to anon/authenticated
ALTER TABLE public.migration_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_log FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.migration_log'::regclass
      AND polname = 'deny all anon'
  ) THEN
    EXECUTE 'CREATE POLICY "deny all anon" ON public.migration_log FOR ALL TO anon USING (false) WITH CHECK (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.migration_log'::regclass
      AND polname = 'deny all authenticated'
  ) THEN
    EXECUTE 'CREATE POLICY "deny all authenticated" ON public.migration_log FOR ALL TO authenticated USING (false) WITH CHECK (false)';
  END IF;
END
$$;

-- 3) public.user_management_view: keep SECURITY DEFINER, but restrict its usage to service_role
REVOKE ALL ON public.user_management_view FROM anon;
REVOKE ALL ON public.user_management_view FROM authenticated;
GRANT SELECT ON public.user_management_view TO service_role;

COMMIT;

-- Rollback guidance (manual):
-- BEGIN;
-- ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY; -- Not recommended, re-enables risk
-- ALTER TABLE public.migration_log DISABLE ROW LEVEL SECURITY; -- Not recommended
-- DROP POLICY IF EXISTS "deny all anon" ON public.migration_log;
-- DROP POLICY IF EXISTS "deny all authenticated" ON public.migration_log;
-- GRANT SELECT ON public.user_management_view TO authenticated; -- only if needed
-- COMMIT;