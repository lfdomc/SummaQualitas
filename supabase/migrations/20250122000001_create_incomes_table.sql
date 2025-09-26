-- Crear tabla incomes
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'payment_received',
    'advance_payment',
    'final_payment',
    'milestone_payment',
    'other'
  )),
  payment_method TEXT CHECK (payment_method IN (
    'cash',
    'check',
    'bank_transfer',
    'credit_card',
    'other'
  )),
  reference_number TEXT,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN (
    'pending',
    'confirmed',
    'cancelled'
  )),
  notes TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_incomes_project_id ON public.incomes(project_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON public.incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_received_date ON public.incomes(received_date);
CREATE INDEX IF NOT EXISTS idx_incomes_status ON public.incomes(status);
CREATE INDEX IF NOT EXISTS idx_incomes_category ON public.incomes(category);

-- Habilitar RLS
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
DROP POLICY IF EXISTS "Users can view incomes for their projects" ON public.incomes;
CREATE POLICY "Users can view incomes for their projects" ON public.incomes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = incomes.project_id
      AND (
        p.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('gerencia', 'administrativo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert incomes for their projects" ON public.incomes;
CREATE POLICY "Users can insert incomes for their projects" ON public.incomes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = incomes.project_id
      AND (
        p.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('gerencia', 'administrativo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update incomes for their projects" ON public.incomes;
CREATE POLICY "Users can update incomes for their projects" ON public.incomes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = incomes.project_id
      AND (
        p.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('gerencia', 'administrativo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete incomes for their projects" ON public.incomes;
CREATE POLICY "Users can delete incomes for their projects" ON public.incomes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = incomes.project_id
      AND (
        p.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('gerencia', 'administrativo')
        )
      )
    )
  );

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_incomes_updated_at ON public.incomes;
CREATE TRIGGER handle_incomes_updated_at
  BEFORE UPDATE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insertar datos de muestra
INSERT INTO public.incomes (project_id, client_id, amount, description, category, payment_method, reference_number, received_date, status, notes)
SELECT 
  p.id as project_id,
  p.client_id,
  50000.00 as amount,
  'Pago inicial del proyecto' as description,
  'advance_payment' as category,
  'bank_transfer' as payment_method,
  'TRF-001' as reference_number,
  '2024-01-15'::date as received_date,
  'confirmed' as status,
  'Pago del 30% del proyecto' as notes
FROM public.projects p
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.incomes (project_id, client_id, amount, description, category, payment_method, reference_number, received_date, status, notes)
SELECT 
  p.id as project_id,
  p.client_id,
  75000.00 as amount,
  'Pago por avance de obra' as description,
  'milestone_payment' as category,
  'check' as payment_method,
  'CHK-002' as reference_number,
  '2024-02-01'::date as received_date,
  'confirmed' as status,
  'Pago por completar 60% de la obra' as notes
FROM public.projects p
LIMIT 1
ON CONFLICT DO NOTHING;