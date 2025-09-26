-- ============================================
-- FIX DEFINITIVO PARA POLÍTICAS RLS INCOMES
-- ============================================
-- Ejecutar este SQL en el SQL Editor de Supabase

-- 1. DESHABILITAR RLS TEMPORALMENTE
ALTER TABLE incomes DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "income_select_policy" ON incomes;
DROP POLICY IF EXISTS "income_insert_policy" ON incomes;
DROP POLICY IF EXISTS "income_update_policy" ON incomes;
DROP POLICY IF EXISTS "income_delete_policy" ON incomes;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON incomes;
DROP POLICY IF EXISTS "allow_authenticated_select" ON incomes;
DROP POLICY IF EXISTS "allow_authenticated_update" ON incomes;
DROP POLICY IF EXISTS "allow_authenticated_delete" ON incomes;

-- 3. CREAR POLÍTICAS SIMPLES (SOLO REQUIERE AUTENTICACIÓN)

-- Política SELECT: Cualquier usuario autenticado puede ver
CREATE POLICY "simple_select_policy" ON incomes
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política INSERT: Cualquier usuario autenticado puede insertar
CREATE POLICY "simple_insert_policy" ON incomes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política UPDATE: Cualquier usuario autenticado puede actualizar
CREATE POLICY "simple_update_policy" ON incomes
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Política DELETE: Cualquier usuario autenticado puede eliminar
CREATE POLICY "simple_delete_policy" ON incomes
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. HABILITAR RLS NUEVAMENTE
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- 5. VERIFICAR POLÍTICAS CREADAS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'incomes'
ORDER BY policyname;

-- 6. VERIFICAR QUE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'incomes';

-- 7. VERIFICAR USUARIO GERENCIA
SELECT id, email, role, is_active 
FROM users 
WHERE email = 'lfdomc@gmail.com';