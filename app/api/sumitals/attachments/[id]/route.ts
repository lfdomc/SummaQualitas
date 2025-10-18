import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const attachmentId = params.id;

    // Obtener información del archivo adjunto
    const { data: attachment, error: fetchError } = await supabase
      .from('sumital_attachments')
      .select(`
        *,
        sumitals!inner(
          id,
          project_id,
          created_by,
          projects!inner(id)
        )
      `)
      .eq('id', attachmentId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json({ 
        error: 'Archivo adjunto no encontrado' 
      }, { status: 404 });
    }

    // Generar URL de descarga temporal (válida por 1 hora)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('sumitals')
      .createSignedUrl(attachment.file_path, 3600); // 1 hora

    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      return NextResponse.json({ 
        error: 'Error al generar URL de descarga' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      download_url: urlData.signedUrl,
      attachment: {
        id: attachment.id,
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        attachment_type: attachment.attachment_type,
        description: attachment.description,
        uploaded_at: attachment.uploaded_at
      }
    });

  } catch (error) {
    console.error('Error in attachment download API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const attachmentId = params.id;

    // Obtener información del archivo antes de eliminarlo
    const { data: attachment, error: fetchError } = await supabase
      .from('sumital_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('uploaded_by', user.id) // Solo el usuario que subió puede eliminar
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json({ 
        error: 'Archivo adjunto no encontrado o sin permisos' 
      }, { status: 404 });
    }

    // Eliminar registro de la base de datos (el trigger eliminará el archivo del storage)
    const { error: deleteError } = await supabase
      .from('sumital_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      console.error('Error deleting attachment:', deleteError);
      return NextResponse.json({ 
        error: 'Error al eliminar archivo adjunto' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Archivo adjunto eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error in attachment delete API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}