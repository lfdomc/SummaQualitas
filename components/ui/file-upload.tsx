'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { toast } from 'sonner';

export interface FileUploadResult {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface ExistingFile {
  name: string;
  url?: string;
  type?: string;
  size?: number;
}

export interface FileUploadProps {
  onFileUpload: (file: File) => Promise<FileUploadResult>;
  onFileRemove: () => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  existingFile?: ExistingFile;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onFileRemove,
  acceptedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  maxFileSize = 10 * 1024 * 1024, // 10MB por defecto
  existingFile,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Validar tipo de archivo
    if (!acceptedFileTypes.includes(file.type)) {
      toast.error(`Tipo de archivo no permitido. Tipos aceptados: ${acceptedFileTypes.join(', ')}`);
      return false;
    }

    // Validar tamaño
    if (file.size > maxFileSize) {
      toast.error(`El archivo es demasiado grande. Tamaño máximo: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadStatus('uploading');
    toast.info(`Subiendo archivo: ${file.name}...`);
    
    try {
      const result = await onFileUpload(file);
      setUploadStatus('success');
      toast.success(`✅ Archivo "${file.name}" subido exitosamente`);
      
      // Reset status after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      toast.error(`❌ Error al subir "${file.name}": ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      // Reset status after 5 seconds
      setTimeout(() => setUploadStatus('idle'), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Archivo eliminado');
  };

  const getFileIcon = (type?: string) => {
    if (!type) return <File className="h-4 w-4" />;
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Tamaño desconocido';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {existingFile ? (
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getFileIcon(existingFile.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{existingFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(existingFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {existingFile.url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.open(existingFile.url, '_blank');
                    }
                  }}
                >
                  Ver
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center space-y-2 p-6">
            <Upload className={`h-8 w-8 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="text-center">
              <p className="text-sm font-medium">
                {isUploading ? (
                  <span className="text-blue-600">📤 Subiendo archivo...</span>
                ) : uploadStatus === 'success' ? (
                  <span className="text-green-600">✅ Archivo subido correctamente</span>
                ) : uploadStatus === 'error' ? (
                  <span className="text-red-600">❌ Error al subir archivo</span>
                ) : dragActive ? (
                  'Suelta el archivo aquí'
                ) : (
                  'Arrastra un archivo aquí o haz clic para seleccionar'
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tipos permitidos: PDF, JPG, PNG (máx. {(maxFileSize / 1024 / 1024).toFixed(1)}MB)
              </p>
            </div>
            <Button
              type="button"
              variant={uploadStatus === 'success' ? 'default' : uploadStatus === 'error' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={uploadStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subiendo...
                </>
              ) : uploadStatus === 'success' ? (
                '✅ Archivo subido'
              ) : uploadStatus === 'error' ? (
                '❌ Error en subida'
              ) : (
                'Seleccionar archivo'
              )}
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes.join(',')}
              onChange={handleInputChange}
              className="hidden"
              disabled={isUploading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;