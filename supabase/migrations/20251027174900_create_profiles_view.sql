-- Create a compatibility view `public.profiles` mapped to `public.users`
-- This addresses 404s on /rest/v1/profiles while keeping RLS on underlying table

CREATE OR REPLACE VIEW public.profiles AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.company,
  u.avatar_url,
  u.is_active,
  u.created_at,
  u.updated_at
FROM public.users u;

-- Grant read access to profiles for anon/authenticated (only exposes allowed columns)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;

-- Notify PostgREST to reload schema after creating the view
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;