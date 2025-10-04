-- =====================================================
-- VERIFICACIÓN Y APLICACIÓN DE ÍNDICES DE RENDIMIENTO
-- =====================================================

-- Verificar índices existentes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('projects', 'expenses', 'incomes', 'suppliers', 'clients')
ORDER BY tablename, indexname;

-- =====================================================
-- APLICAR ÍNDICES CRÍTICOS PARA ANALYTICS
-- =====================================================

-- Índices para la tabla projects (críticos para analytics)
CREATE INDEX IF NOT EXISTS idx_projects_status 
ON projects(status) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_created_at 
ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_client_id 
ON projects(client_id) 
WHERE client_id IS NOT NULL;

-- Índices para la tabla expenses (críticos para KPIs)
CREATE INDEX IF NOT EXISTS idx_expenses_project_id 
ON expenses(project_id) 
WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_project_date 
ON expenses(project_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_category 
ON expenses(category) 
WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_payment_status 
ON expenses(payment_status) 
WHERE payment_status IS NOT NULL;

-- Índices para la tabla incomes (críticos para KPIs)
CREATE INDEX IF NOT EXISTS idx_incomes_project_id 
ON incomes(project_id) 
WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_incomes_project_date 
ON incomes(project_id, received_date DESC);

CREATE INDEX IF NOT EXISTS idx_incomes_status 
ON incomes(status) 
WHERE status IS NOT NULL;

-- Índices compuestos para consultas complejas de analytics
CREATE INDEX IF NOT EXISTS idx_expenses_project_category_date 
ON expenses(project_id, category, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_incomes_project_status_date 
ON incomes(project_id, status, received_date DESC);

-- Índices para optimizar JOINs frecuentes
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id 
ON expenses(supplier_id) 
WHERE supplier_id IS NOT NULL;

-- =====================================================
-- ACTUALIZAR ESTADÍSTICAS
-- =====================================================

-- Actualizar estadísticas para el optimizador de consultas
ANALYZE projects;
ANALYZE expenses;
ANALYZE incomes;
ANALYZE suppliers;
ANALYZE clients;

-- =====================================================
-- VERIFICAR ÍNDICES APLICADOS
-- =====================================================

-- Mostrar resumen de índices creados
SELECT 
    'Índices aplicados exitosamente. Total de índices: ' || 
    COUNT(*) || ' para las tablas principales.' as resultado
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('projects', 'expenses', 'incomes', 'suppliers', 'clients')
    AND indexname LIKE 'idx_%';

-- Mostrar índices específicos para analytics
SELECT 
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE '%project%' THEN 'Crítico para Analytics'
        WHEN indexname LIKE '%date%' THEN 'Optimización de fechas'
        WHEN indexname LIKE '%status%' THEN 'Filtros de estado'
        ELSE 'Optimización general'
    END as tipo_optimizacion
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('projects', 'expenses', 'incomes')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, tipo_optimizacion;