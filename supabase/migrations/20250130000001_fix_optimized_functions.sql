-- Corregir y recrear funciones optimizadas con nombres de columnas correctos

-- Eliminar funciones existentes para evitar conflictos de tipo
DROP FUNCTION IF EXISTS get_dashboard_kpis();
DROP FUNCTION IF EXISTS get_expenses_paginated(INTEGER, INTEGER, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_projects_with_summary(INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_incomes_with_project_info(INTEGER, INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS search_expenses_fulltext(TEXT, INTEGER, INTEGER, UUID);
DROP FUNCTION IF EXISTS get_expenses_by_category_period(DATE, DATE, UUID);

-- 1. Función para obtener KPIs del dashboard (corregida)
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

-- 2. Función para obtener gastos paginados (corregida)
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

-- 3. Función para obtener proyectos con resumen (nueva)
CREATE OR REPLACE FUNCTION get_projects_with_summary(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    status VARCHAR,
    client_name VARCHAR,
    total_expenses DECIMAL,
    total_incomes DECIMAL,
    net_balance DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        c.name as client_name,
        COALESCE(e.total_expenses, 0) as total_expenses,
        COALESCE(i.total_incomes, 0) as total_incomes,
        COALESCE(i.total_incomes, 0) - COALESCE(e.total_expenses, 0) as net_balance,
        p.created_at
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN (
        SELECT 
            project_id,
            SUM(amount) as total_expenses
        FROM expenses 
        GROUP BY project_id
    ) e ON p.id = e.project_id
    LEFT JOIN (
        SELECT 
            project_id,
            SUM(amount) as total_incomes
        FROM incomes 
        GROUP BY project_id
    ) i ON p.id = i.project_id
    WHERE (p_status IS NULL OR p.status = p_status)
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para obtener ingresos con información del proyecto (corregida)
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

-- 5. Función de búsqueda de texto completo en gastos (nueva)
CREATE OR REPLACE FUNCTION search_expenses_fulltext(
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    project_id UUID,
    supplier_name TEXT,
    description TEXT,
    amount DECIMAL(15,2),
    category TEXT,
    expense_date DATE,
    payment_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.project_id,
        s.name as supplier_name,
        e.description,
        e.amount,
        e.category::TEXT,
        e.expense_date,
        e.payment_status::TEXT
    FROM expenses e
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    WHERE 
        (p_project_id IS NULL OR e.project_id = p_project_id)
        AND (
            e.description ILIKE '%' || p_search_term || '%'
            OR s.name ILIKE '%' || p_search_term || '%'
            OR e.category::TEXT ILIKE '%' || p_search_term || '%'
        )
    ORDER BY e.expense_date DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para obtener gastos por categoría y período (nueva)
CREATE OR REPLACE FUNCTION get_expenses_by_category_period(
    p_start_date DATE,
    p_end_date DATE,
    p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    category TEXT,
    total_amount DECIMAL,
    expense_count BIGINT,
    avg_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.category::TEXT,
        SUM(e.amount) as total_amount,
        COUNT(*) as expense_count,
        AVG(e.amount) as avg_amount
    FROM expenses e
    WHERE 
        e.expense_date >= p_start_date
        AND e.expense_date <= p_end_date
        AND (p_project_id IS NULL OR e.project_id = p_project_id)
    GROUP BY e.category
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;