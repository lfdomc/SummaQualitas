-- Update projects INSERT policy to allow users to insert records they own or manage
-- This migration adjusts RLS to align with API behavior that sets created_by to the authenticated user

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop old restrictive policy if it exists
DROP POLICY IF EXISTS "Gerencia and administrativo can insert projects" ON public.projects;

-- Create a more flexible INSERT policy
-- Allow insert when:
-- - User role is gerencia or administrativo (as before)
-- - OR the record's created_by equals the authenticated user
-- - OR the record's manager_id equals the authenticated user
CREATE POLICY "Users can insert projects they own or manage" ON public.projects
  FOR INSERT
  WITH CHECK (
    get_user_role() IN ('gerencia', 'administrativo')
    OR created_by = get_user_id()
    OR manager_id = get_user_id()
  );