-- Migración para arreglar las políticas RLS de la tabla incomes
-- Fecha: 2025-01-22
-- Descripción: Simplifica las políticas RLS para permitir operaciones básicas a usuarios autenticados

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view incomes for their projects" ON public.incomes;
DROP POLICY IF EXISTS "Users can insert incomes for their projects" ON public.incomes;
DROP POLICY IF EXISTS "Users can update incomes for their projects" ON public.incomes;
DROP POLICY IF EXISTS "Users can delete incomes for their projects" ON public.incomes;

-- Crear políticas más permisivas temporalmente
-- Política para SELECT: usuarios autenticados pueden ver todos los ingresos
CREATE POLICY "Authenticated users can view incomes" ON public.incomes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política para INSERT: usuarios autenticados pueden insertar ingresos
CREATE POLICY "Authenticated users can insert incomes" ON public.incomes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE: usuarios autenticados pueden actualizar ingresos
CREATE POLICY "Authenticated users can update incomes" ON public.incomes
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Política para DELETE: usuarios autenticados pueden eliminar ingresos
CREATE POLICY "Authenticated users can delete incomes" ON public.incomes
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Comentario sobre la migración
COMMENT ON TABLE public.incomes IS 'Tabla de ingresos con políticas RLS simplificadas para permitir operaciones básicas a usuarios autenticados';