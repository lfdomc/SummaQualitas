-- Add created_by column to projects to align with API and RLS policies
-- This migration safely adds the column and a foreign key to auth.users

-- 1) Add the column if it does not exist
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- 2) Add foreign key constraint to auth.users(id) if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_projects_created_by'
      AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT fk_projects_created_by
      FOREIGN KEY (created_by)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- 3) Create index for performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);