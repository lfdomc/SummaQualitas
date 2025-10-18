'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Download, 
  FileText, 
  Image, 
  File, 
  ExternalLink,
  Calendar,
  User
} from 'lucide-react';
import { SumitalAttachment, SumitalAttachmentType } from '@/lib/types';

interface AttachmentViewerProps {
  sumitalId: string;
  attachmentType?: SumitalAttachmentType;
  title?: string;
  description?: string;
}

export default function AttachmentViewer({ 
  sumitalId, 
  attachmentType,
  title = "Archivos Adjuntos",
  description = "Documentos y archivos relacionados"
}: AttachmentViewerProps) {
  const [attachments, setAttachments] = useState<SumitalAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttachments();
  }, [sumitalId, attachmentType]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const url = `/api/sumitals/attachments?sumital_id=${sumitalId}${
        attachmentType ? `&attachment_type=${attachmentType}` : ''
      }`;
      
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar archivos');
      }

      setAttachments(result.attachments || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast.error('Error al cargar archivos adjuntos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachment: SumitalAttachment) => {
    try {
      const response = await fetch(`/api/sumitals/attachments/${attachment.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener enlace de descarga');
      }

      // Abrir en nueva ventana para descargar
      window.open(result.downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar archivo');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    } else if (fileType.includes('pdf') || fileType.includes('document')) {
      return <FileText className="w-5 h-5" />;
    } else {
      return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAttachmentTypeBadge = (type: SumitalAttachmentType) => {
    switch (type) {
      case 'document':
        return <Badge variant="secondary">Documento</Badge>;
      case 'image':
        return <Badge variant="outline">Imagen</Badge>;
      case 'signed_sumital':
        return <Badge variant="default">Sumital Firmado</Badge>;
      default:
        return <Badge variant="secondary">Archivo</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (attachments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay archivos adjuntos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-2 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-start space-x-4 flex-1 min-w-0 mb-4 sm:mb-0">
                <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg">
                  {getFileIcon(attachment.file_type)}
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h4 className="text-base font-semibold text-gray-900 break-words">
                      {attachment.file_name}
                    </h4>
                    {getAttachmentTypeBadge(attachment.attachment_type)}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">{formatFileSize(attachment.file_size)}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(attachment.created_at).toLocaleDateString()}
                    </span>
                    {attachment.uploaded_by_user && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {attachment.uploaded_by_user.name}
                      </span>
                    )}
                  </div>
                  
                  {attachment.description && (
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      {attachment.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0 sm:ml-6">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handleDownload(attachment)}
                  className="flex items-center gap-2 w-full sm:w-auto bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-300"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}