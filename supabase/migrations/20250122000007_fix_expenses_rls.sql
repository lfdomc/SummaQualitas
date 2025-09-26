-- Fix RLS policies for expenses table
-- This migration removes restrictive RLS policies and adds permissive ones

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Gerencia and administrativo can delete expenses" ON expenses;

-- Create permissive policies that allow authenticated users to perform CRUD operations
CREATE POLICY "Authenticated users can insert expenses" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update expenses" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete expenses" ON expenses
    FOR DELETE USING (auth.role() = 'authenticated');