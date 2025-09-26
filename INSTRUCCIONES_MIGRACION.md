# Instrucciones para Agregar Campos de Impacto

## Problema Identificado
Los campos de impacto financiero y cronograma (`cost_impact_crc`, `schedule_impact_days`, etc.) no existen en la tabla `change_orders`, por lo que aparecen en cero en la interfaz.

## Solución

### Paso 1: Ejecutar la Migración SQL
1. Ve al dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a la sección "SQL Editor" en el menú lateral
4. Crea una nueva consulta
5. Copia y pega el contenido completo del archivo `add-impact-fields.sql`
6. Ejecuta la consulta haciendo clic en "Run"

### Paso 2: Verificar la Migración
Después de ejecutar el SQL, verifica que funcionó ejecutando esta consulta:

```sql
SELECT 
    id,
    title,
    amount,
    currency,
    cost_impact,
    cost_impact_crc,
    schedule_impact_days,
    cost_impact_level,
    schedule_impact_level
FROM public.change_orders 
WHERE id = '550e8400-e29b-41d4-a716-446655441002';
```

### Paso 3: Reiniciar el Servidor de Desarrollo
Una vez ejecutada la migración:
1. Detén el servidor de desarrollo (Ctrl+C en la terminal)
2. Reinicia con `npm run dev`
3. Ve a la página de la orden de cambio: http://localhost:3000/change-orders/550e8400-e29b-41d4-a716-446655441002

## Qué Hace la Migración

### Campos Agregados:
- `cost_impact`: Impacto financiero en moneda original
- `cost_impact_crc`: Impacto financiero en colones
- `schedule_impact_days`: Impacto en cronograma (días)
- `cost_impact_level`: Nivel de impacto en costos (bajo/medio/alto)
- `schedule_impact_level`: Nivel de impacto en cronograma (bajo/medio/alto)
- `exchange_rate`: Tipo de cambio para conversión
- `designer`: Diseñador responsable
- `cost_comments`: Comentarios sobre impacto en costos
- `schedule_comments`: Comentarios sobre impacto en cronograma

### Valores Calculados:
- Para órdenes existentes, se calculan valores basados en el campo `amount`
- Se crea un trigger automático para calcular `cost_impact_crc` basado en la moneda
- Se establecen niveles de impacto según el monto:
  - > $50,000: Alto impacto (30 días)
  - > $20,000: Medio impacto (15 días)
  - ≤ $20,000: Bajo impacto (7 días)

## Archivos Modificados
- ✅ `app/api/change-orders/[id]/route.ts` - API actualizada para manejar campos de impacto
- ✅ `add-impact-fields.sql` - Script de migración creado
- ✅ La página de visualización ya está preparada para mostrar estos campos

## Resultado Esperado
Después de la migración, la orden de cambio `550e8400-e29b-41d4-a716-446655441002` debería mostrar:
- **Impacto Financiero**: +₡14,560,000 (basado en $28,000 USD)
- **Impacto en Cronograma**: +15 días
- Niveles de impacto apropiados según el monto