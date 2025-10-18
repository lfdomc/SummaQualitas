import { PDFDocument } from 'pdf-lib';

export interface FileUploadResult {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface CompressedImageResult {
  file: File;
  originalSize: number;
  compressedSize: number;
}

// Función para comprimir imágenes
export const compressImage = async (file: File, maxSizeKB: number = 1024): Promise<CompressedImageResult> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo la proporción
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Función para ajustar calidad hasta alcanzar el tamaño deseado
      const tryCompress = (quality: number): void => {
        canvas.toBlob((blob) => {
          if (blob) {
            const sizeKB = blob.size / 1024;
            
            if (sizeKB <= maxSizeKB || quality <= 0.1) {
              // Crear nuevo archivo con el blob comprimido
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              
              resolve({
                file: compressedFile,
                originalSize: file.size,
                compressedSize: blob.size
              });
            } else {
              // Reducir calidad y volver a intentar
              tryCompress(quality - 0.1);
            }
          }
        }, file.type, quality);
      };
      
      tryCompress(0.9);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Función para comprimir PDFs (simplificada)
export const compressPDF = async (file: File): Promise<CompressedImageResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Serializar el PDF (esto puede reducir ligeramente el tamaño)
    const pdfBytes = await pdfDoc.save();
    
    const compressedFile = new File([pdfBytes], file.name, {
      type: 'application/pdf',
      lastModified: Date.now()
    });
    
    return {
      file: compressedFile,
      originalSize: file.size,
      compressedSize: pdfBytes.length
    };
  } catch (error) {
    console.warn('Error comprimiendo PDF, usando archivo original:', error);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size
    };
  }
};

// Función principal para subir archivos
export const uploadFile = async (file: File, folder: string = 'attachments'): Promise<FileUploadResult> => {
  // Reintentos automáticos con backoff exponencial para errores de red/servidor
  const maxRetries = 2; // total 3 intentos (1 inicial + 2 reintentos)
  let attempt = 0;

  // Preparar archivo (compresión si aplica) una sola vez
  let fileToUpload = file;
  try {
    if (file.type.startsWith('image/')) {
      const compressed = await compressImage(file, 2048); // 2MB máximo para imágenes
      fileToUpload = compressed.file;
    } else if (file.type === 'application/pdf') {
      const compressed = await compressPDF(file);
      fileToUpload = compressed.file;
    }
  } catch (compressionError) {
    console.warn('Advertencia: Falló la compresión, se usará el archivo original:', compressionError);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('folder', folder);

  // Función auxiliar para esperar
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Intentar subir con reintentos
  // Nota: se capturan mensajes detallados del API (uploadError.message, details)
  while (true) {
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let message = `Error al subir archivo (HTTP ${response.status})`;
        let details: string | undefined;
        try {
          const errorData = await response.json();
          // API puede retornar { error: '...', details: '...' }
          details = errorData?.details;
          // Preferir mensaje explícito del servidor
          if (typeof errorData?.error === 'string' && errorData.error.trim().length > 0) {
            message = errorData.error;
          }
        } catch (parseErr) {
          // Si respuesta no es JSON, intentar leer texto
          try {
            const text = await response.text();
            if (text) message = text;
          } catch {}
        }

        // Sólo reintentar en errores de servidor (5xx) o fallos de red
        if (response.status >= 500 && attempt < maxRetries) {
          attempt++;
          const waitMs = Math.min(2000, 500 * Math.pow(2, attempt));
          console.warn(`Intento ${attempt}/${maxRetries} fallido al subir archivo. Reintentando en ${waitMs} ms...`, { message, details });
          await delay(waitMs);
          continue; // reintentar
        }

        // No reintentar para 4xx (errores del usuario: tipo/tamaño inválido, etc.)
        throw new Error(details ? `${message}: ${details}` : message);
      }

      const result = await response.json();
      return {
        url: result.url,
        name: result.name,
        type: result.type,
        size: result.size
      };
    } catch (err) {
      // Errores de red (TypeError: Failed to fetch) también se pueden reintentar
      const isNetworkError = err instanceof TypeError;
      if (isNetworkError && attempt < maxRetries) {
        attempt++;
        const waitMs = Math.min(2000, 500 * Math.pow(2, attempt));
        console.warn(`Error de red al subir archivo. Intento ${attempt}/${maxRetries} en ${waitMs} ms...`, err);
        await delay(waitMs);
        continue; // reintentar
      }
      // Propagar error final
      throw err instanceof Error ? err : new Error('Error desconocido al subir archivo');
    }
  }
};

// Función para eliminar archivos
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const response = await fetch(`/api/upload?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar archivo');
    }
  } catch (error) {
    throw error;
  }
};

export const fileService = {
  uploadFile,
  deleteFile,
  compressImage,
  compressPDF
};