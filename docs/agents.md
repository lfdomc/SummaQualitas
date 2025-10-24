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