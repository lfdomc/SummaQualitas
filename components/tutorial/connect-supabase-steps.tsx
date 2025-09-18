import { TutorialStep } from "./tutorial-step";

export function ConnectSupabaseSteps() {
  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="Crear proyecto de Supabase">
        <p>
          Ve a{" "}
          <a
            href="https://app.supabase.com/project/_/settings/api"
            target="_blank"
            className="font-bold hover:underline text-foreground/80"
            rel="noreferrer"
          >
            database.new
          </a>{" "}
          y crea un nuevo proyecto de Supabase.
        </p>
      </TutorialStep>

      <TutorialStep title="Declarar variables de entorno">
        <p>
          Renombra el archivo{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            .env.example
          </span>{" "}
          en tu aplicación Next.js a{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            .env.local
          </span>{" "}
          y complétalo con valores de{" "}
          <a
            href="https://app.supabase.com/project/_/settings/api"
            target="_blank"
            className="font-bold hover:underline text-foreground/80"
            rel="noreferrer"
          >
            la configuración de API de tu proyecto Supabase
          </a>
          .
        </p>
      </TutorialStep>

      <TutorialStep title="Reiniciar tu servidor de desarrollo Next.js">
        <p>
          Es posible que necesites cerrar tu servidor de desarrollo Next.js y ejecutar{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            npm run dev
          </span>{" "}
          nuevamente para cargar las nuevas variables de entorno.
        </p>
      </TutorialStep>

      <TutorialStep title="Refresh the page">
        <p>
          You may need to refresh the page for Next.js to load the new
          environment variables.
        </p>
      </TutorialStep>
    </ol>
  );
}
