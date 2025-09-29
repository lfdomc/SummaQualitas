-- =====================================================
-- SCRIPT: CORREGIR TRIGGER DE ÓRDENES DE CAMBIO
-- =====================================================
-- Este script corrige el trigger que actualiza el presupuesto_final
-- para usar los estados correctos en español
-- =====================================================

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS trigger_update_project_budget ON public.change_orders;

-- Recrear la función con los estados correctos
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
    -- CORREGIDO: Usar 'aprobado' en lugar de 'approved'
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN impact_type = 'positivo' THEN COALESCE(cost_impact_crc, cost_impact, 0)
                WHEN impact_type = 'negativo' THEN -COALESCE(cost_impact_crc, cost_impact, 0)
                ELSE 0
            END
        ), 0),
        COALESCE(SUM(schedule_impact_days), 0)
    INTO total_change_impact, total_schedule_impact
    FROM public.change_orders
    WHERE project_id = project_record.id 
    AND status = 'aprobado';  -- CORREGIDO: usar 'aprobado' en lugar de 'approved'
    
    -- Actualizar el presupuesto final del proyecto
    UPDATE public.projects
    SET 
        presupuesto_final = COALESCE(presupuesto_original, presupuesto_inicial, budget, 0) + total_change_impact,
        estimated_end_date = CASE 
            WHEN estimated_start_date IS NOT NULL AND total_schedule_impact != 0 THEN
                estimated_start_date + INTERVAL '1 day' * (
                    COALESCE(EXTRACT(DAY FROM (estimated_end_date - estimated_start_date)), 0) + total_schedule_impact
                )
            ELSE estimated_end_date
        END,
        updated_at = NOW()
    WHERE id = project_record.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
CREATE TRIGGER trigger_update_project_budget
    AFTER INSERT OR UPDATE OR DELETE ON public.change_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_project_budget_from_change_orders();

-- Actualizar la vista resumen también
CREATE OR REPLACE VIEW public.project_change_orders_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.presupuesto_original,
    p.presupuesto_final,
    (COALESCE(p.presupuesto_final, 0) - COALESCE(p.presupuesto_original, p.presupuesto_inicial, p.budget, 0)) as total_change_impact,
    COUNT(co.id) as total_change_orders,
    COUNT(CASE WHEN co.status = 'aprobado' THEN 1 END) as approved_change_orders,  -- CORREGIDO
    COUNT(CASE WHEN co.status = 'pendiente' THEN 1 END) as pending_change_orders,  -- CORREGIDO
    COUNT(CASE WHEN co.impact_type = 'positivo' AND co.status = 'aprobado' THEN 1 END) as positive_changes,  -- CORREGIDO
    COUNT(CASE WHEN co.impact_type = 'negativo' AND co.status = 'aprobado' THEN 1 END) as negative_changes,  -- CORREGIDO
    COALESCE(SUM(CASE WHEN co.impact_type = 'positivo' AND co.status = 'aprobado' THEN COALESCE(co.cost_impact_crc, co.cost_impact, 0) ELSE 0 END), 0) as total_positive_impact,  -- CORREGIDO
    COALESCE(SUM(CASE WHEN co.impact_type = 'negativo' AND co.status = 'aprobado' THEN COALESCE(co.cost_impact_crc, co.cost_impact, 0) ELSE 0 END), 0) as total_negative_impact,  -- CORREGIDO
    COALESCE(SUM(CASE WHEN co.status = 'aprobado' THEN co.schedule_impact_days ELSE 0 END), 0) as total_schedule_impact_days  -- CORREGIDO
FROM public.projects p
LEFT JOIN public.change_orders co ON p.id = co.project_id
GROUP BY p.id, p.name, p.presupuesto_original, p.presupuesto_final;

-- Forzar recálculo del presupuesto final para todos los proyectos
-- Esto corregirá cualquier inconsistencia existente
UPDATE public.projects 
SET presupuesto_final = (
    SELECT COALESCE(p.presupuesto_original, p.presupuesto_inicial, p.budget, 0) + COALESCE(SUM(
        CASE 
            WHEN co.impact_type = 'positivo' AND co.status = 'aprobado' THEN COALESCE(co.cost_impact_crc, co.cost_impact, 0)
            WHEN co.impact_type = 'negativo' AND co.status = 'aprobado' THEN -COALESCE(co.cost_impact_crc, co.cost_impact, 0)
            ELSE 0
        END
    ), 0)
    FROM public.projects p
    LEFT JOIN public.change_orders co ON p.id = co.project_id
    WHERE p.id = projects.id
    GROUP BY p.id, p.presupuesto_original, p.presupuesto_inicial, p.budget
),
updated_at = NOW();

-- Mensaje de confirmación
SELECT 'Trigger de órdenes de cambio corregido exitosamente. Presupuestos finales recalculados.' AS resultado;