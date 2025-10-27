-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PROJECTS table (minimal schema to support equipment rentals)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'en_progreso',
  start_date DATE,
  end_date DATE,
  budget NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow public read of projects (for listing and filters)
CREATE POLICY "Public can read projects" ON public.projects
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update projects
CREATE POLICY "Authenticated can insert projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update projects" ON public.projects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Alias view for singular table name used by some endpoints
CREATE OR REPLACE VIEW public.project AS SELECT * FROM public.projects;

-- EQUIPMENT table
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  acquisition_date DATE,
  acquisition_cost NUMERIC(12,2),
  daily_rental_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  weekly_rental_rate NUMERIC(12,2),
  monthly_rental_rate NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'available', -- 'available' | 'rented' | 'maintenance' | 'retired' | 'out_of_service'
  condition TEXT DEFAULT 'good',
  location TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_is_active ON public.equipment(is_active);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Allow public read of equipment
CREATE POLICY "Public can read equipment" ON public.equipment
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update equipment
CREATE POLICY "Authenticated can insert equipment" ON public.equipment
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update equipment" ON public.equipment
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- EQUIPMENT_RENTALS table
CREATE TABLE IF NOT EXISTS public.equipment_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  planned_end_date DATE,
  daily_rate NUMERIC(12,2) NOT NULL,
  total_days INTEGER DEFAULT 0,
  total_cost NUMERIC(15,2) DEFAULT 0,
  actual_days INTEGER,
  final_cost NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'cancelled'
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_rentals_equipment_id ON public.equipment_rentals(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_project_id ON public.equipment_rentals(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_status ON public.equipment_rentals(status);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_dates ON public.equipment_rentals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_created_at ON public.equipment_rentals(created_at);

ALTER TABLE public.equipment_rentals ENABLE ROW LEVEL SECURITY;

-- Allow public read of rentals (used by public /equipment page)
CREATE POLICY "Public can read equipment rentals" ON public.equipment_rentals
  FOR SELECT USING (true);

-- Allow authenticated users to create/update/cancel rentals
CREATE POLICY "Authenticated can insert equipment rentals" ON public.equipment_rentals
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update equipment rentals" ON public.equipment_rentals
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- USERS profile table used by useAuth
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'operator',
  company TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert users" ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Authenticated can update own user" ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Note: Seeding removed to avoid conflicts with existing remote schema (e.g., NOT NULL columns like client_id).
--       If needed, seed data should be applied via environment-specific scripts or guarded DO blocks.