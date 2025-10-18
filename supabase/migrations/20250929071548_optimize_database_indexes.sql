-- =====================================================
-- OPTIMIZACIÓN DE ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Eliminar índices duplicados o innecesarios (con IF EXISTS para evitar errores)
DROP INDEX IF EXISTS idx_expenses_project_currency;
DROP INDEX IF EXISTS idx_projects_status_client;

-- =====================================================
-- ÍNDICES COMPUESTOS OPTIMIZADOS PARA CONSULTAS FRECUENTES
-- =====================================================

-- Índices para la tabla projects
CREATE INDEX IF NOT EXISTS idx_projects_status_client_created 
ON projects(status, client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_manager_status 
ON projects(manager_id, status) 
WHERE status IN ('planificacion', 'en_progreso', 'pausado');

-- Índices para la tabla expenses
CREATE INDEX IF NOT EXISTS idx_expenses_project_category_date 
ON expenses(project_id, category, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_project_status_amount 
ON expenses(project_id, payment_status, amount DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_supplier_date 
ON expenses(supplier_id, expense_date DESC) 
WHERE supplier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_currency_exchange 
ON expenses(currency, exchange_rate_usd) 
WHERE currency = 'CRC';

-- Índices para la tabla incomes
CREATE INDEX IF NOT EXISTS idx_incomes_project_status_date 
ON incomes(project_id, status, received_date DESC);

CREATE INDEX IF NOT EXISTS idx_incomes_client_status_amount 
ON incomes(client_id, status, amount DESC);

CREATE INDEX IF NOT EXISTS idx_incomes_date_status 
ON incomes(received_date DESC, status) 
WHERE status IN ('confirmado', 'pendiente');

-- Índices para la tabla change_orders (si existe la tabla y la columna)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'change_orders') THEN
        -- Crear índice sólo si la columna change_type existe
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'change_orders' AND column_name = 'change_type'
        ) THEN
          CREATE INDEX IF NOT EXISTS idx_change_orders_project_type_status 
          ON change_orders(project_id, change_type, status);
        END IF;
        
        -- Crear índice sólo si la columna cost_impact existe
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'change_orders' AND column_name = 'cost_impact'
        ) THEN
          CREATE INDEX IF NOT EXISTS idx_change_orders_date_cost 
          ON change_orders(created_at DESC, cost_impact DESC);
        END IF;
    END IF;
END $$;

-- =====================================================
-- ÍNDICES GIN PARA BÚSQUEDA DE TEXTO COMPLETO
-- =====================================================

-- Índice GIN para búsqueda en descripciones de gastos
CREATE INDEX IF NOT EXISTS idx_expenses_description_gin 
ON expenses USING gin(to_tsvector('spanish', COALESCE(description, '')));

-- Índice GIN para búsqueda en nombres de proyectos
CREATE INDEX IF NOT EXISTS idx_projects_name_gin 
ON projects USING gin(to_tsvector('spanish', COALESCE(name, '')));

-- =====================================================
-- ÍNDICES PARCIALES PARA REGISTROS ACTIVOS/PENDIENTES
-- =====================================================

-- Índice parcial para gastos pendientes de pago
CREATE INDEX IF NOT EXISTS idx_expenses_pending_payment 
ON expenses(project_id, amount DESC, expense_date DESC) 
WHERE payment_status = 'pendiente';

-- Índice parcial para ingresos confirmados
CREATE INDEX IF NOT EXISTS idx_incomes_confirmed 
ON incomes(project_id, amount DESC, received_date DESC) 
WHERE status = 'confirmado';

-- Índice parcial para proyectos activos
CREATE INDEX IF NOT EXISTS idx_projects_active 
ON projects(created_at DESC, client_id) 
WHERE status IN ('planificacion', 'en_progreso', 'pausado');

-- =====================================================
-- ÍNDICES PARA REPORTES Y AGREGACIONES
-- =====================================================

-- Índice optimizado para resúmenes de gastos por categoría
CREATE INDEX IF NOT EXISTS idx_expenses_category_summary 
ON expenses(category, currency, amount) 
WHERE amount > 0;

-- Índice optimizado para resúmenes de ingresos por proyecto
CREATE INDEX IF NOT EXISTS idx_incomes_project_summary 
ON incomes(project_id, status, currency, amount) 
WHERE amount > 0;

-- =====================================================
-- ÍNDICES PARA JOINS FRECUENTES
-- =====================================================

-- Índice para join expenses-projects
CREATE INDEX IF NOT EXISTS idx_expenses_project_join 
ON expenses(project_id) 
INCLUDE (amount, currency, category, expense_date);

-- Índice para join incomes-projects
CREATE INDEX IF NOT EXISTS idx_incomes_project_join 
ON incomes(project_id) 
INCLUDE (amount, currency, status, received_date);

-- Índice para join projects-clients
CREATE INDEX IF NOT EXISTS idx_projects_client_join 
ON projects(client_id) 
INCLUDE (name, status, created_at);

-- =====================================================
-- COMENTARIOS SOBRE LOS ÍNDICES
-- =====================================================

COMMENT ON INDEX idx_projects_status_client_created IS 'Optimiza consultas de proyectos por estado y cliente con ordenamiento por fecha';
COMMENT ON INDEX idx_expenses_project_category_date IS 'Optimiza consultas de gastos por proyecto y categoría con ordenamiento por fecha';
COMMENT ON INDEX idx_incomes_project_status_date IS 'Optimiza consultas de ingresos por proyecto y estado con ordenamiento por fecha';
COMMENT ON INDEX idx_expenses_description_gin IS 'Permite búsqueda de texto completo en descripciones de gastos';
COMMENT ON INDEX idx_projects_name_gin IS 'Permite búsqueda de texto completo en nombres de proyectos';