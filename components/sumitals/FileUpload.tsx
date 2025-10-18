'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, X, File, Image, FileText, Download, Trash2 } from 'lucide-react';
import { SumitalAttachment, SumitalAttachmentType } from '@/lib/types';

interface FileUploadProps {
  sumitalId?: string;
  attachmentType: SumitalAttachmentType;
  title: string;
  description?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploadSuccess?: (attachment: SumitalAttachment) => void;
  onDeleteSuccess?: (attachmentId: string) => void;
  existingAttachments?: SumitalAttachment[];
  disabled?: boolean;
}

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

export default function FileUpload({
  sumitalId,
  attachmentType,
  title,
  description,
  multiple = true,
  maxFiles = 10,
  onUploadSuccess,
  onDeleteSuccess,
  existingAttachments = [],
  disabled = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Tipo de archivo no permitido';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'El archivo es demasiado grande (máximo 50MB)';
    }
    return null;
  };

  const uploadFile = async (file: File, fileDescription?: string) => {
    if (!sumitalId) {
      toast.error('ID de sumital no disponible');
      return;
    }

    const validation = validateFile(file);
    if (validation) {
      toast.error(validation);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sumital_id', sumitalId);
    formData.append('attachment_type', attachmentType);
    if (fileDescription) {
      formData.append('description', fileDescription);
    }

    // Reintentos automáticos para errores de red y 5xx del servidor
    const maxRetries = 2; // total 3 intentos
    let attempt = 0;

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    while (true) {
      try {
        const response = await fetch('/api/sumitals/attachments', {
          method: 'POST',
          body: formData,
        });

        let result: any = null;
        try {
          result = await response.json();
        } catch (parseErr) {
          // Si no es JSON, intentamos obtener texto para mensajes de error
          try {
            const text = await response.text();
            result = { error: text };
          } catch {}
        }

        if (!response.ok) {
          const serverMsg = typeof result?.error === 'string' ? result.error : 'Error al subir archivo';
          const detailsMsg = result?.details ? `: ${result.details}` : '';
          const composed = serverMsg + detailsMsg;

          if (response.status >= 500 && attempt < maxRetries) {
            attempt++;
            const waitMs = Math.min(2000, 500 * Math.pow(2, attempt));
            console.warn(`Intento ${attempt}/${maxRetries} fallido al subir adjunto. Reintentando en ${waitMs} ms...`, { composed, status: response.status });
            await delay(waitMs);
            continue; // reintentar
          }

          throw new Error(composed);
        }

        toast.success('Archivo subido exitosamente');
        onUploadSuccess?.(result.attachment);
        break; // éxito
      } catch (error) {
        const isNetworkError = error instanceof TypeError;
        if (isNetworkError && attempt < maxRetries) {
          attempt++;
          const waitMs = Math.min(2000, 500 * Math.pow(2, attempt));
          console.warn(`Error de red al subir adjunto. Intento ${attempt}/${maxRetries} en ${waitMs} ms...`, error);
          await delay(waitMs);
          continue; // reintentar
        }
        console.error('Error uploading file:', error);
        toast.error(error instanceof Error ? error.message : 'Error al subir archivo');
        break; // finalizar tras error no recuperable
      }
    }
  };

  const handleFileSelect = async (files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    
    if (!multiple && fileArray.length > 1) {
      toast.error('Solo se permite un archivo');
      return;
    }

    if (existingAttachments.length + fileArray.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    setUploading(true);

    try {
      for (const file of fileArray) {
        await uploadFile(file);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const downloadFile = async (attachment: SumitalAttachment) => {
    try {
      const response = await fetch(`/api/sumitals/attachments/${attachment.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener URL de descarga');
      }

      // Abrir en nueva ventana para descargar
      window.open(result.download_url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar archivo');
    }
  };

  const deleteFile = async (attachment: SumitalAttachment) => {
    if (!confirm('¿Está seguro de que desea eliminar este archivo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sumitals/attachments/${attachment.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar archivo');
      }

      toast.success('Archivo eliminado exitosamente');
      onDeleteSuccess?.(attachment.id);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Error al eliminar archivo');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">{title}</Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Área de carga */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            {uploading ? 'Subiendo archivos...' : 'Haga clic o arrastre archivos aquí'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, Word, Excel, imágenes (máx. 50MB)
          </p>
        </CardContent>
      </Card>

      <Input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={ALLOWED_TYPES.join(',')}
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Lista de archivos existentes */}
      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Archivos adjuntos</Label>
          {existingAttachments.map((attachment) => (
            <Card key={attachment.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(attachment.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)} • {' '}
                      {new Date(attachment.uploaded_at).toLocaleDateString()}
                    </p>
                    {attachment.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {attachment.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFile(attachment)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Información adicional */}
      <div className="text-xs text-muted-foreground">
        <p>• Tipos permitidos: PDF, Word, Excel, imágenes</p>
        <p>• Tamaño máximo por archivo: 50MB</p>
        <p>• Máximo {maxFiles} archivos</p>
      </div>
    </div>
  );
}