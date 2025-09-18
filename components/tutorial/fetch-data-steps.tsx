import { TutorialStep } from "./tutorial-step";
import { CodeBlock } from "./code-block";

const create = `create table notes (
  id bigserial primary key,
  title text
);

insert into notes(title)
values
  ('Hoy creé un proyecto de Supabase.'),
  ('Agregué algunos datos y los consulté desde Next.js.'),
  ('¡Fue increíble!');
`.trim();

const server = `import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from('notes').select()

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
`.trim();

const client = `'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [notes, setNotes] = useState<any[] | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('notes').select()
      setNotes(data)
    }
    getData()
  }, [])

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
`.trim();

export function FetchDataSteps() {
  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="Crear algunas tablas e insertar datos">
        <p>
          Ve al{" "}
          <a
            href="https://supabase.com/dashboard/project/_/editor"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Editor de Tablas
          </a>{" "}
          de tu proyecto Supabase para crear una tabla e insertar algunos datos
          de ejemplo. Si te falta creatividad, puedes copiar y pegar lo
          siguiente en el{" "}
          <a
            href="https://supabase.com/dashboard/project/_/sql/new"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Editor SQL
          </a>{" "}
          y hacer clic en ¡EJECUTAR!
        </p>
        <CodeBlock code={create} />
      </TutorialStep>

      <TutorialStep title="Consultar datos de Supabase desde Next.js">
        <p>
          Para crear un cliente de Supabase y consultar datos desde un
          Componente de Servidor Asíncrono, crea un nuevo archivo page.tsx en{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            /app/notes/page.tsx
          </span>{" "}
          y agrega lo siguiente.
        </p>
        <CodeBlock code={server} />
        <p>Alternativamente, puedes usar un Componente de Cliente.</p>
        <CodeBlock code={client} />
      </TutorialStep>

      <TutorialStep title="Explorar la Biblioteca de UI de Supabase">
        <p>
          Ve a la{" "}
          <a
            href="https://supabase.com/ui"
            className="font-bold hover:underline text-foreground/80"
          >
            biblioteca de UI de Supabase
          </a>{" "}
          y prueba instalar algunos bloques. Por ejemplo, puedes instalar un
          bloque de Chat en Tiempo Real ejecutando:
        </p>
        <CodeBlock
          code={
            "npx shadcn@latest add https://supabase.com/ui/r/realtime-chat-nextjs.json"
          }
        />
      </TutorialStep>

      <TutorialStep title="¡Construye en un fin de semana y escala a millones!">
        <p>¡Estás listo para lanzar tu producto al mundo! 🚀</p>
      </TutorialStep>
    </ol>
  );
}
