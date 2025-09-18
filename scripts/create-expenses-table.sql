-- Script para crear la tabla expenses en Supabase
-- Ejecutar en Supabase SQL Editor

-- Crear la tabla expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('costos_directos', 'costos_indirectos', 'gastos_administrativos', 'mano_obra', 'imprevistos')),
    subcategory VARCHAR(100),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    amount_usd DECIMAL(15,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'CRC' CHECK (currency IN ('CRC', 'USD')),
    exchange_rate DECIMAL(10,2),
    date DATE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    reference VARCHAR(100),
    details TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON public.expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);

-- Agregar comentarios para documentar la tabla
COMMENT ON TABLE public.expenses IS 'Tabla para almacenar los gastos de los proyectos';
COMMENT ON COLUMN public.expenses.project_id IS 'ID del proyecto al que pertenece el gasto';
COMMENT ON COLUMN public.expenses.category IS 'Categoría del gasto: costos_directos, costos_indirectos, gastos_administrativos, mano_obra, imprevistos';
COMMENT ON COLUMN public.expenses.subcategory IS 'Subcategoría opcional del gasto';
COMMENT ON COLUMN public.expenses.description IS 'Descripción del gasto';
COMMENT ON COLUMN public.expenses.amount IS 'Monto del gasto en la moneda especificada';
COMMENT ON COLUMN public.expenses.amount_usd IS 'Monto del gasto convertido a USD';
COMMENT ON COLUMN public.expenses.currency IS 'Moneda del gasto: CRC o USD';
COMMENT ON COLUMN public.expenses.exchange_rate IS 'Tipo de cambio utilizado para la conversión';
COMMENT ON COLUMN public.expenses.date IS 'Fecha del gasto';
COMMENT ON COLUMN public.expenses.supplier_id IS 'ID del proveedor (opcional)';
COMMENT ON COLUMN public.expenses.reference IS 'Referencia o número de comprobante';
COMMENT ON COLUMN public.expenses.details IS 'Detalles adicionales del gasto';
COMMENT ON COLUMN public.expenses.notes IS 'Notas adicionales';

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
-- Política para lectura: permitir a todos los usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" ON public.expenses
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Política para inserción: permitir a usuarios autenticados
CREATE POLICY "Enable insert for authenticated users" ON public.expenses
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política para actualización: permitir a usuarios autenticados
CREATE POLICY "Enable update for authenticated users" ON public.expenses
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política para eliminación: permitir a usuarios autenticados
CREATE POLICY "Enable delete for authenticated users" ON public.expenses
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mensaje de confirmación
SELECT 'Tabla expenses creada exitosamente con RLS habilitado' AS status;