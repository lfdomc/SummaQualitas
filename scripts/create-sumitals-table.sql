-- Crear tabla sumitals
CREATE TABLE IF NOT EXISTS public.sumitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sumital_number INTEGER NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    project_date DATE NOT NULL,
    equipment_description TEXT NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    country_of_origin VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    warranty_period VARCHAR(100),
    useful_life VARCHAR(100),
    total_price DECIMAL(15,2) NOT NULL,
    maintenance TEXT,
    training TEXT,
    attached_documents JSONB DEFAULT '[]'::jsonb,
    is_approved BOOLEAN DEFAULT false,
    observations TEXT,
    approver_name VARCHAR(255),
    review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_sumitals_project_id ON public.sumitals(project_id);
CREATE INDEX IF NOT EXISTS idx_sumitals_sumital_number ON public.sumitals(sumital_number);
CREATE INDEX IF NOT EXISTS idx_sumitals_supplier_name ON public.sumitals(supplier_name);
CREATE INDEX IF NOT EXISTS idx_sumitals_is_approved ON public.sumitals(is_approved);
CREATE INDEX IF NOT EXISTS idx_sumitals_created_at ON public.sumitals(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sumitals_project_number ON public.sumitals(project_id, sumital_number);

-- Función para obtener el siguiente número de sumital por proyecto
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para establecer automáticamente el número de sumital
CREATE OR REPLACE FUNCTION public.set_sumital_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sumital_number IS NULL THEN
        NEW.sumital_number := public.get_next_sumital_number(NEW.project_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para establecer automáticamente el número de sumital
DROP TRIGGER IF EXISTS trigger_set_sumital_number ON public.sumitals;
CREATE TRIGGER trigger_set_sumital_number
    BEFORE INSERT ON public.sumitals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_sumital_number();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_sumitals_updated_at ON public.sumitals;
CREATE TRIGGER trigger_update_sumitals_updated_at
    BEFORE UPDATE ON public.sumitals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE public.sumitals ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Todos los usuarios autenticados pueden ver sumitals
CREATE POLICY "Authenticated users can view sumitals" ON public.sumitals
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para INSERT: Gerencia y administrativo pueden crear sumitals
CREATE POLICY "Gerencia and administrativo can insert sumitals" ON public.sumitals
    FOR INSERT WITH CHECK (
        get_user_role() IN ('gerencia', 'administrativo')
    );

-- Política para UPDATE: Gerencia, administrativo y managers de proyecto pueden actualizar sumitals
CREATE POLICY "Users can update sumitals" ON public.sumitals
    FOR UPDATE USING (
        get_user_role() IN ('gerencia', 'administrativo') OR 
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = sumitals.project_id AND p.manager_id = get_user_id()
        )
    );

-- Política para DELETE: Solo gerencia puede eliminar sumitals
CREATE POLICY "Gerencia can delete sumitals" ON public.sumitals
    FOR DELETE USING (get_user_role() = 'gerencia');

-- Comentarios para documentación
COMMENT ON TABLE public.sumitals IS 'Tabla para almacenar sumitals de equipos por proyecto';
COMMENT ON COLUMN public.sumitals.sumital_number IS 'Número consecutivo de sumital por proyecto';
COMMENT ON COLUMN public.sumitals.project_id IS 'ID del proyecto al que pertenece el sumital';
COMMENT ON COLUMN public.sumitals.equipment_description IS 'Descripción del equipo';
COMMENT ON COLUMN public.sumitals.supplier_name IS 'Nombre del proveedor';
COMMENT ON COLUMN public.sumitals.total_price IS 'Precio total del equipo';
COMMENT ON COLUMN public.sumitals.attached_documents IS 'Documentos adjuntos en formato JSON';
COMMENT ON COLUMN public.sumitals.is_approved IS 'Indica si el sumital está aprobado';