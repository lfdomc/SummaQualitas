import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/client';
import { SumitalAttachmentType, CreateSumitalAttachmentData } from '@/lib/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
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
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const serviceRoleAvailable = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    // Usar cliente de Storage con service role si está disponible para evitar problemas de RLS en storage.objects
    const storageClient = serviceRoleAvailable ? createAdminClient() : supabase;
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sumitalId = formData.get('sumital_id') as string;
    const attachmentType = formData.get('attachment_type') as SumitalAttachmentType;
    const description = formData.get('description') as string;

    if (!file || !sumitalId || !attachmentType) {
      return NextResponse.json({ 
        error: 'Archivo, ID de sumital y tipo de adjunto son requeridos' 
      }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no permitido' 
      }, { status: 400 });
    }

    // Validar tamaño de archivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'El archivo es demasiado grande. Máximo 50MB' 
      }, { status: 400 });
    }

    // Verificar que el sumital existe y el usuario tiene acceso
    const { data: sumital, error: sumitalError } = await supabase
      .from('sumitals')
      .select(`
        id,
        project_id,
        created_by,
        projects!inner(id)
      `)
      .eq('id', sumitalId)
      .single();

    if (sumitalError || !sumital) {
      return NextResponse.json({ 
        error: 'Sumital no encontrado o sin acceso' 
      }, { status: 404 });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = file.name.includes('.') ? file.name.split('.').pop() : '';
    const safeExt = fileExtension ? `.${fileExtension}` : '';
    const fileName = `${sumitalId}/${attachmentType}_${timestamp}${safeExt}`;

    // Subir archivo a Supabase Storage
    // Nota: En entornos server, convertir a ArrayBuffer/Uint8Array mejora compatibilidad
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);
    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('sumitals')
      .upload(fileName, fileBytes, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      });

    if (uploadError) {
      const isRlsViolation = /row-level security|permission/i.test(uploadError.message || '');
      console.error('Error uploading file (Storage):', {
        message: uploadError.message,
        name: uploadError.name,
        statusCode: (uploadError as any)?.statusCode,
        serviceRoleAvailable,
        isRlsViolation
      });
      return NextResponse.json({ 
        error: isRlsViolation
          ? 'Permisos insuficientes para subir al Storage (RLS)'
          : 'Error al subir archivo',
        details: uploadError.message || null
      }, { status: isRlsViolation ? 403 : 500 });
    }

    // Crear registro en la base de datos
    const attachmentData: CreateSumitalAttachmentData = {
      sumital_id: sumitalId,
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      file_type: file.type,
      attachment_type: attachmentType,
      description: description || undefined
    };

    // Usar service role para bypass RLS si está disponible (manteniendo nuestras validaciones de acceso);
    // en caso contrario, usar el cliente SSR (con RLS aplicado).
    const dbClient = serviceRoleAvailable ? createAdminClient() : supabase;

    const { data: attachment, error: dbError } = await dbClient
      .from('sumital_attachments')
      .insert({
        ...attachmentData,
        uploaded_by: user.id
      })
      .select(`
        *
      `)
      .single();

    if (dbError) {
      // Incluir información diagnóstica moderada
      const isRlsViolation = /row-level security/i.test(dbError.message || '');
      console.error('Error creating attachment record:', {
        message: dbError.message,
        code: (dbError as any)?.code,
        hint: (dbError as any)?.hint,
        serviceRoleAvailable,
        userId: user.id,
        sumitalId,
        isRlsViolation
      });
      
      // Eliminar archivo del storage si falla la inserción en BD
      await storageClient.storage
        .from('sumitals')
        .remove([fileName]);
      
      // Mapear violaciones de RLS a 403 para claridad
      const status = isRlsViolation ? 403 : 500;
      const errorMsg = isRlsViolation
        ? 'Permisos insuficientes según políticas de seguridad (RLS)'
        : 'Error al crear registro de archivo adjunto';

      return NextResponse.json({ 
        error: errorMsg,
        details: dbError.message || null
      }, { status });
    }

    return NextResponse.json({ 
      message: 'Archivo subido exitosamente',
      attachment 
    });

  } catch (error) {
    console.error('Error in attachments API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sumitalId = searchParams.get('sumital_id');
    const attachmentType = searchParams.get('attachment_type') as SumitalAttachmentType;

    if (!sumitalId) {
      return NextResponse.json({ 
        error: 'ID de sumital es requerido' 
      }, { status: 400 });
    }

    // Construir query base
    let query = supabase
      .from('sumital_attachments')
      .select(`
        *
      `)
      .eq('sumital_id', sumitalId);

    // Filtrar por tipo de adjunto si se proporciona
    if (attachmentType) {
      query = query.eq('attachment_type', attachmentType);
    }

    // Ejecutar query con ordenamiento
    const { data: attachments, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attachments:', error);
      return NextResponse.json({ 
        error: 'Error al obtener archivos adjuntos' 
      }, { status: 500 });
    }

    return NextResponse.json({ attachments });

  } catch (error) {
    console.error('Error in attachments GET API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json({ 
        error: 'ID de archivo adjunto es requerido' 
      }, { status: 400 });
    }

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
    console.error('Error in attachments DELETE API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}