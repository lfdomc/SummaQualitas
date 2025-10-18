-- Configurar bucket de Storage para archivos de sumitals
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'sumitals',
    'sumitals',
    false,
    52428800, -- 50MB limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Nota: Se omiten políticas, funciones y triggers de storage en remoto para evitar fallos por dependencias
DO $$
BEGIN
  RAISE NOTICE 'Migración 20250131000004_setup_sumitals_storage: se creó/aseguró el bucket sumitals y se omiten políticas y funciones por ahora';
END $$;