# 🏗️ Summa Qualitas - Setup de Base de Datos Supabase

Este documento contiene las instrucciones completas para configurar la base de datos de Supabase para el proyecto Summa Qualitas Construction Management System.

## 📋 Requisitos Previos

- Cuenta de Supabase activa
- Proyecto de Supabase creado
- Acceso a las credenciales del proyecto (URL y API Key)
- Permisos de administrador en el proyecto de Supabase

## 🚀 Instrucciones de Instalación

### Paso 1: Preparar el Entorno

1. **Verificar las credenciales en `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
   ```

2. **Asegurarse de que el proyecto Next.js esté configurado correctamente**

### Paso 2: Ejecutar el Script de Base de Datos

1. **Abrir Supabase Dashboard:**
   - Ve a [supabase.com](https://supabase.com)
   - Inicia sesión y selecciona tu proyecto

2. **Acceder al Editor SQL:**
   - En el panel lateral, haz clic en "SQL Editor"
   - Selecciona "New query"

3. **Ejecutar el script principal:**
   - Abre el archivo `setup_database.sql`
   - Copia todo el contenido
   - Pégalo en el editor SQL de Supabase
   - Haz clic en "Run" para ejecutar

4. **Verificar la ejecución:**
   - Revisa que no haya errores en la consola
   - Verifica que aparezcan mensajes de éxito

### Paso 3: Verificar la Instalación

1. **Revisar las tablas creadas:**
   - Ve a "Table Editor" en Supabase
   - Deberías ver las siguientes tablas:
     - `users`
     - `clients`
     - `suppliers`
     - `projects`
     - `equipment`
     - `equipment_rentals`
     - `expenses`
     - `client_payments`
     - `supplier_payments`
     - `incomes`
     - `project_summaries`
     - `change_orders`

2. **Verificar las políticas RLS:**
   - Ve a "Authentication" > "Policies"
   - Confirma que existan políticas para cada tabla

3. **Probar la conexión desde Next.js:**
   ```bash
   npm run dev
   ```

## 🏗️ Estructura de la Base de Datos

### Tablas Principales

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| `users` | Usuarios del sistema | - |
| `clients` | Clientes de la constructora | → `projects` |
| `suppliers` | Proveedores | → `expenses`, `supplier_payments` |
| `projects` | Proyectos de construcción | ← `clients`, → `expenses`, `equipment_rentals` |
| `equipment` | Equipos de construcción | → `equipment_rentals` |
| `equipment_rentals` | Alquileres de equipos | ← `equipment`, `projects` |
| `expenses` | Gastos del proyecto | ← `projects`, `suppliers` |
| `client_payments` | Pagos de clientes | ← `projects`, `clients` |
| `supplier_payments` | Pagos a proveedores | ← `suppliers` |
| `incomes` | Ingresos | ← `projects`, `clients` |
| `project_summaries` | Resúmenes de proyectos | ← `projects` |
| `change_orders` | Órdenes de cambio | ← `projects` |

### Tipos Personalizados (ENUMS)

- `user_role`: 'gerencia', 'administrativo', 'operativo', 'cliente'
- `project_status`: 'planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado'
- `equipment_status`: 'disponible', 'en_uso', 'mantenimiento', 'fuera_de_servicio'
- `payment_status`: 'pendiente', 'pagado', 'vencido', 'cancelado'
- `supplier_type`: 'MATERIALES', 'SERVICIOS', 'EQUIPOS', 'SUBCONTRATISTA'
- `expense_category`: 'materiales', 'mano_obra', 'equipos', 'servicios', 'transporte', 'otros'

## 🔐 Seguridad y Permisos

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas específicas:

- **Gerencia**: Acceso completo a todos los datos
- **Administrativo**: Puede crear/editar la mayoría de registros
- **Operativo**: Acceso limitado, principalmente lectura y creación de gastos
- **Cliente**: Solo puede ver sus propios proyectos

### Funciones de Seguridad

- `get_user_role()`: Obtiene el rol del usuario autenticado
- `get_user_id()`: Obtiene el ID del usuario autenticado

## ⚡ Funcionalidades Automáticas

### Triggers Implementados

1. **Actualización automática de `updated_at`** en todas las tablas
2. **Cálculo automático de resúmenes de proyecto** cuando cambian gastos o pagos
3. **Validación de datos** en inserción y actualización

### Funciones de Negocio

- `calculate_project_summary()`: Calcula estadísticas del proyecto
- `update_updated_at_column()`: Actualiza timestamp automáticamente

## 🧪 Datos de Prueba (Opcional)

El script incluye datos de ejemplo comentados. Para habilitarlos:

1. Descomenta la sección "STEP 10" en `setup_database.sql`
2. Ejecuta el script nuevamente

Los datos de prueba incluyen:
- 3 usuarios con diferentes roles
- 1 cliente de ejemplo
- 1 proveedor de ejemplo
- 1 proyecto de ejemplo

## 🔧 Mantenimiento

### Respaldos Recomendados

1. **Respaldo automático de Supabase** (configurar en Dashboard)
2. **Exportación periódica** de datos críticos
3. **Versionado de esquema** para cambios futuros

### Monitoreo

- Revisar logs de Supabase regularmente
- Monitorear el uso de la base de datos
- Verificar el rendimiento de las consultas

## 🐛 Solución de Problemas

### Errores Comunes

1. **Error de permisos:**
   - Verificar que el usuario tenga permisos de administrador
   - Revisar las políticas RLS

2. **Error de conexión:**
   - Verificar las credenciales en `.env.local`
   - Confirmar que la URL y API Key sean correctas

3. **Tablas no aparecen:**
   - Verificar que el script se ejecutó completamente
   - Revisar los logs de error en Supabase

### Comandos Útiles

```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Verificar triggers
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';
```

## 📞 Soporte

Si encuentras problemas durante la instalación:

1. Revisa los logs de error en Supabase Dashboard
2. Verifica que todas las dependencias estén instaladas
3. Consulta la documentación oficial de Supabase
4. Revisa que el proyecto Next.js esté configurado correctamente

## 🔄 Actualizaciones Futuras

Para futuras actualizaciones del esquema:

1. Crear nuevos archivos de migración numerados secuencialmente
2. Probar en entorno de desarrollo primero
3. Hacer respaldo antes de aplicar en producción
4. Documentar todos los cambios

---

**¡La base de datos está lista para usar con tu aplicación Next.js + TypeScript!** 🎉