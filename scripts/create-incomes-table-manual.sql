-- Crear tabla de ingresos
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  amount_usd DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'CRC' CHECK (currency IN ('CRC', 'USD')),
  exchange_rate DECIMAL(10,4),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  category VARCHAR(100) DEFAULT 'payment',
  subcategory VARCHAR(100),
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  details TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_incomes_project_id ON public.incomes(project_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON public.incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_status ON public.incomes(status);
CREATE INDEX IF NOT EXISTS idx_incomes_received_date ON public.incomes(received_date);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_incomes_updated_at
    BEFORE UPDATE ON public.incomes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY IF NOT EXISTS "Users can view all incomes" ON public.incomes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can insert incomes" ON public.incomes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can update incomes" ON public.incomes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can delete incomes" ON public.incomes
  FOR DELETE USING (auth.role() = 'authenticated');