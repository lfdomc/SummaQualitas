-- Crear tabla de ingresos
CREATE TABLE IF NOT EXISTS incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  category VARCHAR(50) NOT NULL CHECK (category IN ('pago_proyecto', 'anticipo', 'pago_final', 'pago_parcial', 'otros')),
  status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmado', 'cancelado')),
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_incomes_project_id ON incomes(project_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_status ON incomes(status);
CREATE INDEX IF NOT EXISTS idx_incomes_category ON incomes(category);
CREATE INDEX IF NOT EXISTS idx_incomes_income_date ON incomes(income_date);
CREATE INDEX IF NOT EXISTS idx_incomes_created_at ON incomes(created_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_incomes_updated_at
    BEFORE UPDATE ON incomes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso completo a usuarios autenticados
CREATE POLICY "Users can view all incomes" ON incomes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert incomes" ON incomes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update incomes" ON incomes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete incomes" ON incomes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comentarios para documentación
COMMENT ON TABLE incomes IS 'Tabla para gestionar los ingresos de proyectos';
COMMENT ON COLUMN incomes.project_id IS 'ID del proyecto asociado';
COMMENT ON COLUMN incomes.client_id IS 'ID del cliente que realiza el pago';
COMMENT ON COLUMN incomes.description IS 'Descripción del ingreso';
COMMENT ON COLUMN incomes.amount IS 'Monto del ingreso';
COMMENT ON COLUMN incomes.currency IS 'Moneda del ingreso (USD, EUR, etc.)';
COMMENT ON COLUMN incomes.category IS 'Categoría del ingreso';
COMMENT ON COLUMN incomes.status IS 'Estado del ingreso';
COMMENT ON COLUMN incomes.income_date IS 'Fecha del ingreso';
COMMENT ON COLUMN incomes.reference IS 'Referencia o número de factura';
COMMENT ON COLUMN incomes.notes IS 'Notas adicionales';