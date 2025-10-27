-- Optimize RLS policies to avoid per-row re-evaluation of auth.* functions
-- Date: 2025-10-27
-- Context: Supabase performance alert recommends wrapping auth.<function>() calls in
--          subselects: (select auth.<function>()) so they are evaluated once per statement.
--          This migration updates policies on public.incomes and public.expenses accordingly.

BEGIN;

-- INCOMES: replace direct auth.uid() references with (select auth.uid())
DROP POLICY IF EXISTS "Authenticated users can view incomes" ON public.incomes;
CREATE POLICY "Authenticated users can view incomes" ON public.incomes
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert incomes" ON public.incomes;
CREATE POLICY "Authenticated users can insert incomes" ON public.incomes
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update incomes" ON public.incomes;
CREATE POLICY "Authenticated users can update incomes" ON public.incomes
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete incomes" ON public.incomes;
CREATE POLICY "Authenticated users can delete incomes" ON public.incomes
  FOR DELETE USING ((select auth.uid()) IS NOT NULL);

-- EXPENSES: replace direct auth.role() references with (select auth.role())
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "read_expenses_authenticated" ON public.expenses;
CREATE POLICY "Authenticated users can view expenses" ON public.expenses
    FOR SELECT USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
CREATE POLICY "Authenticated users can insert expenses" ON public.expenses
    FOR INSERT WITH CHECK (((select auth.role()) = 'authenticated'));

DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
CREATE POLICY "Authenticated users can update expenses" ON public.expenses
    FOR UPDATE USING (((select auth.role()) = 'authenticated'));

DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;
CREATE POLICY "Authenticated users can delete expenses" ON public.expenses
    FOR DELETE USING (((select auth.role()) = 'authenticated'));

COMMIT;