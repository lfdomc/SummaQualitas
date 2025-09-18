<div align="center">
  <h1>🏗️ Summa Qualitas - Sistema de Gestión de Construcción</h1>
  <p><strong>Plataforma integral para la gestión de proyectos de construcción</strong></p>
  <p>Desarrollado con Next.js 15, TypeScript, Supabase y Tailwind CSS</p>
</div>

<p align="center">
  <a href="#características"><strong>Características</strong></a> ·
  <a href="#tecnologías"><strong>Tecnologías</strong></a> ·
  <a href="#instalación"><strong>Instalación</strong></a> ·
  <a href="#estructura"><strong>Estructura</strong></a> ·
  <a href="#funcionalidades"><strong>Funcionalidades</strong></a> ·
  <a href="#configuración"><strong>Configuración</strong></a>
</p>
<br/>

## 🚀 Características

### 🏢 Gestión Empresarial
- **Dashboard Ejecutivo**: Métricas clave, KPIs y análisis financiero en tiempo real
- **Gestión de Proyectos**: Control completo del ciclo de vida de proyectos de construcción
- **Sistema de Roles**: Permisos diferenciados (Gerencia, Administrativo, Cliente)
- **Autenticación Segura**: Sistema completo de login/registro con Supabase Auth

### 📊 Módulos Principales
- **Proyectos**: Creación, edición, seguimiento y análisis de proyectos
- **Facturas**: Gestión de facturas de proveedores y control de gastos
- **Equipos**: Inventario y control de equipos de construcción
- **Reportes**: Generador de reportes personalizados y análisis
- **Alertas**: Centro de notificaciones y alertas del sistema
- **Analytics**: KPIs, métricas de rendimiento y análisis de tendencias

### 🛠️ Tecnologías Modernas
- **Next.js 15**: App Router, Server Components, Middleware
- **TypeScript**: Tipado estático para mayor seguridad
- **Supabase**: Base de datos PostgreSQL, autenticación y APIs
- **Tailwind CSS**: Diseño responsive y moderno
- **shadcn/ui**: Componentes UI de alta calidad
- **React Hook Form**: Formularios optimizados con validación
- **Recharts**: Gráficos y visualizaciones interactivas

## 💻 Tecnologías

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|----------|
| **Frontend** | Next.js | 15.2.4 | Framework React con SSR/SSG |
| | React | 18+ | Biblioteca de UI |
| | TypeScript | 5+ | Tipado estático |
| | Tailwind CSS | 3.4+ | Framework CSS utility-first |
| **Backend** | Supabase | 2.55+ | Base de datos y autenticación |
| | PostgreSQL | - | Base de datos relacional |
| **UI/UX** | shadcn/ui | - | Componentes UI modernos |
| | Radix UI | - | Primitivos UI accesibles |
| | Lucide React | - | Iconografía |
| **Formularios** | React Hook Form | 7.54+ | Gestión de formularios |
| | Zod | 3.24+ | Validación de esquemas |
| **Gráficos** | Recharts | 2.15+ | Visualización de datos |
| **Desarrollo** | ESLint | - | Linting de código |
| | PostCSS | - | Procesamiento CSS |

## 🏗️ Estructura del Proyecto

```
📁 Summa Qualitas/
├── 📁 app/                    # App Router de Next.js
│   ├── 📁 dashboard/          # Panel principal
│   ├── 📁 projects/           # Gestión de proyectos
│   ├── 📁 equipment/          # Inventario de equipos
│   ├── 📁 invoices/           # Facturas de proveedores
│   ├── 📁 reports/            # Generador de reportes
│   ├── 📁 analytics/          # KPIs y análisis
│   ├── 📁 alerts/             # Centro de alertas
│   ├── 📁 auth/               # Autenticación
│   └── 📁 profile/            # Perfil de usuario
├── 📁 components/             # Componentes reutilizables
│   ├── 📁 ui/                 # Componentes base (shadcn/ui)
│   ├── 📁 dashboard/          # Componentes del dashboard
│   ├── 📁 projects/           # Componentes de proyectos
│   └── 📁 auth/               # Componentes de autenticación
├── 📁 lib/                    # Utilidades y configuración
│   ├── 📁 supabase/           # Cliente y servicios de Supabase
│   ├── 📁 auth/               # Middleware de autenticación
│   └── 📁 hooks/              # Custom hooks
├── 📁 database/               # Esquemas y scripts SQL
└── 📁 scripts/                # Scripts de configuración
```

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

### 1. Configuración de Supabase

1. Crea un nuevo proyecto en [Supabase Dashboard](https://database.new)
2. Ve a **Settings > API** y copia:
   - Project URL
   - Project API Key (anon, public)

### 2. Instalación Local

```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd summa-qualitas

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
```

### 3. Configuración de Variables de Entorno

Edita el archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Configuración de Base de Datos

```bash
# Ejecutar script de configuración
npm run setup-db
```

**Importante**: Si encuentras errores de base de datos, ejecuta manualmente el archivo `database/basic-tables.sql` en el SQL Editor de Supabase.

### 5. Ejecutar el Proyecto

```bash
# Modo desarrollo
npm run dev

# El proyecto estará disponible en http://localhost:3000
```

### 6. Configuración Adicional (Opcional)

```bash
# Re-instalar shadcn/ui si es necesario
npx shadcn@latest init

# Ejecutar linting
npm run lint

# Build para producción
npm run build
```

## 📋 Funcionalidades

### 🏠 Dashboard Ejecutivo
- **Métricas en Tiempo Real**: KPIs financieros, progreso de proyectos, alertas
- **Gráficos Interactivos**: Análisis de tendencias con Recharts
- **Resumen Ejecutivo**: Vista consolidada de toda la operación

### 🏗️ Gestión de Proyectos
- **CRUD Completo**: Crear, leer, actualizar y eliminar proyectos
- **Estados de Proyecto**: Seguimiento del ciclo de vida (Planificación → Ejecución → Finalizado)
- **Asignación de Recursos**: Control de equipos y personal
- **Cronogramas**: Planificación temporal de actividades

### 💰 Control Financiero
- **Facturas de Proveedores**: Registro y seguimiento de gastos
- **Presupuestos**: Control de costos por proyecto
- **Reportes Financieros**: Análisis de rentabilidad

### 🔧 Inventario de Equipos
- **Catálogo de Equipos**: Registro completo de maquinaria
- **Estado y Mantenimiento**: Control de disponibilidad
- **Asignación a Proyectos**: Tracking de uso

### 📊 Sistema de Reportes
- **Reportes Personalizados**: Generador flexible de informes
- **Exportación**: PDF, Excel, CSV
- **Programación**: Reportes automáticos

### 🔐 Seguridad y Roles
- **Autenticación Supabase**: Login seguro con email/password
- **Roles de Usuario**: 
  - **Gerencia**: Acceso completo
  - **Administrativo**: Gestión operativa
  - **Cliente**: Vista limitada de proyectos
- **RLS (Row Level Security)**: Seguridad a nivel de base de datos

## ⚙️ Configuración

### Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima

# Opcional: Para desarrollo local
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Estructura de Base de Datos

```sql
-- Tablas principales
user_profiles     # Perfiles de usuario
clients          # Clientes
projects         # Proyectos
equipment        # Equipos
invoices         # Facturas
reports          # Reportes
```

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting de código
npm run setup-db     # Configuración de base de datos
```

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: soporte@summaqualitas.com
- **Documentación**: [Wiki del Proyecto]
- **Issues**: [GitHub Issues]

---

**Desarrollado con ❤️ para la industria de la construcción**
