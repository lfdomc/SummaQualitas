-- Script para corregir las referencias de foreign key en la tabla sumitals

-- Eliminar las constraints existentes si existen
ALTER TABLE public.sumitals DROP CONSTRAINT IF EXISTS sumitals_created_by_fkey;
ALTER TABLE public.sumitals DROP CONSTRAINT IF EXISTS sumitals_updated_by_fkey;

-- Agregar las nuevas constraints con las referencias correctas
ALTER TABLE public.sumitals 
ADD CONSTRAINT sumitals_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.sumitals 
ADD CONSTRAINT sumitals_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES public.users(id);

-- Verificar que las constraints se crearon correctamente
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='sumitals'
    AND tc.table_schema='public';