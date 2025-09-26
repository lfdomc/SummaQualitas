# Instrucciones para Agregar Columnas de Comprobante de Referencia

## Opción 1: Ejecutar SQL Directamente en Supabase Dashboard (RECOMENDADO)

### Pasos:
1. **Accede al Dashboard de Supabase**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Inicia sesión en tu cuenta
   - Selecciona tu proyecto

2. **Navega al SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New query" para crear una nueva consulta

3. **Ejecuta el Script SQL**
   - Copia todo el contenido del archivo `add-reference-attachment-columns.sql`
   - Pégalo en el editor SQL
   - Haz clic en "Run" para ejecutar el script

4. **Verificar Resultados**
   - El script mostrará las columnas agregadas al final
   - Deberías ver 4 nuevas columnas:
     - `reference_attachment_url` (TEXT)
     - `reference_attachment_name` (TEXT)
     - `reference_attachment_type` (TEXT)
     - `reference_attachment_size` (INTEGER)

---

## Opción 2: Ejecutar Script JavaScript desde Terminal

### Requisitos Previos:
- Tener Node.js instalado
- Tener configuradas las variables de entorno en `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
  SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
  ```

### Pasos:
1. **Abrir Terminal**
   - Navega al directorio del proyecto
   - Asegúrate de estar en la carpeta raíz

2. **Ejecutar el Script**
   ```bash
   node add-reference-columns-manual.js
   ```

3. **Verificar Resultados**
   - El script mostrará mensajes de éxito o error
   - Si hay errores, seguirá las instrucciones para usar la Opción 1

---

## Verificación Manual

Después de ejecutar cualquiera de las opciones, puedes verificar que las columnas se agregaron correctamente:

### En Supabase Dashboard:
1. Ve a "Table Editor"
2. Selecciona la tabla "expenses"
3. Verifica que aparezcan las nuevas columnas al final de la tabla

### Con SQL:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
  AND table_schema = 'public'
  AND column_name LIKE '%reference_attachment%'
ORDER BY column_name;
```

---

## Columnas Agregadas

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `reference_attachment_url` | TEXT | URL del archivo de comprobante de referencia |
| `reference_attachment_name` | TEXT | Nombre original del archivo |
| `reference_attachment_type` | TEXT | Tipo MIME del archivo (pdf, jpg, etc.) |
| `reference_attachment_size` | INTEGER | Tamaño del archivo en bytes |

---

## Después de Agregar las Columnas

Una vez que las columnas estén agregadas:

1. ✅ **La funcionalidad estará completamente operativa**
2. ✅ **Los usuarios podrán subir comprobantes de referencia**
3. ✅ **Los reportes PDF mostrarán ambos tipos de adjuntos**
4. ✅ **La tabla de gastos mostrará ambas columnas de archivos**

---

## Solución de Problemas

### Si el Script JavaScript Falla:
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de usar la clave de servicio (service role key), no la clave pública
- Usa la Opción 1 (SQL directo) como alternativa

### Si Aparecen Errores de Permisos:
- Verifica que tu usuario tenga permisos de administrador en el proyecto
- Asegúrate de estar usando la clave de servicio correcta

### Si las Columnas Ya Existen:
- El script usa `IF NOT EXISTS`, por lo que es seguro ejecutarlo múltiples veces
- No se duplicarán las columnas si ya existen