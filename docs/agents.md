# Agents / Agentes de Trabajo

Este documento define los agentes y rutinas que aplicaremos de forma consistente en el proyecto. Se irá ampliando y será la referencia que usaremos en cada nueva acción.

## Agente: Verificación de Tipado TypeScript

- Objetivo: Garantizar que el tipado de TypeScript compile en toda la base de código antes y después de cualquier cambio.
- Comando oficial:
  - `npm run type-check`
  - (internamente ejecuta `tsc --noEmit`)
- Cuándo ejecutarlo:
  - Siempre antes de empezar una nueva tarea.
  - Siempre después de aplicar cambios y antes de hacer commit/push.
  - Antes de iniciar el servidor de desarrollo si hubo cambios profundos en tipos.
- Cómo ejecutarlo:
  - En la raíz del proyecto:
    ```bash
    npm run type-check
    ```
- Resultado esperado:
  - Sin errores de tipo. Si aparecen errores, no continuar con la siguiente acción hasta corregirlos.
- Notas:
  - Este proyecto ya define el script `type-check` en `package.json`.
  - Si la salida es extensa, puedes filtrar por archivos relevantes o abrir el IDE en las ubicaciones de error.

## Próximas ampliaciones (pendiente)

- Linting: `npm run lint`.
- Pruebas unitarias: `npm run test`.
- Comprobación de build: `npm run build`.
- Posible hook pre-commit para ejecutar `type-check` automáticamente.

---

A partir de ahora, este agente se usará como checklist base en cada acción técnica: primero verificación de tipado, luego implementación, y al final verificación de tipado nuevamente.

## Agente: Conexión y Respaldo de Supabase (sin exponer secretos)

- Objetivo: Documentar cómo obtener la cadena de conexión y claves de Supabase, dónde guardarlas de forma segura, y cómo ejecutar un respaldo/restore sin comprometer datos.

### Cómo obtener los valores en Supabase
- URL y claves (frontend/backend):
  - En Supabase Studio: Settings → API
  - Copiar:
    - NEXT_PUBLIC_SUPABASE_URL
    - NEXT_PUBLIC_SUPABASE_ANON_KEY
    - SUPABASE_SERVICE_ROLE_KEY (uso solo en servidor)
- Cadena de conexión Postgres (para pg_dump/pg_restore):
  - Supabase Studio: Settings → Database → Connection info
  - Usar host, puerto, base, usuario y contraseña. Para backups suele usarse:
    - Host: db.<tu-proyecto>.supabase.co
    - Puerto: 5432
    - Base: postgres
    - Usuario: postgres
    - Contraseña: (la que ves en Connection info)

### Dónde guardarlos (seguro, no versionado)
- Crear `.env.local` en la raíz (ya ignorado por `.gitignore`). Ejemplo:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=<<copiar de Settings/API>>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<<copiar de Settings/API>>
  SUPABASE_SERVICE_ROLE_KEY=<<copiar de Settings/API>>
  PGHOST=<<copiar de Settings/Database>>
  PGPORT=5432
  PGDATABASE=postgres
  PGUSER=postgres
  PGPASSWORD=<<copiar de Settings/Database>>
  ```
- No guardar secretos en `agents.md` ni en archivos versionados.

### Respaldo seguro (Windows PowerShell)
- Crear carpeta `backup/` local.
- Comando (requiere `pg_dump` en PATH):
  ```powershell
  $ts = (Get-Date).ToString('yyyyMMdd_HHmm')
  $out = "./backup/summa_$ts.dump"
  pg_dump -Fc -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $env:PGDATABASE -f $out
  ```
- Si `pg_dump` pide contraseña, usa `$env:PGPASSWORD` o `PGPASSWORD=<...> pg_dump ...`.

### Restore (si es necesario)
```powershell
pg_restore -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $env:PGDATABASE -c ./backup/summa_YYYYMMDD_HHMM.dump
```

### Notas
- El frontend usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Operaciones administrativas (migraciones, tareas de servidor) usan `SUPABASE_SERVICE_ROLE_KEY`.
- Para minimizar impacto, primero realizar respaldo; luego aplicar migraciones de seguridad (ver archivo `supabase/migrations/20251026_minimal_security_fixes.sql`).