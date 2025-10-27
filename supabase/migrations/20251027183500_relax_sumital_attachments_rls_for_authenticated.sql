-- Relax RLS on sumital_attachments to allow any authenticated user to view and insert
-- attachments for any existing sumital, while keeping update/delete restricted to
-- the uploader. This aligns with sumitals SELECT policy that allows all authenticated
-- users to view sumitals.

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.sumital_attachments ENABLE ROW LEVEL SECURITY;

-- Replace restrictive policies based on sumital creator with authenticated-based policies
DROP POLICY IF EXISTS "Users can view attachments of their own sumitals" ON public.sumital_attachments;
DROP POLICY IF EXISTS "Users can insert attachments to their own sumitals" ON public.sumital_attachments;

-- View: any authenticated user can see attachments
CREATE POLICY "Authenticated users can view attachments" ON public.sumital_attachments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert: authenticated users can insert attachments; the row must be marked as uploaded_by = auth.uid()
CREATE POLICY "Authenticated users can insert attachments" ON public.sumital_attachments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND uploaded_by = auth.uid());

-- Keep update/delete policies (if they already exist) restricting to uploader
-- Re-create to be safe and idempotent
DROP POLICY IF EXISTS "Users can update their own attachments" ON public.sumital_attachments;
CREATE POLICY "Users can update their own attachments" ON public.sumital_attachments
  FOR UPDATE USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.sumital_attachments;
CREATE POLICY "Users can delete their own attachments" ON public.sumital_attachments
  FOR DELETE USING (uploaded_by = auth.uid());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sumital_attachments TO authenticated;
GRANT SELECT ON public.sumital_attachments TO anon;

-- Notify PostgREST to reload schema
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  -- ignore if pgrst channel not available
  NULL;
END $$;

COMMIT;