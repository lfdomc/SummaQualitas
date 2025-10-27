-- Pin function search_path to improve security and consistency per Supabase Advisor
-- Date: 2025-10-27
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

BEGIN;

-- 1) Change Orders: generate_change_order_document_number (qualify table refs and pin search_path)
CREATE OR REPLACE FUNCTION public.generate_change_order_document_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    current_year TEXT;
    sequence_number INTEGER;
    document_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(co.document_number FROM 'OC-' || current_year || '-(\\d+)') AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM public.change_orders co
    WHERE co.document_number LIKE 'OC-' || current_year || '-%';

    document_number := 'OC-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');

    RETURN document_number;
END;
$$;

-- 2) Trigger to generate document number for change_orders
CREATE OR REPLACE FUNCTION public.trigger_generate_document_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
        NEW.document_number := public.generate_change_order_document_number();
    END IF;
    RETURN NEW;
END;
$$;

-- 3) Trigger helper: calculate_cost_impact_crc (no table refs, safe to pin)
CREATE OR REPLACE FUNCTION public.calculate_cost_impact_crc()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.currency = 'CRC' THEN
        NEW.cost_impact_crc = NEW.cost_impact;
    ELSE
        NEW.cost_impact_crc = NEW.cost_impact * COALESCE(NEW.exchange_rate, 520.0000);
    END IF;

    RETURN NEW;
END;
$$;

-- 4) Generic updated_at trigger helper
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 5) Reports: get_project_incomes_summary (already qualified; just pin search_path)
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- 6) Reports: get_project_report_data (already qualified; just pin search_path)
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- 7) For functions not defined in repo but flagged by Advisor, pin search_path to 'public' to avoid break.
--    Later we can migrate their bodies to fully-qualified names and set search_path=''.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_expenses_summary_by_category',
        'get_expenses_summary_by_project',
        'get_query_performance_stats',
        'update_updated_at_column',
        'trigger_generate_change_order_document_number'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public;', r.proname, r.args);
  END LOOP;
END $$;

COMMIT;