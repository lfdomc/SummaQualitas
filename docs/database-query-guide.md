# Guía de Consultas a la Base de Datos - Supabase

## 📋 Resumen del Problema y Solución

### Problema Identificado
- El `optimizedDatabaseService.ts` usaba el cliente **anónimo** de Supabase (`createClient()`)
- Este cliente tiene permisos limitados y no puede acceder a todas las funciones RPC
- Causaba errores de permisos al intentar obtener datos del dashboard

### Solución Implementada
- Crear **API routes** que usen el cliente **administrativo** (`createAdminClient()`)
- El frontend consume estas API routes en lugar de llamar directamente a Supabase
- Esto permite acceso completo a los datos con los permisos correctos

## 🔧 Estructura de Clientes Supabase

### 1. Cliente Anónimo (Frontend)
```typescript
// lib/supabase/client.ts
export const createClient = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```
- **Uso:** Operaciones del frontend (autenticación, consultas básicas)
- **Limitaciones:** Permisos restringidos por RLS (Row Level Security)

### 2. Cliente Administrativo (Backend)
```typescript
// lib/supabase/client.ts
export const createAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient should only be used on the server side')
  }
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```
- **Uso:** API routes del backend, operaciones administrativas
- **Ventajas:** Acceso completo a la base de datos, bypassa RLS

## 🛠️ Patrón Correcto para Consultas

### ❌ Incorrecto (Problema anterior)
```typescript
// optimizedDatabaseService.ts - ANTES
const supabase = createClient() // Cliente anónimo
const { data, error } = await supabase.rpc('get_dashboard_kpis')
```

### ✅ Correcto (Solución actual)

#### 1. Crear API Route con Cliente Administrativo
```typescript
// app/api/dashboard/kpis/route.ts
import { createAdminClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('get_dashboard_kpis')
    
    if (error) throw error
    
    return Response.json(data || {
      total_projects: 0,
      active_projects: 0,
      total_expenses: 0,
      total_incomes: 0
    })
  } catch (error) {
    return Response.json({ error: 'Error fetching dashboard KPIs' }, { status: 500 })
  }
}
```

#### 2. Consumir API Route desde el Frontend
```typescript
// lib/services/optimizedDatabaseService.ts
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  return cacheService.withCache('dashboard-kpis', async () => {
    try {
      const response = await fetch('/api/dashboard/kpis')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error)
      return {
        total_projects: 0,
        active_projects: 0,
        total_expenses: 0,
        total_incomes: 0
      }
    }
  }, 5 * 60 * 1000) // Cache por 5 minutos
}
```

## 📁 Archivos Implementados

### API Routes Creadas
1. **`app/api/dashboard/kpis/route.ts`** - KPIs del dashboard
2. **`app/api/projects/summary/route.ts`** - Resumen de proyectos

### Servicios Actualizados
1. **`lib/services/optimizedDatabaseService.ts`** - Usa API routes en lugar de RPC directo

## 🔍 Funciones RPC Verificadas

### get_dashboard_kpis()
- **Parámetros:** Ninguno
- **Retorna:** `{ total_projects, active_projects, total_expenses, total_incomes }`

### get_projects_with_summary(p_limit, p_offset, p_status)
- **Parámetros:** 
  - `p_limit: INTEGER DEFAULT 20`
  - `p_offset: INTEGER DEFAULT 0` 
  - `p_status: TEXT DEFAULT NULL`
- **Retorna:** Array de proyectos con resumen financiero

## 🎯 Reglas para Futuras Consultas

### 1. Para Operaciones del Frontend
- Usar `createClient()` (cliente anónimo)
- Solo para autenticación y consultas básicas permitidas por RLS

### 2. Para Operaciones Administrativas
- Crear API route con `createAdminClient()`
- Consumir la API route desde el frontend
- Manejar errores apropiadamente

### 3. Tipado TypeScript
- Definir interfaces para todas las respuestas
- Usar tipos estrictos en parámetros y retornos
- Manejar casos de error con tipos apropiados

## 📊 Datos Actuales Confirmados
- **1 proyecto:** "Senderos lote 3F" (en progreso)
- **11 gastos:** Total de $18,958,999.78
- **1 ingreso:** Total de $5,047,800.00

## 🚀 Comandos de Verificación
```bash
# Probar API routes
node test-api-routes.js

# Verificar servidor de desarrollo
npm run dev
```

---
**Nota:** Esta guía debe consultarse antes de implementar nuevas consultas a la base de datos para evitar problemas de permisos.