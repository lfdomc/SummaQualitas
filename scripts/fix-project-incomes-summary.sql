-- Actualizar vista para resumen de ingresos por proyecto
-- Corrige los campos faltantes: total_amount y confirmed_amount
-- También corrige los valores de status de inglés a español

DROP VIEW IF EXISTS public.project_incomes_summary;

CREATE OR REPLACE VIEW public.project_incomes_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    c.name as client_name,
    COUNT(i.id) as total_incomes,
    COALESCE(SUM(i.amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN i.status = 'confirmado' THEN i.amount ELSE 0 END), 0) as confirmed_amount,
    COALESCE(SUM(CASE WHEN i.status = 'confirmado' THEN i.amount ELSE 0 END), 0) as total_confirmed_amount,
    COALESCE(SUM(CASE WHEN i.status = 'pendiente' THEN i.amount ELSE 0 END), 0) as total_pending_amount,
    COALESCE(SUM(CASE WHEN i.status = 'confirmado' AND i.currency = 'USD' THEN i.amount ELSE 0 END), 0) as total_confirmed_usd,
    COALESCE(SUM(CASE WHEN i.status = 'confirmado' AND i.currency = 'CRC' THEN i.amount ELSE 0 END), 0) as total_confirmed_crc,
    MIN(i.received_date) as first_received_date,
    MAX(i.received_date) as last_received_date
FROM public.projects p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.incomes i ON p.id = i.project_id
GROUP BY p.id, p.name, p.status, c.name;

-- Agregar comentario a la vista
COMMENT ON VIEW public.project_incomes_summary IS 'Vista resumen de ingresos por proyecto - Actualizada con campos total_amount y confirmed_amount';

-- Mensaje de confirmación
SELECT 'Vista project_incomes_summary actualizada exitosamente' AS resultado;