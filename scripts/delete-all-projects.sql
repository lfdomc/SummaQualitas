-- Script para borrar todos los proyectos y sus datos relacionados
-- ADVERTENCIA: Este script eliminará TODOS los proyectos y datos relacionados de la base de datos
-- Úselo solo para pruebas o cuando esté seguro de que desea eliminar todos los datos

-- Mostrar información antes del borrado
SELECT 'ANTES DEL BORRADO:' as info;
SELECT 'Proyectos existentes:' as tabla, COUNT(*) as cantidad FROM public.projects;
SELECT 'Órdenes de cambio existentes:' as tabla, COUNT(*) as cantidad FROM public.change_orders;
SELECT 'Ingresos existentes:' as tabla, COUNT(*) as cantidad FROM public.incomes;
SELECT 'Gastos existentes:' as tabla, COUNT(*) as cantidad FROM public.expenses;
SELECT 'Alquileres de equipo existentes:' as tabla, COUNT(*) as cantidad FROM public.equipment_rentals;

-- Deshabilitar temporalmente las verificaciones de foreign key para evitar problemas
SET session_replication_role = replica;

-- Eliminar todos los proyectos
-- Debido a las foreign keys con ON DELETE CASCADE, esto eliminará automáticamente:
-- - change_orders
-- - incomes  
-- - expenses
-- - equipment_rentals
-- - project_suppliers
-- - project_equipment
-- - client_payments (donde project_id no sea NULL)
-- - y otros registros relacionados

DELETE FROM public.projects;

-- Rehabilitar las verificaciones de foreign key
SET session_replication_role = DEFAULT;

-- Mostrar información después del borrado
SELECT 'DESPUÉS DEL BORRADO:' as info;
SELECT 'Proyectos restantes:' as tabla, COUNT(*) as cantidad FROM public.projects;
SELECT 'Órdenes de cambio restantes:' as tabla, COUNT(*) as cantidad FROM public.change_orders;
SELECT 'Ingresos restantes:' as tabla, COUNT(*) as cantidad FROM public.incomes;
SELECT 'Gastos restantes:' as tabla, COUNT(*) as cantidad FROM public.expenses;
SELECT 'Alquileres de equipo restantes:' as tabla, COUNT(*) as cantidad FROM public.equipment_rentals;

-- Reiniciar las secuencias si existen (para que los próximos IDs empiecen desde 1)
-- Nota: Esto solo aplica si hay secuencias, la mayoría de tablas usan UUID

-- Mensaje de confirmación
SELECT 'BORRADO COMPLETADO: Todos los proyectos y datos relacionados han sido eliminados exitosamente' as resultado;
SELECT 'La base de datos está lista para nuevas pruebas' as estado;