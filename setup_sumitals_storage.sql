-- Script para configurar el bucket de Storage para archivos de sumitals
-- Ejecutar este script en el panel de Supabase (SQL Editor)

-- Crear bucket de Storage para archivos de sumitals
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

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view sumital files they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload sumital files to projects they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own sumital files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own sumital files" ON storage.objects;

-- Políticas de Storage para el bucket sumitals
CREATE POLICY "Users can view sumital files they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'sumitals' AND
        EXISTS (
            SELECT 1 FROM public.sumital_attachments sa
            JOIN public.sumitals s ON s.id = sa.sumital_id
            WHERE sa.file_path = name
            AND s.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can upload sumital files to projects they have access to" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'sumitals' AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update their own sumital files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'sumitals' AND
        EXISTS (
            SELECT 1 FROM public.sumital_attachments sa
            WHERE sa.file_path = name
            AND sa.uploaded_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own sumital files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'sumitals' AND
        EXISTS (
            SELECT 1 FROM public.sumital_attachments sa
            WHERE sa.file_path = name
            AND sa.uploaded_by = auth.uid()
        )
    );

-- Función para limpiar archivos huérfanos del storage
CREATE OR REPLACE FUNCTION clean_orphaned_sumital_files()
RETURNS void AS $$
BEGIN
    -- Eliminar archivos del storage que no tienen registro en sumital_attachments
    DELETE FROM storage.objects
    WHERE bucket_id = 'sumitals'
    AND NOT EXISTS (
        SELECT 1 FROM public.sumital_attachments sa
        WHERE sa.file_path = name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función trigger para eliminar archivo del storage cuando se elimina el registro
CREATE OR REPLACE FUNCTION delete_sumital_attachment_file()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar archivo del storage
    DELETE FROM storage.objects
    WHERE bucket_id = 'sumitals'
    AND name = OLD.file_path;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trigger_delete_sumital_attachment_file ON public.sumital_attachments;

-- Crear trigger para eliminar archivos automáticamente
CREATE TRIGGER trigger_delete_sumital_attachment_file
    AFTER DELETE ON public.sumital_attachments
    FOR EACH ROW
    EXECUTE FUNCTION delete_sumital_attachment_file();

-- Verificar que el bucket se creó correctamente
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'sumitals';

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%sumital%'
ORDER BY policyname;

-- Comentarios
COMMENT ON FUNCTION clean_orphaned_sumital_files() IS 'Función para limpiar archivos huérfanos del bucket sumitals';
COMMENT ON FUNCTION delete_sumital_attachment_file() IS 'Función trigger para eliminar archivos del storage cuando se elimina el registro de sumital_attachments';