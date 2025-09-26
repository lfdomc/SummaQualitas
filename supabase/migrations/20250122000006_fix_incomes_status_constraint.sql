-- Migración para arreglar las restricciones de status en la tabla incomes
-- Fecha: 2025-01-22
-- Descripción: Actualiza las restricciones para permitir valores en español que usa el código TypeScript

-- Eliminar la restricción existente de status
ALTER TABLE public.incomes DROP CONSTRAINT IF EXISTS incomes_status_check;

-- Crear nueva restricción que permita valores en español
ALTER TABLE public.incomes ADD CONSTRAINT incomes_status_check 
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'pendiente', 'confirmado', 'cancelado'));

-- También actualizar la restricción de category para que sea consistente
ALTER TABLE public.incomes DROP CONSTRAINT IF EXISTS incomes_category_check;

-- Crear nueva restricción de category que permita valores en inglés y español
ALTER TABLE public.incomes ADD CONSTRAINT incomes_category_check 
  CHECK (category IN (
    'payment_received', 'advance_payment', 'final_payment', 'milestone_payment', 'other',
    'payment', 'advance', 'bonus', 'refund',
    'pago_proyecto', 'anticipo', 'pago_final', 'pago_parcial', 'otros'
  ));

-- Comentario sobre la migración
COMMENT ON TABLE public.incomes IS 'Tabla de ingresos con restricciones actualizadas para permitir valores en inglés y español';