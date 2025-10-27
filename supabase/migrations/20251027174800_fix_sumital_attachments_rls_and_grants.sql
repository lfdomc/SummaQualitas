-- Fix RLS/grants for sumital_attachments and clean up duplicate/legacy policies
-- Also ensure base privileges for authenticated/anon roles

-- Ensure RLS is enabled (idempotent)
ALTER TABLE IF EXISTS public.sumital_attachments ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies if they exist (older names)
DROP POLICY IF EXISTS "Users can view attachments of sumitals they have access to" ON public.sumital_attachments;
DROP POLICY IF EXISTS "Users can insert attachments to sumitals they have access to" ON public.sumital_attachments;

-- Re-create current policies to ensure consistency
DROP POLICY IF EXISTS "Users can view attachments of their own sumitals" ON public.sumital_attachments;
CREATE POLICY "Users can view attachments of their own sumitals" ON public.sumital_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sumitals s
            WHERE s.id = sumital_id
            AND s.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert attachments to their own sumitals" ON public.sumital_attachments;
CREATE POLICY "Users can insert attachments to their own sumitals" ON public.sumital_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sumitals s
            WHERE s.id = sumital_id
            AND s.created_by = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

DROP POLICY IF EXISTS "Users can update their own attachments" ON public.sumital_attachments;
CREATE POLICY "Users can update their own attachments" ON public.sumital_attachments
    FOR UPDATE USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.sumital_attachments;
CREATE POLICY "Users can delete their own attachments" ON public.sumital_attachments
    FOR DELETE USING (uploaded_by = auth.uid());

-- Base privileges for PostgREST roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sumital_attachments TO authenticated;
GRANT SELECT ON public.sumital_attachments TO anon;

-- Optional: notify PostgREST to reload schema
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;