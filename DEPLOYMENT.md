# Guía de Despliegue en Vercel

## 📋 Requisitos Previos

- Cuenta en [Vercel](https://vercel.com)
- Proyecto de Supabase configurado
- Repositorio Git (GitHub, GitLab, o Bitbucket)

## 🚀 Pasos para el Despliegue

### 1. Preparar el Repositorio

1. Asegúrate de que todos los cambios estén commitados
2. Sube el código a tu repositorio Git
3. Verifica que el archivo `vercel.json` esté incluido

### 2. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, ve a tu proyecto > Settings > Environment Variables y agrega:

#### Variables Requeridas:
```
NEXT_PUBLIC_SUPABASE_URL=https://eavnuiwjtuzvkyghexfj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhdm51aXdqdHV6dmt5Z2hleGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzcxMzAsImV4cCI6MjA3MTMxMzEzMH0.R-vRms1HyN6qRWw-gSlmys071KoLwXvSe0t9rDpbrqo
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhdm51aXdqdHV6dmt5Z2hleGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzcxMzAsImV4cCI6MjA3MTMxMzEzMH0.R-vRms1HyN6qRWw-gSlmys071KoLwXvSe0t9rDpbrqo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhdm51aXdqdHV6dmt5Z2hleGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTczNzEzMCwiZXhwIjoyMDcxMzEzMTMwfQ.GI_1wtNDYkt9M0gf3hxv-XfrSlnzyyr4-oiJQL-F6d4
```

### 3. Configurar Supabase para Producción

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a Settings > API
3. Copia las URLs y keys de producción
4. Ve a Authentication > URL Configuration
5. Agrega tu dominio de Vercel a "Site URL" y "Redirect URLs":
   ```
   https://tu-proyecto.vercel.app
   https://tu-proyecto.vercel.app/auth/callback
   ```

### 4. Desplegar en Vercel

#### Opción A: Desde el Dashboard de Vercel
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en "New Project"
3. Importa tu repositorio
4. Vercel detectará automáticamente que es un proyecto Next.js
5. Click en "Deploy"

#### Opción B: Desde la CLI de Vercel
```bash
npm i -g vercel
vercel login
vercel --prod
```

## 🔧 Configuraciones Importantes

### Archivo vercel.json
El proyecto incluye un archivo `vercel.json` con:
- Configuración de headers de seguridad
- Configuración de CORS para APIs
- Timeout de 30 segundos para funciones
- Región optimizada (iad1)

### Middleware de Autenticación
- Configurado para manejar sesiones de Supabase
- Protege rutas según roles de usuario
- Maneja redirecciones automáticas

### Optimizaciones de Performance
- Imágenes optimizadas con Next.js Image
- Caching configurado en next.config.mjs
- Compresión habilitada

## 🔍 Verificación Post-Despliegue

1. **Funcionalidad de Autenticación**:
   - Registro de usuarios
   - Login/Logout
   - Recuperación de contraseña

2. **Conexión a Base de Datos**:
   - Carga de datos desde Supabase
   - Operaciones CRUD funcionando

3. **APIs**:
   - Endpoints respondiendo correctamente
   - Manejo de errores apropiado

4. **Rutas Protegidas**:
   - Redirección a login cuando no autenticado
   - Control de acceso por roles

## 🐛 Troubleshooting

### Error: "Invalid JWT"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de usar las keys de producción de Supabase

### Error: "CORS"
- Verifica la configuración de Site URL en Supabase
- Revisa los headers CORS en vercel.json

### Error: "Function Timeout"
- Aumenta el maxDuration en vercel.json si es necesario
- Optimiza las consultas a la base de datos

### Error de Redirección
- Verifica las Redirect URLs en Supabase Auth
- Asegúrate de incluir todas las rutas de callback

## 📊 Monitoreo

- Usa Vercel Analytics para monitorear performance
- Revisa los logs en Vercel Dashboard
- Configura alertas en Supabase para errores de DB

## 🔄 Actualizaciones

Para actualizar el proyecto:
1. Haz push de los cambios a tu repositorio
2. Vercel desplegará automáticamente
3. Verifica que todo funcione correctamente

---

**Nota**: Mantén las variables de entorno seguras y nunca las compartas públicamente.