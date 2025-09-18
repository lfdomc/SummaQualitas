import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
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
      console.error('Error subiendo archivo:', error);
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
    console.error('Error en API de upload:', error);
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
      console.error('Error eliminando archivo:', error);
      return NextResponse.json(
        { error: `Error al eliminar archivo: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error en API de delete:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}