-- Create Sumitals table and related RLS, triggers, and indexes
-- This migration is idempotent and will not fail if objects already exist

-- Ensure required extension for UUID generation (if not already present)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Sumitals table
-- =========================
CREATE TABLE IF NOT EXISTS public.sumitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sumital_number INTEGER NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    project_date DATE NOT NULL DEFAULT CURRENT_DATE,
    equipment_description TEXT NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_phone VARCHAR(50),
    country_of_origin VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    warranty_period VARCHAR(100),
    useful_life VARCHAR(100),
    total_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    maintenance TEXT,
    training TEXT,
    attached_documents JSONB DEFAULT '[]'::jsonb,
    is_approved BOOLEAN DEFAULT NULL, -- NULL = pendiente, true = aprobado, false = rechazado
    observations TEXT,
    approver_name VARCHAR(255),
    review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(project_id, sumital_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sumitals_project_id ON public.sumitals(project_id);
CREATE INDEX IF NOT EXISTS idx_sumitals_sumital_number ON public.sumitals(sumital_number);
CREATE INDEX IF NOT EXISTS idx_sumitals_supplier_name ON public.sumitals(supplier_name);
CREATE INDEX IF NOT EXISTS idx_sumitals_is_approved ON public.sumitals(is_approved);
CREATE INDEX IF NOT EXISTS idx_sumitals_created_at ON public.sumitals(created_at);

-- Functions to manage sumital_number and timestamps
CREATE OR REPLACE FUNCTION public.get_next_sumital_number(project_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(sumital_number), 0) + 1
    INTO next_number
    FROM public.sumitals
    WHERE project_id = project_uuid;
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_sumital_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sumital_number IS NULL OR NEW.sumital_number = 0 THEN
        NEW.sumital_number := public.get_next_sumital_number(NEW.project_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_sumitals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Track created_by and updated_by automatically
CREATE OR REPLACE FUNCTION public.set_sumital_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_sumital_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trigger_set_sumital_number ON public.sumitals;
CREATE TRIGGER trigger_set_sumital_number
    BEFORE INSERT ON public.sumitals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_sumital_number();

DROP TRIGGER IF EXISTS trigger_update_sumitals_updated_at ON public.sumitals;
CREATE TRIGGER trigger_update_sumitals_updated_at
    BEFORE UPDATE ON public.sumitals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sumitals_updated_at();

DROP TRIGGER IF EXISTS trigger_set_sumital_created_by ON public.sumitals;
CREATE TRIGGER trigger_set_sumital_created_by
    BEFORE INSERT ON public.sumitals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_sumital_created_by();

DROP TRIGGER IF EXISTS trigger_set_sumital_updated_by ON public.sumitals;
CREATE TRIGGER trigger_set_sumital_updated_by
    BEFORE UPDATE ON public.sumitals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_sumital_updated_by();

-- RLS policies
ALTER TABLE public.sumitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view sumitals" ON public.sumitals;
CREATE POLICY "Authenticated users can view sumitals" ON public.sumitals
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert sumitals" ON public.sumitals;
CREATE POLICY "Authenticated users can insert sumitals" ON public.sumitals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own sumitals" ON public.sumitals;
CREATE POLICY "Users can update their own sumitals" ON public.sumitals
    FOR UPDATE USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own sumitals" ON public.sumitals;
CREATE POLICY "Users can delete their own sumitals" ON public.sumitals
    FOR DELETE USING (created_by = auth.uid());

-- Grants (base permissions)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sumitals TO authenticated;
GRANT SELECT ON public.sumitals TO anon;

-- =========================
-- Sumital attachments table
-- =========================
CREATE TABLE IF NOT EXISTS public.sumital_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sumital_id UUID NOT NULL REFERENCES public.sumitals(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    attachment_type TEXT NOT NULL CHECK (attachment_type IN ('document', 'image', 'signed_sumital')),
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for attachments
CREATE INDEX IF NOT EXISTS idx_sumital_attachments_sumital_id ON public.sumital_attachments(sumital_id);
CREATE INDEX IF NOT EXISTS idx_sumital_attachments_type ON public.sumital_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_sumital_attachments_uploaded_by ON public.sumital_attachments(uploaded_by);

-- RLS for attachments
ALTER TABLE public.sumital_attachments ENABLE ROW LEVEL SECURITY;

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

-- Function and trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.update_sumital_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sumital_attachments_updated_at ON public.sumital_attachments;
CREATE TRIGGER trigger_update_sumital_attachments_updated_at
    BEFORE UPDATE ON public.sumital_attachments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sumital_attachments_updated_at();

-- Notify PostgREST to reload schema after changes
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  -- Ignore if pgrst channel is not available
  NULL;
END $$;