-- Corregir la función get_expenses_paginated con tipos de datos correctos

DROP FUNCTION IF EXISTS get_expenses_paginated(INTEGER, INTEGER, UUID, TEXT, TEXT) CASCADE;

CREATE FUNCTION get_expenses_paginated(
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
    supplier_name VARCHAR(255),
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