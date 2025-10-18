-- Migration: Update optimized RPC functions for incomes summary and project report data
-- Purpose: Ensure Supabase has the latest optimized versions of functions used by the app
-- Created at: 2025-10-13 02:00 UTC

-- Function: get_project_incomes_summary
CREATE OR REPLACE FUNCTION public.get_project_incomes_summary(p_project_id UUID)
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
  FROM public.projects p
  LEFT JOIN public.clients c ON p.client_id = c.id
  LEFT JOIN public.incomes i ON p.id = i.project_id
  WHERE p.id = p_project_id
  GROUP BY p.id, p.name, p.status, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_project_incomes_summary IS 'Obtiene resumen completo de ingresos de un proyecto con todos los cálculos agregados';

-- Function: get_project_report_data
CREATE OR REPLACE FUNCTION public.get_project_report_data(p_project_id UUID)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  project_status TEXT,
  client_name TEXT,
  total_incomes INTEGER,
  total_income_amount DECIMAL,
  confirmed_income_amount DECIMAL,
  pending_income_amount DECIMAL,
  total_expenses INTEGER,
  total_expense_amount DECIMAL,
  total_expense_amount_usd DECIMAL,
  total_change_orders INTEGER,
  total_change_order_amount DECIMAL,
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
    COALESCE(income_summary.total_incomes, 0)::INTEGER,
    COALESCE(income_summary.total_amount, 0),
    COALESCE(income_summary.confirmed_amount, 0),
    COALESCE(income_summary.pending_amount, 0),
    COALESCE(expense_summary.total_expenses, 0)::INTEGER,
    COALESCE(expense_summary.total_amount, 0),
    COALESCE(expense_summary.total_amount_usd, 0),
    COALESCE(change_order_summary.total_orders, 0)::INTEGER,
    COALESCE(change_order_summary.total_amount, 0),
    income_summary.first_date,
    income_summary.last_date,
    expense_summary.first_date,
    expense_summary.last_date
  FROM public.projects p
  LEFT JOIN public.clients c ON p.client_id = c.id
  LEFT JOIN (
    SELECT 
      i.project_id,
      COUNT(*)::INTEGER as total_incomes,
      SUM(i.amount) as total_amount,
      SUM(CASE WHEN i.status IN ('confirmed', 'confirmado') THEN i.amount ELSE 0 END) as confirmed_amount,
      SUM(CASE WHEN i.status IN ('pending', 'pendiente') THEN i.amount ELSE 0 END) as pending_amount,
      MIN(i.received_date) as first_date,
      MAX(i.received_date) as last_date
    FROM public.incomes i
    WHERE i.project_id = p_project_id
    GROUP BY i.project_id
  ) income_summary ON p.id = income_summary.project_id
  LEFT JOIN (
    SELECT 
      e.project_id,
      COUNT(*)::INTEGER as total_expenses,
      SUM(e.amount) as total_amount,
      SUM(CASE WHEN e.currency = 'USD' THEN e.amount ELSE e.amount / COALESCE(e.exchange_rate_usd, 600) END) as total_amount_usd,
      MIN(e.expense_date) as first_date,
      MAX(e.expense_date) as last_date
    FROM public.expenses e
    WHERE e.project_id = p_project_id
    GROUP BY e.project_id
  ) expense_summary ON p.id = expense_summary.project_id
  LEFT JOIN (
    SELECT 
      co.project_id,
      COUNT(*)::INTEGER as total_orders,
      SUM(co.amount) as total_amount
    FROM public.change_orders co
    WHERE co.project_id = p_project_id
    GROUP BY co.project_id
  ) change_order_summary ON p.id = change_order_summary.project_id
  WHERE p.id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_project_report_data IS 'Obtiene datos completos del reporte de proyecto en una sola consulta optimizada';