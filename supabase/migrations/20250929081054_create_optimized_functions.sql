-- Funciones SQL optimizadas para mejorar el rendimiento

-- 1. Función para obtener resumen de proyecto con gastos e ingresos
CREATE OR REPLACE FUNCTION get_project_summary(project_uuid UUID)
RETURNS TABLE (
    project_id UUID,
    project_name VARCHAR,
    project_status VARCHAR,
    total_expenses DECIMAL,
    total_incomes DECIMAL,
    net_balance DECIMAL,
    pending_expenses DECIMAL,
    confirmed_incomes DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.status,
        COALESCE(e.total_expenses, 0) as total_expenses,
        COALESCE(i.total_incomes, 0) as total_incomes,
        COALESCE(i.total_incomes, 0) - COALESCE(e.total_expenses, 0) as net_balance,
        COALESCE(e.pending_expenses, 0) as pending_expenses,
        COALESCE(i.confirmed_incomes, 0) as confirmed_incomes
    FROM projects p
    LEFT JOIN (
        SELECT 
            project_id,
            SUM(amount) as total_expenses,
            SUM(CASE WHEN payment_status = 'pendiente' THEN amount ELSE 0 END) as pending_expenses
        FROM expenses 
        WHERE project_id = project_uuid
        GROUP BY project_id
    ) e ON p.id = e.project_id
    LEFT JOIN (
        SELECT 
            project_id,
            SUM(amount) as total_incomes,
            SUM(CASE WHEN status = 'confirmado' THEN amount ELSE 0 END) as confirmed_incomes
        FROM incomes 
        WHERE project_id = project_uuid
        GROUP BY project_id
    ) i ON p.id = i.project_id
    WHERE p.id = project_uuid;
END;
$$;

-- 2. Paginated Expenses Function
CREATE OR REPLACE FUNCTION get_expenses_paginated(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_project_id UUID DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_payment_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    project_id UUID,
    supplier_id UUID,
    supplier_name TEXT,
    description TEXT,
    amount DECIMAL(15,2),
    currency VARCHAR(3),
    category TEXT,
    expense_date DATE,
    payment_status TEXT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.project_id,
        e.supplier_id,
        s.name as supplier_name,
        e.description,
        e.amount,
        e.currency,
        e.category::TEXT,
        e.expense_date,
        e.payment_status::TEXT,
        COUNT(*) OVER() as total_count
    FROM expenses e
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    WHERE 
        (p_project_id IS NULL OR e.project_id = p_project_id)
        AND (p_category IS NULL OR e.category::TEXT = p_category)
        AND (p_payment_status IS NULL OR e.payment_status::TEXT = p_payment_status)
    ORDER BY e.expense_date DESC, e.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para obtener dashboard de KPIs
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS TABLE (
    total_projects BIGINT,
    active_projects BIGINT,
    completed_projects BIGINT,
    total_expenses DECIMAL,
    total_incomes DECIMAL,
    pending_payments DECIMAL,
    monthly_expenses DECIMAL,
    monthly_incomes DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'en_progreso') as active_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'completado') as completed_projects,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses) as total_expenses,
        (SELECT COALESCE(SUM(amount), 0) FROM incomes) as total_incomes,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE payment_status = 'pendiente') as pending_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses 
         WHERE expense_date >= date_trunc('month', CURRENT_DATE)) as monthly_expenses,
        (SELECT COALESCE(SUM(amount), 0) FROM incomes 
         WHERE received_date >= date_trunc('month', CURRENT_DATE)) as monthly_incomes;
END;
$$;

-- 4. Función para obtener proyectos con resumen financiero
CREATE OR REPLACE FUNCTION get_projects_with_financial_summary(
    p_status VARCHAR DEFAULT NULL,
    p_client_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    status VARCHAR,
    client_id UUID,
    client_name VARCHAR,
    manager_id UUID,
    start_date DATE,
    end_date DATE,
    total_expenses DECIMAL,
    total_incomes DECIMAL,
    net_balance DECIMAL,
    expenses_count BIGINT,
    incomes_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.client_id,
        c.name as client_name,
        p.manager_id,
        p.start_date,
        p.end_date,
        COALESCE(e.total_expenses, 0) as total_expenses,
        COALESCE(i.total_incomes, 0) as total_incomes,
        COALESCE(i.total_incomes, 0) - COALESCE(e.total_expenses, 0) as net_balance,
        COALESCE(e.expenses_count, 0) as expenses_count,
        COALESCE(i.incomes_count, 0) as incomes_count
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN (
        SELECT 
            project_id,
            SUM(amount) as total_expenses,
            COUNT(*) as expenses_count
        FROM expenses 
        GROUP BY project_id
    ) e ON p.id = e.project_id
    LEFT JOIN (
        SELECT 
            project_id,
            SUM(amount) as total_incomes,
            COUNT(*) as incomes_count
        FROM incomes 
        GROUP BY project_id
    ) i ON p.id = i.project_id
    WHERE (p_status IS NULL OR p.status = p_status)
      AND (p_client_id IS NULL OR p.client_id = p_client_id)
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 5. Full-text Search for Expenses Function
CREATE OR REPLACE FUNCTION search_expenses_fulltext(
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    project_id UUID,
    description TEXT,
    supplier_name TEXT,
    amount DECIMAL(15,2),
    expense_date DATE,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.project_id,
        e.description,
        s.name as supplier_name,
        e.amount,
        e.expense_date,
        ts_rank(
            to_tsvector('spanish', COALESCE(e.description, '') || ' ' || COALESCE(s.name, '')),
            plainto_tsquery('spanish', p_search_term)
        ) as relevance
    FROM expenses e
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    WHERE 
        to_tsvector('spanish', COALESCE(e.description, '') || ' ' || COALESCE(s.name, ''))
        @@ plainto_tsquery('spanish', p_search_term)
    ORDER BY relevance DESC, e.expense_date DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 6. Expenses by Category and Period Function
CREATE OR REPLACE FUNCTION get_expenses_by_category_period(
    p_start_date DATE,
    p_end_date DATE,
    p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    category TEXT,
    total_amount DECIMAL(15,2),
    expense_count INTEGER,
    avg_amount DECIMAL(15,2),
    max_amount DECIMAL(15,2),
    min_amount DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.category::TEXT as category,
        SUM(e.amount)::DECIMAL(15,2) as total_amount,
        COUNT(*)::INTEGER as expense_count,
        AVG(e.amount)::DECIMAL(15,2) as avg_amount,
        MAX(e.amount)::DECIMAL(15,2) as max_amount,
        MIN(e.amount)::DECIMAL(15,2) as min_amount
    FROM expenses e
    WHERE 
        e.expense_date BETWEEN p_start_date AND p_end_date
        AND (p_project_id IS NULL OR e.project_id = p_project_id)
    GROUP BY e.category
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Incomes with Project Info Function
CREATE OR REPLACE FUNCTION get_incomes_with_project_info(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_project_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    project_id UUID,
    project_name TEXT,
    client_name TEXT,
    amount DECIMAL(15,2),
    description TEXT,
    received_date DATE,
    status TEXT,
    payment_method TEXT,
    reference_number TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.project_id,
        p.name as project_name,
        c.name as client_name,
        i.amount,
        i.description,
        i.received_date,
        i.status,
        i.payment_method,
        i.reference_number
    FROM incomes i
    LEFT JOIN projects p ON i.project_id = p.id
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE 
        (p_project_id IS NULL OR i.project_id = p_project_id)
        AND (p_status IS NULL OR i.status = p_status)
    ORDER BY i.received_date DESC, i.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Comentarios sobre las funciones creadas
COMMENT ON FUNCTION get_project_summary(UUID) IS 'Obtiene resumen financiero completo de un proyecto específico';
COMMENT ON FUNCTION get_expenses_paginated IS 'Obtiene gastos con paginación y filtros optimizados';
COMMENT ON FUNCTION get_dashboard_kpis() IS 'Obtiene KPIs principales para el dashboard ejecutivo';
COMMENT ON FUNCTION get_projects_with_financial_summary IS 'Obtiene proyectos con resumen financiero agregado';
COMMENT ON FUNCTION search_expenses_fulltext IS 'Búsqueda de texto completo en gastos con ranking de relevancia';
COMMENT ON FUNCTION get_expenses_by_category_period IS 'Análisis de gastos por categoría en un período específico';
COMMENT ON FUNCTION get_incomes_with_project_info IS 'Obtiene ingresos con información completa del proyecto y cliente';