-- =====================================================
-- CREAR TABLA DE INGRESOS (INCOMES)
-- =====================================================
-- Esta tabla almacena los ingresos relacionados con proyectos
-- Representa los pagos que realizan los clientes por cada proyecto

-- Crear la tabla de ingresos
CREATE TABLE IF NOT EXISTS public.incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id),
    
    -- Información del ingreso
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    amount_usd DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'CRC' CHECK (currency IN ('CRC', 'USD')),
    exchange_rate DECIMAL(10,4),
    
    -- Fechas
    income_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Método y referencia de pago
    payment_method VARCHAR(50), -- efectivo, transferencia, cheque, etc.
    reference_number VARCHAR(100), -- número de referencia del pago
    
    -- Categorización del ingreso
    category VARCHAR(100) DEFAULT 'payment', -- payment, advance, bonus, etc.
    subcategory VARCHAR(100), -- anticipo, pago parcial, pago final, etc.
    
    -- Estado del ingreso
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    
    -- Información adicional
    notes TEXT,
    details TEXT,
    
    -- Auditoría
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar comentarios para documentar la tabla
COMMENT ON TABLE public.incomes IS 'Tabla para almacenar los ingresos de los proyectos (pagos de clientes)';
COMMENT ON COLUMN public.incomes.project_id IS 'ID del proyecto al que pertenece el ingreso';
COMMENT ON COLUMN public.incomes.client_id IS 'ID del cliente que realiza el pago';
COMMENT ON COLUMN public.incomes.description IS 'Descripción del ingreso';
COMMENT ON COLUMN public.incomes.amount IS 'Monto del ingreso en la moneda especificada';
COMMENT ON COLUMN public.incomes.amount_usd IS 'Monto del ingreso convertido a USD';
COMMENT ON COLUMN public.incomes.currency IS 'Moneda del ingreso: CRC o USD';
COMMENT ON COLUMN public.incomes.exchange_rate IS 'Tipo de cambio utilizado para la conversión';
COMMENT ON COLUMN public.incomes.income_date IS 'Fecha del ingreso';
COMMENT ON COLUMN public.incomes.due_date IS 'Fecha de vencimiento (si aplica)';
COMMENT ON COLUMN public.incomes.payment_method IS 'Método de pago utilizado';
COMMENT ON COLUMN public.incomes.reference_number IS 'Número de referencia del pago';
COMMENT ON COLUMN public.incomes.category IS 'Categoría del ingreso';
COMMENT ON COLUMN public.incomes.subcategory IS 'Subcategoría del ingreso';
COMMENT ON COLUMN public.incomes.status IS 'Estado del ingreso: pending, confirmed, cancelled';
COMMENT ON COLUMN public.incomes.notes IS 'Notas adicionales';
COMMENT ON COLUMN public.incomes.details IS 'Detalles adicionales del ingreso';

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_incomes_project_id ON public.incomes(project_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON public.incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON public.incomes(income_date);
CREATE INDEX IF NOT EXISTS idx_incomes_status ON public.incomes(status);
CREATE INDEX IF NOT EXISTS idx_incomes_category ON public.incomes(category);
CREATE INDEX IF NOT EXISTS idx_incomes_amount ON public.incomes(amount);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
-- Política para lectura: permitir a todos los usuarios autenticados
CREATE POLICY "Users can view incomes" ON public.incomes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserción: permitir a usuarios autenticados
CREATE POLICY "Users can insert incomes" ON public.incomes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para actualización: permitir a usuarios autenticados
CREATE POLICY "Users can update incomes" ON public.incomes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para eliminación: permitir a usuarios autenticados
CREATE POLICY "Users can delete incomes" ON public.incomes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_incomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_incomes_updated_at_trigger
    BEFORE UPDATE ON public.incomes
    FOR EACH ROW
    EXECUTE FUNCTION update_incomes_updated_at();

-- Crear vista para resumen de ingresos por proyecto
CREATE OR REPLACE VIEW public.project_incomes_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    c.name as client_name,
    COUNT(i.id) as total_incomes,
    COALESCE(SUM(CASE WHEN i.status = 'confirmed' THEN i.amount ELSE 0 END), 0) as total_confirmed_amount,
    COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.amount ELSE 0 END), 0) as total_pending_amount,
    COALESCE(SUM(CASE WHEN i.status = 'confirmed' AND i.currency = 'USD' THEN i.amount ELSE 0 END), 0) as total_confirmed_usd,
    COALESCE(SUM(CASE WHEN i.status = 'confirmed' AND i.currency = 'CRC' THEN i.amount ELSE 0 END), 0) as total_confirmed_crc,
    MIN(i.income_date) as first_income_date,
    MAX(i.income_date) as last_income_date
FROM public.projects p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.incomes i ON p.id = i.project_id
GROUP BY p.id, p.name, p.status, c.name;

-- Agregar comentario a la vista
COMMENT ON VIEW public.project_incomes_summary IS 'Vista resumen de ingresos por proyecto';

-- Mensaje de confirmación
SELECT 'Tabla de ingresos creada exitosamente con índices, políticas RLS y vista resumen' AS resultado;