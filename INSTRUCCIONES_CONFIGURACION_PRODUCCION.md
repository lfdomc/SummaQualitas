# 🔧 Instrucciones para Configurar Producción

## Problema Identificado
El JWT expira en solo 1 hora, causando que los usuarios pierdan la sesión frecuentemente en producción.

## Soluciones Requeridas

### 1. Configuración en Supabase Dashboard

#### A. Configuración de Authentication
1. Ve a tu **Supabase Dashboard** → **Authentication** → **Settings**
2. En la sección **JWT Settings**:
   - Cambia **JWT expiry** de `3600` a `86400` (24 horas)
   - Asegúrate de que **Enable refresh token rotation** esté **habilitado**

#### B. Configuración de Site URL y Redirect URLs
1. En **Authentication** → **URL Configuration**:
   - **Site URL**: `https://summa-qualitas.vercel.app`
   - **Redirect URLs** (agregar todas estas):
     - `https://summa-qualitas.vercel.app/auth/callback`
     - `https://summa-qualitas.vercel.app/login`
     - `https://summa-qualitas.vercel.app/`
     - `https://summa-qualitas.vercel.app/**`

### 2. Configuración en Vercel

#### Variables de Entorno Requeridas
Asegúrate de que estas variables estén configuradas en Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (para middleware)

### 3. Configuración Local (Ya aplicada)

✅ **JWT expiry actualizado a 24 horas**
✅ **Refresh token rotation habilitado**
✅ **Middleware configurado correctamente**
✅ **Persistencia de sesión habilitada**

## Pasos para Aplicar los Cambios

### Paso 1: Configurar Supabase Dashboard
1. Accede a tu Supabase Dashboard
2. Aplica los cambios mencionados arriba
3. Guarda la configuración

### Paso 2: Reiniciar Supabase Local (si usas local)
```bash
npx supabase stop
npx supabase start
```

### Paso 3: Redeploy en Vercel
```bash
git add .
git commit -m "fix: configuración de sesión para producción"
git push origin main
```

### Paso 4: Verificar en Producción
1. Ve a `https://summa-qualitas.vercel.app`
2. Inicia sesión
3. Espera más de 1 hora
4. Verifica que la sesión se mantenga activa

## Monitoreo

Para monitorear el problema:
1. Revisa los logs de Vercel
2. Verifica que no aparezcan errores de autenticación
3. Confirma que los usuarios no pierdan la sesión después de 1 hora

## Contacto
Si el problema persiste después de aplicar estos cambios, revisa:
1. Los logs de Vercel para errores específicos
2. La configuración de cookies en el navegador
3. Posibles problemas de CORS

---
**Fecha de creación**: 9/26/2025
**Estado**: Pendiente de aplicar en Supabase Dashboard
