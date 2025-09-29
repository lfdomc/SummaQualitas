-- Funciones SQL optimizadas para resúmenes y agregaciones
-- Estas funciones reducen el procesamiento en el cliente y mejoran el rendimiento

-- Función para obtener resumen de gastos por categoría
CREATE OR REPLACE FUNCTION get_expenses_summary_by_category(p_project_id UUID DEFAULT NULL)
RETURNS TABLE (
  category TEXT,
  total DECIMAL,
  total_usd DECIMAL,
  count INTEGER,
  percentage DECIMAL
) AS $$
DECLARE
  grand_total_usd DECIMAL := 0;
BEGIN
  -- Crear tabla temporal con resumen por categoría
  CREATE TEMP TABLE temp_category_summary AS
  SELECT 
    e.category,
    SUM(e.amount) as total_amount,
    SUM(CASE 
      WHEN e.currency = 'USD' THEN e.amount 
      ELSE e.amount / COALESCE(e.exchange_rate_usd, 600) 
    END) as total_amount_usd,
    COUNT(*)::INTEGER as expense_count
  FROM expenses e
  WHERE (p_project_id IS NULL OR e.project_id = p_project_id)
  GROUP BY e.category;

  -- Calcular total general en USD
  SELECT SUM(total_amount_usd) INTO grand_total_usd FROM temp_category_summary;

  -- Retornar resultados con porcentajes
  RETURN QUERY
  SELECT 
    tcs.category,
    tcs.total_amount,
    tcs.total_amount_usd,
    tcs.expense_count,
    CASE 
      WHEN grand_total_usd > 0 THEN (tcs.total_amount_usd / grand_total_usd) * 100 
      ELSE 0 
    END as percentage
  FROM temp_category_summary tcs
  ORDER BY tcs.total_amount_usd DESC;

  DROP TABLE temp_category_summary;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener resumen de gastos por proyecto
CREATE OR REPLACE FUNCTION get_expenses_summary_by_project()
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  total DECIMAL,
  total_usd DECIMAL,
  count INTEGER,
  percentage DECIMAL
) AS $$
DECLARE
  grand_total_usd DECIMAL := 0;
BEGIN
  -- Crear tabla temporal con resumen por proyecto
  CREATE TEMP TABLE temp_project_summary AS
  SELECT 
    e.project_id,
    p.name as project_name,
    SUM(e.amount) as total_amount,
    SUM(CASE 
      WHEN e.currency = 'USD' THEN e.amount 
      ELSE e.amount / COALESCE(e.exchange_rate_usd, 600) 
    END) as total_amount_usd,
    COUNT(*)::INTEGER as expense_count
  FROM expenses e
  INNER JOIN projects p ON e.project_id = p.id
  GROUP BY e.project_id, p.name;

  -- Calcular total general en USD
  SELECT SUM(total_amount_usd) INTO grand_total_usd FROM temp_project_summary;

  -- Retornar resultados con porcentajes
  RETURN QUERY
  SELECT 
    tps.project_id,
    tps.project_name,
    tps.total_amount,
    tps.total_amount_usd,
    tps.expense_count,
    CASE 
      WHEN grand_total_usd > 0 THEN (tps.total_amount_usd / grand_total_usd) * 100 
      ELSE 0 
    END as percentage
  FROM temp_project_summary tps
  ORDER BY tps.total_amount_usd DESC;

  DROP TABLE temp_project_summary;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener resumen completo de ingresos de un proyecto
CREATE OR REPLACE FUNCTION get_project_incomes_summary(p_project_id UUID)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  project_status TEXT,
  client_name TEXT,
  total_incomes INTEGER,
  total_amount DECIMAL,
  confirmed_amount DECIMAL,
  total_confirmed_amount DECIMAL,
  total_pending_amount DECIMAL,
  total_confirmed_usd DECIMAL,
  total_confirmed_crc DECIMAL,
  first_received_date DATE,
  last_received_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    c.name as client_name,
    COUNT(i.id)::INTEGER as total_incomes,
    COALESCE(SUM(i.amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN i.status IN ('confirmed', 'confirmado') THEN i.amount ELSE 0 END), 0) as confirmed_amount,
    COALESCE(SUM(CASE WHEN i.status IN ('confirmed', 'confirmado') THEN i.amount ELSE 0 END), 0) as total_confirmed_amount,
    COALESCE(SUM(CASE WHEN i.status IN ('pending', 'pendiente') THEN i.amount ELSE 0 END), 0) as total_pending_amount,
    COALESCE(SUM(CASE WHEN i.status IN ('confirmed', 'confirmado') AND i.currency = 'USD' THEN i.amount ELSE 0 END), 0) as total_confirmed_usd,
    COALESCE(SUM(CASE WHEN i.status IN ('confirmed', 'confirmado') AND i.currency = 'CRC' THEN i.amount ELSE 0 END), 0) as total_confirmed_crc,
    MIN(i.received_date) as first_received_date,
    MAX(i.received_date) as last_received_date
  FROM projects p
  LEFT JOIN clients c ON p.client_id = c.id
  LEFT JOIN incomes i ON p.id = i.project_id
  WHERE p.id = p_project_id
  GROUP BY p.id, p.name, p.status, c.name;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener datos completos del reporte de proyecto (optimizada)
CREATE OR REPLACE FUNCTION get_project_report_data(p_project_id UUID)
RETURNS TABLE (
  -- Datos del proyecto
  project_id UUID,
  project_name TEXT,
  project_status TEXT,
  client_name TEXT,
  
  -- Resumen de ingresos
  total_incomes INTEGER,
  total_income_amount DECIMAL,
  confirmed_income_amount DECIMAL,
  pending_income_amount DECIMAL,
  
  -- Resumen de gastos
  total_expenses INTEGER,
  total_expense_amount DECIMAL,
  total_expense_amount_usd DECIMAL,
  
  -- Resumen de órdenes de cambio
  total_change_orders INTEGER,
  total_change_order_amount DECIMAL,
  
  -- Fechas importantes
  first_income_date DATE,
  last_income_date DATE,
  first_expense_date DATE,
  last_expense_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    c.name as client_name,
    
    -- Resumen de ingresos
    COALESCE(income_summary.total_incomes, 0)::INTEGER,
    COALESCE(income_summary.total_amount, 0),
    COALESCE(income_summary.confirmed_amount, 0),
    COALESCE(income_summary.pending_amount, 0),
    
    -- Resumen de gastos
    COALESCE(expense_summary.total_expenses, 0)::INTEGER,
    COALESCE(expense_summary.total_amount, 0),
    COALESCE(expense_summary.total_amount_usd, 0),
    
    -- Resumen de órdenes de cambio
    COALESCE(change_order_summary.total_orders, 0)::INTEGER,
    COALESCE(change_order_summary.total_amount, 0),
    
    -- Fechas importantes
    income_summary.first_date,
    income_summary.last_date,
    expense_summary.first_date,
    expense_summary.last_date
    
  FROM projects p
  LEFT JOIN clients c ON p.client_id = c.id
  
  -- Subquery para resumen de ingresos
  LEFT JOIN (
    SELECT 
      i.project_id,
      COUNT(*)::INTEGER as total_incomes,
      SUM(i.amount) as total_amount,
      SUM(CASE WHEN i.status IN ('confirmed', 'confirmado') THEN i.amount ELSE 0 END) as confirmed_amount,
      SUM(CASE WHEN i.status IN ('pending', 'pendiente') THEN i.amount ELSE 0 END) as pending_amount,
      MIN(i.received_date) as first_date,
      MAX(i.received_date) as last_date
    FROM incomes i
    WHERE i.project_id = p_project_id
    GROUP BY i.project_id
  ) income_summary ON p.id = income_summary.project_id
  
  -- Subquery para resumen de gastos
  LEFT JOIN (
    SELECT 
      e.project_id,
      COUNT(*)::INTEGER as total_expenses,
      SUM(e.amount) as total_amount,
      SUM(CASE 
        WHEN e.currency = 'USD' THEN e.amount 
        ELSE e.amount / COALESCE(e.exchange_rate_usd, 600) 
      END) as total_amount_usd,
      MIN(e.expense_date) as first_date,
      MAX(e.expense_date) as last_date
    FROM expenses e
    WHERE e.project_id = p_project_id
    GROUP BY e.project_id
  ) expense_summary ON p.id = expense_summary.project_id
  
  -- Subquery para resumen de órdenes de cambio
  LEFT JOIN (
    SELECT 
      co.project_id,
      COUNT(*)::INTEGER as total_orders,
      SUM(co.amount) as total_amount
    FROM change_orders co
    WHERE co.project_id = p_project_id
    GROUP BY co.project_id
  ) change_order_summary ON p.id = change_order_summary.project_id
  
  WHERE p.id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de rendimiento de consultas
CREATE OR REPLACE FUNCTION get_query_performance_stats()
RETURNS TABLE (
  table_name TEXT,
  total_rows BIGINT,
  index_usage_ratio DECIMAL,
  avg_query_time_ms DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins + n_tup_upd + n_tup_del as total_rows,
    CASE 
      WHEN idx_scan + seq_scan > 0 THEN (idx_scan::DECIMAL / (idx_scan + seq_scan)) * 100 
      ELSE 0 
    END as index_usage_ratio,
    0::DECIMAL as avg_query_time_ms -- Placeholder, requiere pg_stat_statements
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY total_rows DESC;
END;
$$ LANGUAGE plpgsql;

-- Comentarios sobre las funciones
COMMENT ON FUNCTION get_expenses_summary_by_category IS 'Obtiene resumen optimizado de gastos agrupados por categoría con cálculo de porcentajes';
COMMENT ON FUNCTION get_expenses_summary_by_project IS 'Obtiene resumen optimizado de gastos agrupados por proyecto con cálculo de porcentajes';
COMMENT ON FUNCTION get_project_incomes_summary IS 'Obtiene resumen completo de ingresos de un proyecto con todos los cálculos agregados';
COMMENT ON FUNCTION get_project_report_data IS 'Obtiene datos completos del reporte de proyecto en una sola consulta optimizada';
COMMENT ON FUNCTION get_query_performance_stats IS 'Obtiene estadísticas de rendimiento de las tablas principales';