-- =====================================================
-- SOLUCIÓN PARA ERROR PGRST116 EN ADJUNTOS DE GASTOS
-- =====================================================
-- Este script agrega las columnas de adjuntos faltantes en la tabla expenses
-- para solucionar el error: "Cannot coerce the result to a single JSON object"
-- 
-- INSTRUCCIONES:
-- 1. Ve a https://app.supabase.com/
-- 2. Selecciona tu proyecto
-- 3. Ve a "SQL Editor" 
-- 4. Copia y pega este script completo
-- 5. Haz clic en "Run" para ejecutar
-- =====================================================

-- Paso 1: Verificar estructura actual de la tabla expenses
SELECT 'VERIFICANDO ESTRUCTURA ACTUAL DE LA TABLA EXPENSES' AS paso;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Paso 2: Agregar las columnas de adjuntos faltantes
SELECT 'AGREGANDO COLUMNAS DE ADJUNTOS A LA TABLA EXPENSES' AS paso;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Paso 3: Agregar comentarios para documentar las columnas
COMMENT ON COLUMN expenses.attachment_url IS 'URL del archivo adjunto almacenado en Supabase Storage';
COMMENT ON COLUMN expenses.attachment_name IS 'Nombre original del archivo adjunto subido por el usuario';
COMMENT ON COLUMN expenses.attachment_type IS 'Tipo MIME del archivo adjunto (application/pdf, image/jpeg, etc.)';
COMMENT ON COLUMN expenses.attachment_size IS 'Tamaño del archivo adjunto en bytes';

-- Paso 4: Verificar que las columnas se agregaron correctamente
SELECT 'VERIFICANDO QUE LAS COLUMNAS SE AGREGARON CORRECTAMENTE' AS paso;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
AND column_name LIKE 'attachment%'
ORDER BY column_name;

-- Paso 5: Verificar la estructura completa actualizada
SELECT 'ESTRUCTURA COMPLETA ACTUALIZADA DE LA TABLA EXPENSES' AS paso;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Paso 6: Mensaje de confirmación
SELECT 
  '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE' AS resultado,
  'Las columnas de adjuntos han sido agregadas a la tabla expenses' AS detalle,
  'El error PGRST116 debería estar solucionado' AS estado;