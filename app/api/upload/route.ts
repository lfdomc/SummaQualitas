import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'attachments';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }
    
    // Validar tipo de archivo
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/jpg',
      'image/gif',
      'image/webp',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}` },
        { status: 400 }
      );
    }
    
    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB.' },
        { status: 400 }
      );
    }
    
    // Crear cliente administrativo (bypassa RLS)
    const supabase = createAdminClient();
    
    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;
    
    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);
    
    // Subir archivo a Supabase Storage usando service role
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      return NextResponse.json(
        { error: `Error al subir archivo: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);
    
    return NextResponse.json({
      url: urlData.publicUrl,
      name: file.name,
      type: file.type,
      size: file.size,
      path: filePath
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'No se proporcionó la ruta del archivo' },
        { status: 400 }
      );
    }
    
    // Crear cliente administrativo
    const supabase = createAdminClient();
    
    // Eliminar archivo
    const { error } = await supabase.storage
      .from('attachments')
      .remove([filePath]);
    
    if (error) {
      return NextResponse.json(
        { error: `Error al eliminar archivo: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación del usuario
    const supabaseServer = createServerClient(request);
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') || 'attachments';
    const prefix = searchParams.get('prefix') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 100, 1), 1000) : 100;

    const supabaseAdmin = createAdminClient();

    const { data: files, error: listError } = await supabaseAdmin
      .storage
      .from(bucket)
      .list(prefix, { limit, sortBy: { column: 'name', order: 'asc' } });

    if (listError) {
      return NextResponse.json(
        { error: `Error al listar archivos: ${listError.message}` },
        { status: 500 }
      );
    }

    const results = await Promise.all((files || []).map(async (file) => {
      const path = prefix ? `${prefix}/${file.name}` : file.name;
      const ext = file.name.split('.').pop()?.toLowerCase();
      const guessedType = ext === 'pdf' ? 'application/pdf'
        : ext === 'png' ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
        : ext === 'gif' ? 'image/gif'
        : ext === 'webp' ? 'image/webp'
        : undefined;
      const size = (file as any)?.metadata?.size ?? undefined;

      if (bucket === 'attachments') {
        const { data: urlData } = supabaseAdmin.storage
          .from(bucket)
          .getPublicUrl(path);
        return {
          name: file.name,
          path,
          size,
          updated_at: (file as any)?.updated_at,
          type: guessedType,
          url: urlData.publicUrl
        };
      } else {
        const { data: signed, error: signedError } = await supabaseAdmin.storage
          .from(bucket)
          .createSignedUrl(path, 3600);
        return {
          name: file.name,
          path,
          size,
          updated_at: (file as any)?.updated_at,
          type: guessedType,
          url: signedError ? null : signed?.signedUrl,
          signed: true
        };
      }
    }));

    return NextResponse.json({ bucket, prefix, count: results.length, files: results });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}