-- Crear tabla equipment_monthly_expenses
-- Esta tabla almacena los gastos mensuales de alquiler de equipos por proyecto

CREATE TABLE IF NOT EXISTS public.equipment_monthly_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    total_days INTEGER NOT NULL DEFAULT 0 CHECK (total_days >= 0),
    daily_rate DECIMAL(10,2) NOT NULL CHECK (daily_rate >= 0),
    total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount >= 0),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_equipment_monthly_expenses_equipment_id ON public.equipment_monthly_expenses(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_monthly_expenses_project_id ON public.equipment_monthly_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_monthly_expenses_year_month ON public.equipment_monthly_expenses(year, month);
CREATE INDEX IF NOT EXISTS idx_equipment_monthly_expenses_created_at ON public.equipment_monthly_expenses(created_at);

-- Crear constraint único para evitar duplicados
ALTER TABLE public.equipment_monthly_expenses 
ADD CONSTRAINT IF NOT EXISTS unique_equipment_project_year_month 
UNIQUE (equipment_id, project_id, year, month);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_equipment_monthly_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_equipment_monthly_expenses_updated_at
    BEFORE UPDATE ON public.equipment_monthly_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_monthly_expenses_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.equipment_monthly_expenses ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
-- Política para lectura: permitir a todos los usuarios autenticados
CREATE POLICY "Users can view equipment monthly expenses" ON public.equipment_monthly_expenses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserción: permitir a todos los usuarios autenticados
CREATE POLICY "Users can insert equipment monthly expenses" ON public.equipment_monthly_expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para actualización: permitir a todos los usuarios autenticados
CREATE POLICY "Users can update equipment monthly expenses" ON public.equipment_monthly_expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para eliminación: permitir a todos los usuarios autenticados
CREATE POLICY "Users can delete equipment monthly expenses" ON public.equipment_monthly_expenses
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comentarios para documentación
COMMENT ON TABLE public.equipment_monthly_expenses IS 'Tabla para almacenar los gastos mensuales de alquiler de equipos por proyecto';
COMMENT ON COLUMN public.equipment_monthly_expenses.equipment_id IS 'ID del equipo alquilado';
COMMENT ON COLUMN public.equipment_monthly_expenses.project_id IS 'ID del proyecto donde se usa el equipo';
COMMENT ON COLUMN public.equipment_monthly_expenses.year IS 'Año del gasto';
COMMENT ON COLUMN public.equipment_monthly_expenses.month IS 'Mes del gasto (1-12)';
COMMENT ON COLUMN public.equipment_monthly_expenses.total_days IS 'Total de días que se alquiló el equipo en el mes';
COMMENT ON COLUMN public.equipment_monthly_expenses.daily_rate IS 'Tarifa diaria de alquiler';
COMMENT ON COLUMN public.equipment_monthly_expenses.total_amount IS 'Monto total del gasto mensual';
COMMENT ON COLUMN public.equipment_monthly_expenses.notes IS 'Notas adicionales sobre el gasto';