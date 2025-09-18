-- =====================================================
-- SCRIPT PARA CREAR TABLA DE ÓRDENES DE CAMBIO
-- =====================================================
-- Este script crea la tabla change_orders y modifica
-- la tabla projects para manejar presupuestos originales
-- y finales con órdenes de cambio
-- =====================================================

-- Primero, agregar campos de presupuesto original y final a la tabla projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS presupuesto_original DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS presupuesto_final DECIMAL(15,2) DEFAULT 0;

-- Actualizar presupuesto_original con el valor actual de presupuesto_inicial
UPDATE public.projects 
SET presupuesto_original = presupuesto_inicial,
    presupuesto_final = presupuesto_inicial
WHERE presupuesto_original = 0;

-- Crear tabla de órdenes de cambio
CREATE TABLE IF NOT EXISTS public.change_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    document_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Información básica
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    designer VARCHAR(255),
    
    -- Tipo y clasificación
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('accion_correctiva', 'accion_preventiva', 'extras')),
    impact_type VARCHAR(20) NOT NULL CHECK (impact_type IN ('positivo', 'negativo')),
    
    -- Impacto financiero
    cost_impact DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'CRC',
    
    -- Impacto en cronograma (días)
    schedule_impact_days INTEGER DEFAULT 0,
    
    -- Características de la orden de cambio
    cost_impact_level VARCHAR(20) CHECK (cost_impact_level IN ('bajo', 'medio', 'alto')),
    quality_impact_level VARCHAR(20) CHECK (quality_impact_level IN ('bajo', 'medio', 'alto')),
    schedule_impact_level VARCHAR(20) CHECK (schedule_impact_level IN ('bajo', 'medio', 'alto')),
    risk_impact_level VARCHAR(20) CHECK (risk_impact_level IN ('bajo', 'medio', 'alto')),
    
    -- Comentarios y observaciones
    cost_comments TEXT,
    quality_comments TEXT,
    schedule_comments TEXT,
    risk_comments TEXT,
    general_comments TEXT,
    
    -- Estado y aprobación
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'implemented')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Fechas importantes
    requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
    implementation_date DATE,
    
    -- Metadatos
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON public.change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_document_number ON public.change_orders(document_number);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON public.change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_change_type ON public.change_orders(change_type);
CREATE INDEX IF NOT EXISTS idx_change_orders_created_at ON public.change_orders(created_at);

-- Agregar comentarios descriptivos
COMMENT ON TABLE public.change_orders IS 'Tabla para gestionar órdenes de cambio de proyectos';
COMMENT ON COLUMN public.change_orders.document_number IS 'Número único de documento de la orden de cambio';
COMMENT ON COLUMN public.change_orders.change_type IS 'Tipo de orden: accion_correctiva, accion_preventiva, extras';
COMMENT ON COLUMN public.change_orders.impact_type IS 'Tipo de impacto: positivo (aumenta presupuesto), negativo (disminuye presupuesto)';
COMMENT ON COLUMN public.change_orders.cost_impact IS 'Impacto monetario de la orden de cambio';
COMMENT ON COLUMN public.change_orders.schedule_impact_days IS 'Impacto en días del cronograma (positivo = retraso, negativo = adelanto)';
COMMENT ON COLUMN public.change_orders.cost_impact_level IS 'Nivel de impacto en costos: bajo, medio, alto';
COMMENT ON COLUMN public.change_orders.quality_impact_level IS 'Nivel de impacto en calidad: bajo, medio, alto';
COMMENT ON COLUMN public.change_orders.schedule_impact_level IS 'Nivel de impacto en cronograma: bajo, medio, alto';
COMMENT ON COLUMN public.change_orders.risk_impact_level IS 'Nivel de impacto en riesgo: bajo, medio, alto';

-- Comentarios para campos de presupuesto en projects
COMMENT ON COLUMN public.projects.presupuesto_original IS 'Presupuesto original del proyecto antes de órdenes de cambio';
COMMENT ON COLUMN public.projects.presupuesto_final IS 'Presupuesto final del proyecto después de aplicar órdenes de cambio';

-- Crear función para generar número de documento automáticamente
CREATE OR REPLACE FUNCTION generate_change_order_document_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    sequence_number INTEGER;
    document_number TEXT;
BEGIN
    -- Obtener el año actual
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Obtener el siguiente número de secuencia para este año
    SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM 'OC-' || current_year || '-(\\d+)') AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM public.change_orders
    WHERE document_number LIKE 'OC-' || current_year || '-%';
    
    -- Generar el número de documento con formato OC-YYYY-NNNN
    document_number := 'OC-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');
    
    RETURN document_number;
END;
$$ LANGUAGE plpgsql;

-- Crear función para actualizar presupuesto del proyecto
CREATE OR REPLACE FUNCTION update_project_budget_from_change_orders()
RETURNS TRIGGER AS $$
DECLARE
    total_change_impact DECIMAL(15,2);
    total_schedule_impact INTEGER;
    project_record RECORD;
BEGIN
    -- Obtener el proyecto afectado
    IF TG_OP = 'DELETE' THEN
        SELECT * INTO project_record FROM public.projects WHERE id = OLD.project_id;
    ELSE
        SELECT * INTO project_record FROM public.projects WHERE id = NEW.project_id;
    END IF;
    
    -- Calcular el impacto total de todas las órdenes de cambio aprobadas
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN impact_type = 'positivo' THEN cost_impact
                WHEN impact_type = 'negativo' THEN -cost_impact
                ELSE 0
            END
        ), 0),
        COALESCE(SUM(schedule_impact_days), 0)
    INTO total_change_impact, total_schedule_impact
    FROM public.change_orders
    WHERE project_id = project_record.id 
    AND status = 'approved';
    
    -- Actualizar el presupuesto final del proyecto
    UPDATE public.projects
    SET 
        presupuesto_final = presupuesto_original + total_change_impact,
        estimated_end_date = CASE 
            WHEN estimated_start_date IS NOT NULL AND total_schedule_impact != 0 THEN
                estimated_start_date + INTERVAL '1 day' * (
                    EXTRACT(DAY FROM (estimated_end_date - estimated_start_date)) + total_schedule_impact
                )
            ELSE estimated_end_date
        END,
        updated_at = NOW()
    WHERE id = project_record.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar automáticamente el presupuesto del proyecto
CREATE TRIGGER trigger_update_project_budget
    AFTER INSERT OR UPDATE OR DELETE ON public.change_orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR TG_OP = 'DELETE' OR TG_OP = 'INSERT')
    EXECUTE FUNCTION update_project_budget_from_change_orders();

-- Crear trigger para actualizar updated_at
CREATE TRIGGER trigger_change_orders_updated_at
    BEFORE UPDATE ON public.change_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Users can view change orders" ON public.change_orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert change orders" ON public.change_orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update change orders" ON public.change_orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete change orders" ON public.change_orders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Crear vista para resumen de órdenes de cambio por proyecto
CREATE OR REPLACE VIEW public.project_change_orders_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.presupuesto_original,
    p.presupuesto_final,
    (p.presupuesto_final - p.presupuesto_original) as total_change_impact,
    COUNT(co.id) as total_change_orders,
    COUNT(CASE WHEN co.status = 'approved' THEN 1 END) as approved_change_orders,
    COUNT(CASE WHEN co.status = 'pending_approval' THEN 1 END) as pending_change_orders,
    COUNT(CASE WHEN co.impact_type = 'positivo' AND co.status = 'approved' THEN 1 END) as positive_changes,
    COUNT(CASE WHEN co.impact_type = 'negativo' AND co.status = 'approved' THEN 1 END) as negative_changes,
    COALESCE(SUM(CASE WHEN co.impact_type = 'positivo' AND co.status = 'approved' THEN co.cost_impact ELSE 0 END), 0) as total_positive_impact,
    COALESCE(SUM(CASE WHEN co.impact_type = 'negativo' AND co.status = 'approved' THEN co.cost_impact ELSE 0 END), 0) as total_negative_impact,
    COALESCE(SUM(CASE WHEN co.status = 'approved' THEN co.schedule_impact_days ELSE 0 END), 0) as total_schedule_impact_days
FROM public.projects p
LEFT JOIN public.change_orders co ON p.id = co.project_id
GROUP BY p.id, p.name, p.presupuesto_original, p.presupuesto_final;

COMMENT ON VIEW public.project_change_orders_summary IS 'Vista resumen de órdenes de cambio por proyecto';

-- Mensaje de confirmación
SELECT 'Tabla de órdenes de cambio creada exitosamente con triggers, políticas RLS y vista resumen' AS resultado;