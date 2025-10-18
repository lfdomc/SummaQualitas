-- Script para crear la tabla sumital_attachments y sus políticas RLS
-- Ejecutar este script en el panel de Supabase (SQL Editor)

-- Crear tabla para archivos adjuntos de sumitals
CREATE TABLE IF NOT EXISTS public.sumital_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sumital_id UUID NOT NULL REFERENCES public.sumitals(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    attachment_type TEXT NOT NULL CHECK (attachment_type IN ('document', 'image', 'signed_sumital')),
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_sumital_attachments_sumital_id ON public.sumital_attachments(sumital_id);
CREATE INDEX IF NOT EXISTS idx_sumital_attachments_type ON public.sumital_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_sumital_attachments_uploaded_by ON public.sumital_attachments(uploaded_by);

-- Habilitar RLS
ALTER TABLE public.sumital_attachments ENABLE ROW LEVEL SECURITY;

-- Eliminar las políticas existentes si existen
DROP POLICY IF EXISTS "Users can view attachments of sumitals they have access to" ON public.sumital_attachments;
DROP POLICY IF EXISTS "Users can insert attachments to sumitals they have access to" ON public.sumital_attachments;
DROP POLICY IF EXISTS "Users can update their own attachments" ON public.sumital_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.sumital_attachments;

-- Crear las políticas RLS corregidas
CREATE POLICY "Users can view attachments of sumitals they have access to" ON public.sumital_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sumitals s
            WHERE s.id = sumital_id
            AND s.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert attachments to sumitals they have access to" ON public.sumital_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sumitals s
            WHERE s.id = sumital_id
            AND s.created_by = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their own attachments" ON public.sumital_attachments
    FOR UPDATE USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own attachments" ON public.sumital_attachments
    FOR DELETE USING (uploaded_by = auth.uid());

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_sumital_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_update_sumital_attachments_updated_at ON public.sumital_attachments;
CREATE TRIGGER trigger_update_sumital_attachments_updated_at
    BEFORE UPDATE ON public.sumital_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_sumital_attachments_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.sumital_attachments IS 'Tabla para almacenar archivos adjuntos de sumitals';
COMMENT ON COLUMN public.sumital_attachments.attachment_type IS 'Tipo de adjunto: document (documentos generales), image (imágenes), signed_sumital (sumital firmado por cliente)';
COMMENT ON COLUMN public.sumital_attachments.file_path IS 'Ruta del archivo en Supabase Storage';
COMMENT ON COLUMN public.sumital_attachments.file_size IS 'Tamaño del archivo en bytes';

-- Verificar que la tabla se creó correctamente
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sumital_attachments'
ORDER BY ordinal_position;

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'sumital_attachments'
ORDER BY policyname;