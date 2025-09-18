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
  try {
    let fileToUpload = file;
    
    // Comprimir archivo si es necesario
    if (file.type.startsWith('image/')) {
      const compressed = await compressImage(file, 2048); // 2MB máximo para imágenes
      fileToUpload = compressed.file;
      console.log(`Imagen comprimida: ${(compressed.originalSize / 1024).toFixed(1)}KB → ${(compressed.compressedSize / 1024).toFixed(1)}KB`);
    } else if (file.type === 'application/pdf') {
      const compressed = await compressPDF(file);
      fileToUpload = compressed.file;
      console.log(`PDF procesado: ${(compressed.originalSize / 1024).toFixed(1)}KB → ${(compressed.compressedSize / 1024).toFixed(1)}KB`);
    }
    
    // Crear FormData para enviar a la API
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folder', folder);
    
    // Subir archivo usando la API route (bypassa RLS)
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al subir archivo');
    }
    
    const result = await response.json();
    
    return {
      url: result.url,
      name: result.name,
      type: result.type,
      size: result.size
    };
  } catch (error) {
    console.error('Error en uploadFile:', error);
    throw error;
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
    console.error('Error en deleteFile:', error);
    throw error;
  }
};

export const fileService = {
  uploadFile,
  deleteFile,
  compressImage,
  compressPDF
};