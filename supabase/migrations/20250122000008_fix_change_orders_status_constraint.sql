-- =====================================================
-- MIGRACIÓN: CORREGIR CONSTRAINT DE STATUS EN CHANGE_ORDERS
-- =====================================================
-- Esta migración corrige el constraint de status para usar los valores correctos
-- =====================================================

-- Eliminar el constraint existente si existe
ALTER TABLE change_orders DROP CONSTRAINT IF EXISTS change_orders_status_check;

-- Agregar el constraint correcto
ALTER TABLE change_orders ADD CONSTRAINT change_orders_status_check 
CHECK (status IN ('pendiente', 'aprobado', 'rechazado', 'implementado'));

-- Actualizar cualquier valor incorrecto que pueda existir
UPDATE change_orders 
SET status = CASE 
    WHEN status = 'draft' THEN 'pendiente'
    WHEN status = 'pending_approval' THEN 'pendiente'
    WHEN status = 'approved' THEN 'aprobado'
    WHEN status = 'rejected' THEN 'rechazado'
    WHEN status = 'implemented' THEN 'implementado'
    ELSE 'pendiente'
END
WHERE status NOT IN ('pendiente', 'aprobado', 'rechazado', 'implementado');