# Esquema de Base de Datos - Supabase

## Tabla: projects

### Columnas Confirmadas (Verificado: 2024)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID único del proyecto |
| `nombre` | VARCHAR | Nombre del proyecto |
| `descripcion` | TEXT | Descripción del proyecto |
| `cliente` | VARCHAR | Cliente del proyecto |
| `ubicacion` | VARCHAR | Ubicación del proyecto |
| `fecha_inicio` | DATE | Fecha de inicio |
| `fecha_fin` | DATE | Fecha de finalización |
| `estado` | VARCHAR | Estado del proyecto |
| `presupuesto_inicial` | DECIMAL(15,2) | Presupuesto inicial |
| `presupuesto_final` | DECIMAL(15,2) | Presupuesto final |

### Campos de Desglose Presupuestario

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `costos_directos` | DECIMAL(15,2) | Costos directos del proyecto |
| `costos_indirectos` | DECIMAL(15,2) | Costos indirectos |
| `administracion` | DECIMAL(15,2) | Gastos de administración |
| `mano_obra` | DECIMAL(15,2) | Costos de mano de obra |
| `imprevistos` | DECIMAL(15,2) | Imprevistos |
| `utilidad` | DECIMAL(15,2) | Utilidad del proyecto |

### Campos de Porcentajes

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `costos_directos_porcentaje` | DECIMAL(5,2) | Porcentaje de costos directos |
| `costos_indirectos_porcentaje` | DECIMAL(5,2) | Porcentaje de costos indirectos |
| `administracion_porcentaje` | DECIMAL(5,2) | Porcentaje de administración |
| `mano_obra_porcentaje` | DECIMAL(5,2) | Porcentaje de mano de obra |
| `imprevistos_porcentaje` | DECIMAL(5,2) | Porcentaje de imprevistos |
| `utilidad_porcentaje` | DECIMAL(5,2) | Porcentaje de utilidad |

## ⚠️ NOMBRES INCORRECTOS A EVITAR

Estos nombres de columnas **NO EXISTEN** en la base de datos:

- ❌ `costos_directos_materiales` → ✅ `costos_directos`
- ❌ `costos_directos_equipos` → No existe
- ❌ `gastos_administrativos` → ✅ `administracion`
- ❌ `mano_obra_quincenal` → ✅ `mano_obra`
- ❌ `utilidad_esperada` → ✅ `utilidad`

## Mapeo para Formularios TypeScript

```typescript
// ✅ CORRECTO - Usar estos nombres
interface ProjectFormData {
  costos_directos: number;
  costos_indirectos: number;
  administracion: number;
  mano_obra: number;
  imprevistos: number;
  utilidad: number;
  
  // Porcentajes
  costos_directos_porcentaje: number;
  costos_indirectos_porcentaje: number;
  administracion_porcentaje: number;
  mano_obra_porcentaje: number;
  imprevistos_porcentaje: number;
  utilidad_porcentaje: number;
}
```

## Notas Importantes

1. **Siempre usar los nombres de columnas reales** listados arriba
2. **No crear verificaciones de esquema** en tiempo de ejecución
3. **Referirse a este documento** antes de hacer cambios en formularios
4. **Actualizar este documento** si se agregan nuevas columnas

---
*Última actualización: Enero 2024*
*Verificado contra: Supabase Production Database*