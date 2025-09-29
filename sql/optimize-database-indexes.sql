-- =====================================================
-- OPTIMIZACIÓN DE ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Eliminar índices duplicados o innecesarios
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
WHERE status IN ('active', 'planning', 'in_progress');

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
WHERE status IN ('confirmed', 'confirmado');

-- Índices para la tabla change_orders
CREATE INDEX IF NOT EXISTS idx_change_orders_project_type_status 
ON change_orders(project_id, type, status);

CREATE INDEX IF NOT EXISTS idx_change_orders_project_date 
ON change_orders(project_id, created_at DESC);

-- =====================================================
-- ÍNDICES PARA BÚSQUEDAS DE TEXTO
-- =====================================================

-- Índices GIN para búsquedas de texto completo
CREATE INDEX IF NOT EXISTS idx_projects_search_gin 
ON projects USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_expenses_search_gin 
ON expenses USING gin(to_tsvector('spanish', description || ' ' || COALESCE(notes, '') || ' ' || COALESCE(invoice_number, '')));

CREATE INDEX IF NOT EXISTS idx_incomes_search_gin 
ON incomes USING gin(to_tsvector('spanish', description || ' ' || COALESCE(notes, '') || ' ' || COALESCE(reference_number, '')));

-- =====================================================
-- ÍNDICES PARCIALES PARA CONSULTAS ESPECÍFICAS
-- =====================================================

-- Índices parciales para registros activos/pendientes
CREATE INDEX IF NOT EXISTS idx_expenses_pending_payments 
ON expenses(project_id, amount DESC, expense_date DESC) 
WHERE payment_status = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_incomes_pending 
ON incomes(project_id, amount DESC, received_date DESC) 
WHERE status IN ('pending', 'pendiente');

CREATE INDEX IF NOT EXISTS idx_projects_active 
ON projects(client_id, created_at DESC, manager_id) 
WHERE status IN ('active', 'in_progress', 'planning');

-- =====================================================
-- ÍNDICES PARA REPORTES Y AGREGACIONES
-- =====================================================

-- Índices optimizados para cálculos de resúmenes
CREATE INDEX IF NOT EXISTS idx_expenses_category_amount 
ON expenses(category, amount, currency, exchange_rate_usd) 
WHERE amount > 0;

CREATE INDEX IF NOT EXISTS idx_incomes_status_amount 
ON incomes(status, amount, currency) 
WHERE amount > 0;

-- Índices para rangos de fechas en reportes
CREATE INDEX IF NOT EXISTS idx_expenses_date_range 
ON expenses(expense_date, project_id, amount) 
WHERE expense_date >= '2024-01-01';

CREATE INDEX IF NOT EXISTS idx_incomes_date_range 
ON incomes(received_date, project_id, amount) 
WHERE received_date >= '2024-01-01';

-- =====================================================
-- ÍNDICES PARA RELACIONES FRECUENTES
-- =====================================================

-- Optimizar JOINs frecuentes
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_project 
ON expenses(supplier_id, project_id) 
WHERE supplier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_incomes_client_project 
ON incomes(client_id, project_id);

-- =====================================================
-- ESTADÍSTICAS Y MANTENIMIENTO
-- =====================================================

-- Actualizar estadísticas de las tablas principales
ANALYZE projects;
ANALYZE expenses;
ANALYZE incomes;
ANALYZE change_orders;
ANALYZE clients;
ANALYZE suppliers;

-- =====================================================
-- FUNCIÓN PARA OBTENER RESUMEN DE PROYECTO OPTIMIZADO
-- =====================================================

CREATE OR REPLACE FUNCTION get_project_summary_optimized(p_project_id UUID)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  project_status TEXT,
  client_name TEXT,
  total_incomes DECIMAL,
  total_expenses DECIMAL,
  total_change_orders INTEGER,
  confirmed_incomes DECIMAL,
  pending_incomes DECIMAL,
  total_incomes_usd DECIMAL,
  total_expenses_usd DECIMAL,
  profit_margin DECIMAL,
  budget_utilization DECIMAL,
  last_activity_date DATE
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH project_data AS (
    SELECT 
      p.id,
      p.name,
      p.status,
      c.name as client_name,
      p.presupuesto_original
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.id = p_project_id
  ),
  income_summary AS (
    SELECT 
      SUM(amount) as total_incomes,
      SUM(CASE WHEN status IN ('confirmed', 'confirmado') THEN amount ELSE 0 END) as confirmed_incomes,
      SUM(CASE WHEN status IN ('pending', 'pendiente') THEN amount ELSE 0 END) as pending_incomes,
      SUM(CASE WHEN currency = 'USD' THEN amount ELSE amount / 600 END) as total_incomes_usd,
      MAX(received_date) as last_income_date
    FROM incomes 
    WHERE project_id = p_project_id
  ),
  expense_summary AS (
    SELECT 
      SUM(amount) as total_expenses,
      SUM(CASE WHEN currency = 'USD' THEN amount ELSE amount / COALESCE(exchange_rate_usd, 600) END) as total_expenses_usd,
      MAX(expense_date) as last_expense_date
    FROM expenses 
    WHERE project_id = p_project_id
  ),
  change_order_summary AS (
    SELECT 
      COUNT(*) as total_change_orders,
      MAX(created_at::date) as last_change_order_date
    FROM change_orders 
    WHERE project_id = p_project_id
  )
  SELECT 
    pd.id,
    pd.name,
    pd.status,
    pd.client_name,
    COALESCE(ins.total_incomes, 0),
    COALESCE(es.total_expenses, 0),
    COALESCE(cos.total_change_orders, 0)::INTEGER,
    COALESCE(ins.confirmed_incomes, 0),
    COALESCE(ins.pending_incomes, 0),
    COALESCE(ins.total_incomes_usd, 0),
    COALESCE(es.total_expenses_usd, 0),
    CASE 
      WHEN COALESCE(ins.total_incomes_usd, 0) > 0 
      THEN ((COALESCE(ins.total_incomes_usd, 0) - COALESCE(es.total_expenses_usd, 0)) / ins.total_incomes_usd) * 100
      ELSE 0 
    END as profit_margin,
    CASE 
      WHEN COALESCE(pd.presupuesto_original, 0) > 0 
      THEN (COALESCE(es.total_expenses_usd, 0) / pd.presupuesto_original) * 100
      ELSE 0 
    END as budget_utilization,
    GREATEST(
      COALESCE(ins.last_income_date, '1900-01-01'::date),
      COALESCE(es.last_expense_date, '1900-01-01'::date),
      COALESCE(cos.last_change_order_date, '1900-01-01'::date)
    ) as last_activity_date
  FROM project_data pd
  LEFT JOIN income_summary ins ON true
  LEFT JOIN expense_summary es ON true
  LEFT JOIN change_order_summary cos ON true;
END;
$$;

-- =====================================================
-- COMENTARIOS SOBRE OPTIMIZACIONES
-- =====================================================

COMMENT ON INDEX idx_projects_status_client_created IS 'Optimiza consultas de proyectos por estado y cliente con ordenamiento por fecha';
COMMENT ON INDEX idx_expenses_project_category_date IS 'Optimiza consultas de gastos por proyecto y categoría con ordenamiento por fecha';
COMMENT ON INDEX idx_incomes_project_status_date IS 'Optimiza consultas de ingresos por proyecto y estado con ordenamiento por fecha';
COMMENT ON INDEX idx_expenses_search_gin IS 'Índice GIN para búsquedas de texto completo en gastos';
COMMENT ON INDEX idx_incomes_search_gin IS 'Índice GIN para búsquedas de texto completo en ingresos';
COMMENT ON FUNCTION get_project_summary_optimized IS 'Función optimizada para obtener resumen completo de proyecto en una sola consulta';

-- Mostrar resultado de la optimización
SELECT 'Índices optimizados exitosamente. Se han creado ' || 
       (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') || 
       ' índices para mejorar el rendimiento.' as resultado;