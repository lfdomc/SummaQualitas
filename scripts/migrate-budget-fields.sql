-- Script para migrar campos de presupuesto en proyectos existentes
-- Este script actualiza presupuesto_original y presupuesto_final para proyectos que no los tienen definidos

-- Actualizar presupuesto_original con el valor de presupuesto_inicial donde presupuesto_original es NULL
UPDATE projects 
SET presupuesto_original = COALESCE(presupuesto_inicial, budget, 0)
WHERE presupuesto_original IS NULL;

-- Actualizar presupuesto_final con el valor de presupuesto_inicial donde presupuesto_final es NULL
UPDATE projects 
SET presupuesto_final = COALESCE(presupuesto_inicial, presupuesto_original, budget, 0)
WHERE presupuesto_final IS NULL;

-- Verificar los resultados
SELECT 
    id,
    name,
    presupuesto_inicial,
    presupuesto_original,
    presupuesto_final,
    budget
FROM projects 
WHERE presupuesto_original IS NOT NULL OR presupuesto_final IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;