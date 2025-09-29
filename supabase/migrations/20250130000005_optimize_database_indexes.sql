-- Optimización de índices para mejorar el rendimiento de consultas
-- Fecha: 2025-01-30
-- Descripción: Creación de índices estratégicos para las consultas más frecuentes

-- ============================================================================
-- ÍNDICES PARA TABLA PROJECTS
-- ============================================================================

-- Índice para búsquedas por estado del proyecto
CREATE INDEX IF NOT EXISTS idx_projects_status 
ON projects(status) 
WHERE status IS NOT NULL;

-- Índice para ordenamiento por fecha de creación
CREATE INDEX IF NOT EXISTS idx_projects_created_at 
ON projects(created_at DESC);

-- Índice para búsquedas por nombre (para autocompletado)
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm 
ON projects USING gin(name gin_trgm_ops);

-- ============================================================================
-- ÍNDICES PARA TABLA EXPENSES
-- ============================================================================

-- Índice compuesto para consultas por proyecto y fecha
CREATE INDEX IF NOT EXISTS idx_expenses_project_date 
ON expenses(project_id, expense_date DESC);

-- Índice para consultas por categoría
CREATE INDEX IF NOT EXISTS idx_expenses_category 
ON expenses(category) 
WHERE category IS NOT NULL;

-- Índice para consultas por estado de pago
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status 
ON expenses(payment_status) 
WHERE payment_status IS NOT NULL;

-- Índice para búsquedas de texto completo en descripción
CREATE INDEX IF NOT EXISTS idx_expenses_description_trgm 
ON expenses USING gin(description gin_trgm_ops);

-- Índice compuesto para reportes por proyecto, categoría y fecha
CREATE INDEX IF NOT EXISTS idx_expenses_project_category_date 
ON expenses(project_id, category, expense_date DESC);

-- Índice para consultas por proveedor
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id 
ON expenses(supplier_id) 
WHERE supplier_id IS NOT NULL;

-- Índice para consultas por rango de montos
CREATE INDEX IF NOT EXISTS idx_expenses_amount 
ON expenses(amount) 
WHERE amount > 0;

-- ============================================================================
-- ÍNDICES PARA TABLA INCOMES
-- ============================================================================

-- Índice compuesto para consultas por proyecto y fecha
CREATE INDEX IF NOT EXISTS idx_incomes_project_date 
ON incomes(project_id, income_date DESC);

-- Índice para consultas por estado
CREATE INDEX IF NOT EXISTS idx_incomes_status 
ON incomes(status) 
WHERE status IS NOT NULL;

-- Índice para búsquedas de texto completo en descripción
CREATE INDEX IF NOT EXISTS idx_incomes_description_trgm 
ON incomes USING gin(description gin_trgm_ops);

-- Índice para consultas por rango de montos
CREATE INDEX IF NOT EXISTS idx_incomes_amount 
ON incomes(amount) 
WHERE amount > 0;

-- ============================================================================
-- ÍNDICES PARA TABLA SUPPLIERS
-- ============================================================================

-- Índice para búsquedas por nombre de proveedor
CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm 
ON suppliers USING gin(name gin_trgm_ops);

-- Índice para consultas por estado activo
CREATE INDEX IF NOT EXISTS idx_suppliers_active 
ON suppliers(active) 
WHERE active = true;

-- ============================================================================
-- ÍNDICES PARA TABLA EQUIPMENT (si existe)
-- ============================================================================

-- Verificar si la tabla equipment existe antes de crear índices
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
        -- Índice para consultas por proyecto
        CREATE INDEX IF NOT EXISTS idx_equipment_project_id 
        ON equipment(project_id) 
        WHERE project_id IS NOT NULL;
        
        -- Índice para búsquedas por nombre de equipo
        CREATE INDEX IF NOT EXISTS idx_equipment_name_trgm 
        ON equipment USING gin(name gin_trgm_ops);
        
        -- Índice para consultas por estado
        CREATE INDEX IF NOT EXISTS idx_equipment_status 
        ON equipment(status) 
        WHERE status IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- ÍNDICES PARA OPTIMIZAR FUNCIONES ESPECÍFICAS
-- ============================================================================

-- Índice para optimizar get_dashboard_kpis
-- (Ya cubierto por los índices anteriores)

-- Índice para optimizar get_expenses_paginated
CREATE INDEX IF NOT EXISTS idx_expenses_paginated_optimization 
ON expenses(project_id, category, payment_status, expense_date DESC, id);

-- Índice para optimizar get_projects_with_summary
-- (Ya cubierto por idx_projects_created_at)

-- Índice para optimizar search_expenses_fulltext
-- (Ya cubierto por idx_expenses_description_trgm)

-- Índice para optimizar get_expenses_by_category_period
CREATE INDEX IF NOT EXISTS idx_expenses_category_period 
ON expenses(expense_date, category, project_id) 
WHERE expense_date IS NOT NULL AND category IS NOT NULL;

-- ============================================================================
-- ESTADÍSTICAS Y MANTENIMIENTO
-- ============================================================================

-- Actualizar estadísticas de las tablas para el optimizador de consultas
ANALYZE projects;
ANALYZE expenses;
ANALYZE incomes;
ANALYZE suppliers;

-- Verificar si equipment existe y analizarla
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
        EXECUTE 'ANALYZE equipment';
    END IF;
END $$;

-- ============================================================================
-- COMENTARIOS SOBRE LOS ÍNDICES CREADOS
-- ============================================================================

COMMENT ON INDEX idx_projects_status IS 'Optimiza consultas por estado del proyecto';
COMMENT ON INDEX idx_projects_created_at IS 'Optimiza ordenamiento por fecha de creación';
COMMENT ON INDEX idx_projects_name_trgm IS 'Optimiza búsquedas de texto en nombres de proyecto';

COMMENT ON INDEX idx_expenses_project_date IS 'Optimiza consultas de gastos por proyecto y fecha';
COMMENT ON INDEX idx_expenses_category IS 'Optimiza filtros por categoría de gasto';
COMMENT ON INDEX idx_expenses_payment_status IS 'Optimiza filtros por estado de pago';
COMMENT ON INDEX idx_expenses_description_trgm IS 'Optimiza búsquedas de texto completo en descripciones';

COMMENT ON INDEX idx_incomes_project_date IS 'Optimiza consultas de ingresos por proyecto y fecha';
COMMENT ON INDEX idx_incomes_status IS 'Optimiza filtros por estado de ingreso';

COMMENT ON INDEX idx_suppliers_name_trgm IS 'Optimiza búsquedas de proveedores por nombre';

-- ============================================================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- ============================================================================

-- Mostrar información sobre los índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;