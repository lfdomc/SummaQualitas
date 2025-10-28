import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/client';
import { PDFDocument, rgb, StandardFonts, PDFName } from 'pdf-lib';
import path from 'path';
import fs from 'fs';
import React from 'react';
import { pdf as pdfRenderer } from '@react-pdf/renderer';
import SumitalAnnexesDocument from './SumitalAnnexesDocument';
// React/React-PDF no utilizados: se eliminaron al quitar páginas de anexos

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient(request);
    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;
    const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener información del sumital
    const { data: sumital, error: sumitalError } = await supabase
      .from('sumitals')
      .select(`
        *,
        project:projects(
          id, 
          name, 
          client_id,
          client:clients(name, email, phone)
        )
      `)
      .eq('id', params.id)
      .single();

    if (sumitalError || !sumital) {
      return NextResponse.json({ error: 'Sumital no encontrado' }, { status: 404 });
    }

    // Obtener adjuntos del sumital desde la tabla
    const { data: attachments, error: attachmentsError } = await supabase
      .from('sumital_attachments')
      .select(`
        *
      `)
      .eq('sumital_id', params.id)
      .order('attachment_type', { ascending: true })
      .order('created_at', { ascending: false });

    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError);
      return NextResponse.json({ error: 'Error al obtener adjuntos' }, { status: 500 });
    }

    // DEBUG: Log de adjuntos de la tabla
    console.log('=== PDF DEBUG ===');
    console.log('Sumital ID:', params.id);
    console.log('Attachments from table:', attachments?.length || 0, attachments);
    console.log('Sumital attached_documents field:', sumital.attached_documents);
    console.log('Type of attached_documents:', typeof sumital.attached_documents);
    console.log('Is array?', Array.isArray(sumital.attached_documents));
    console.log('Length:', sumital.attached_documents?.length);

    // Combinar adjuntos de la tabla con los del campo JSON attached_documents
    let allAttachments = [...(attachments || [])];
    
    // Agregar adjuntos del campo JSON si existen
    if (sumital.attached_documents && Array.isArray(sumital.attached_documents)) {
      const jsonAttachments = sumital.attached_documents.map((doc: any, index: number) => {
        console.log(`Processing JSON attachment ${index}:`, doc);
        return {
          id: `json_${index}`,
          file_name: doc.name || `Documento ${index + 1}`,
          file_path: null, // Los adjuntos JSON no tienen archivo físico
          file_type: 'application/pdf', // Asumimos PDF por defecto
          attachment_type: 'document',
          description: `Enlace: ${doc.url}`,
          created_at: sumital.created_at,
          url: doc.url, // Guardamos la URL para mostrarla
          is_json_attachment: true // Marcador para identificar adjuntos JSON
        };
      });
      allAttachments = [...allAttachments, ...jsonAttachments];
      console.log('JSON attachments added:', jsonAttachments.length, jsonAttachments);
    }

    console.log('Total allAttachments:', allAttachments.length, allAttachments);
    console.log('=== END PDF DEBUG ===');

    // Crear el PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper: agrega una anotación de enlace clicable en la página
    const addUriLink = (page: any, x: number, y: number, width: number, height: number, url?: string) => {
      try {
        if (!url) return;
        // Acción URI como diccionario indirecto, usando PDFName para claves tipo Name
        const uriAction = pdfDoc.context.obj({
          // El Type en acciones es opcional, pero si se incluye debe ser Name
          Type: PDFName.of('Action'),
          S: PDFName.of('URI'),
          URI: pdfDoc.context.str(url),
        });
        const uriActionRef = pdfDoc.context.register(uriAction);

        // Anotación de enlace: diccionario indirecto con Type/Subtype como Name
        const linkAnnot = pdfDoc.context.obj({
          Type: PDFName.of('Annot'),
          Subtype: PDFName.of('Link'),
          Rect: pdfDoc.context.obj([x, y, x + width, y + height]),
          Border: pdfDoc.context.obj([0, 0, 0]),
          A: uriActionRef,
        });
        const linkAnnotRef = pdfDoc.context.register(linkAnnot);

        // Asegurar que la página tenga el arreglo Annots (PDFArray) y añadir la anotación
        let annots = (page as any).node.get(PDFName.of('Annots'));
        if (!annots) {
          annots = pdfDoc.context.obj([]);
          (page as any).node.set(PDFName.of('Annots'), annots);
        }
        annots.push(linkAnnotRef);
      } catch (e: any) {
        console.warn('No se pudo agregar enlace al PDF:', e?.message || e);
      }
    };

    // Configuración de página
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    // Cargar el logo de la empresa
    let logoImage = null;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'summa', 'logo_2b.png');
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch (error) {
      console.log('Logo no encontrado, continuando sin logo:', error);
    }

    // Página principal con información del sumital
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    // Función para verificar si necesitamos una nueva página
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition - requiredSpace < margin + 50) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
        return true;
      }
      return false;
    };

    // HEADER EJECUTIVO REDISEÑADO
    // Fondo del header con gradiente visual
    currentPage.drawRectangle({
      x: 0,
      y: yPosition - 100,
      width: pageWidth,
      height: 100,
      color: rgb(0.96, 0.97, 0.98), // Gris muy claro
    });

    // Línea superior azul corporativa
    currentPage.drawRectangle({
      x: 0,
      y: yPosition - 5,
      width: pageWidth,
      height: 5,
      color: rgb(0.16, 0.50, 0.73), // Azul corporativo
    });

    // Logo de la empresa (más grande y prominente)
    if (logoImage) {
      const logoWidth = 80;
      const logoHeight = 40;
      currentPage.drawImage(logoImage, {
        x: margin,
        y: yPosition - 80,
        width: logoWidth,
        height: logoHeight,
      });
    }

    // Información de la empresa (profesional)
    currentPage.drawText('SUMMA QUÁLITAS', {
      x: margin + 90,
      y: yPosition - 35,
      size: 20,
      font: helveticaBoldFont,
      color: rgb(0.16, 0.50, 0.73),
    });

    currentPage.drawText('Constructora y Servicios', {
      x: margin + 90,
      y: yPosition - 55,
      size: 12,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Información corporativa (lado derecho, más organizada)
    const rightX = pageWidth - margin - 150;
    
    // Caja de información corporativa
    currentPage.drawRectangle({
      x: rightX - 10,
      y: yPosition - 85,
      width: 160,
      height: 70,
      color: rgb(1, 1, 1), // Blanco
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
    });

    currentPage.drawText('INFORMACIÓN CORPORATIVA', {
      x: rightX,
      y: yPosition - 25,
      size: 8,
      font: helveticaBoldFont,
      color: rgb(0.16, 0.50, 0.73),
    });

    // Título removido para un diseño más limpio

    currentPage.drawText('ID: 3-102-849290', {
      x: rightX,
      y: yPosition - 40,
      size: 9,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    currentPage.drawText('info@summacualitas.com', {
      x: rightX,
      y: yPosition - 55,
      size: 9,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    currentPage.drawText('+506 2222-3333', {
      x: rightX,
      y: yPosition - 70,
      size: 9,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Fecha del reporte
    const currentDate = new Date().toLocaleDateString('es-ES');
    currentPage.drawText(`Fecha del reporte: ${currentDate}`, {
      x: margin,
      y: yPosition - 95,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Línea separadora elegante
    yPosition -= 120;
    currentPage.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: pageWidth - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    yPosition -= 30;

    // SECCIÓN: INFORMACIÓN DEL PROYECTO (Diseño ejecutivo)
    if (sumital.project) {
      // Verificar si necesitamos una nueva página
      checkPageBreak(150);
      
      // Título de sección con línea lateral
      currentPage.drawRectangle({
        x: margin - 5,
        y: yPosition - 2,
        width: 4,
        height: 20,
        color: rgb(0.16, 0.50, 0.73),
      });

      currentPage.drawText('INFORMACIÓN DEL PROYECTO', {
        x: margin + 10,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 35;

      // Contenido en dos columnas con mejor espaciado
      const leftColumnX = margin + 20;
      const rightColumnX = margin + (contentWidth / 2) + 20;

      // Columna izquierda
      currentPage.drawText('Proyecto:', {
        x: leftColumnX,
        y: yPosition,
        size: 10,
        font: helveticaBoldFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      currentPage.drawText(sumital.project.name, {
        x: leftColumnX,
        y: yPosition - 18,
        size: 12,
        font: helveticaFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      const clientData: any = (() => {
        const c: any = sumital.project.client;
        if (Array.isArray(c)) return c[0] ?? null;
        if (typeof c === 'object' && c !== null) return c;
        if (typeof c === 'string') return { name: c };
        return null;
      })();

      if (clientData) {
        currentPage.drawText('Cliente:', {
          x: leftColumnX,
          y: yPosition - 45,
          size: 10,
          font: helveticaBoldFont,
          color: rgb(0.4, 0.4, 0.4),
        });
        currentPage.drawText(String(clientData.name ?? 'N/A'), {
          x: leftColumnX,
          y: yPosition - 63,
          size: 12,
          font: helveticaFont,
          color: rgb(0.1, 0.1, 0.1),
        });

        // Columna derecha
        if (clientData.email) {
          currentPage.drawText('Email:', {
            x: rightColumnX,
            y: yPosition,
            size: 10,
            font: helveticaBoldFont,
            color: rgb(0.4, 0.4, 0.4),
          });
          currentPage.drawText(String(clientData.email), {
            x: rightColumnX,
            y: yPosition - 18,
            size: 12,
            font: helveticaFont,
            color: rgb(0.1, 0.1, 0.1),
          });
        }

        if (clientData.phone) {
          currentPage.drawText('Teléfono:', {
            x: rightColumnX,
            y: yPosition - 45,
            size: 10,
            font: helveticaBoldFont,
            color: rgb(0.4, 0.4, 0.4),
          });
          currentPage.drawText(String(clientData.phone || ''), {
            x: rightColumnX,
            y: yPosition - 63,
            size: 12,
            font: helveticaFont,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
      }

      yPosition -= 90;
    }

    // SECCIÓN: INFORMACIÓN DEL SUMITAL (Diseño ejecutivo)
    // Verificar si necesitamos una nueva página
    checkPageBreak(200);
    
    // Título de sección con línea lateral
    currentPage.drawRectangle({
      x: margin - 5,
      y: yPosition - 2,
      width: 4,
      height: 20,
      color: rgb(0.16, 0.50, 0.73),
    });

    currentPage.drawText('INFORMACIÓN DEL SUMITAL', {
      x: margin + 10,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 35;

    // Contenido en dos columnas con mejor espaciado
    const leftColumnX = margin + 20;
    const rightColumnX = margin + (contentWidth / 2) + 20;

    // Columna izquierda
    currentPage.drawText('Número de Sumital:', {
      x: leftColumnX,
      y: yPosition,
      size: 10,
      font: helveticaBoldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    currentPage.drawText(String(sumital.sumital_number || 'N/A'), {
      x: leftColumnX,
      y: yPosition - 18,
      size: 12,
      font: helveticaFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    currentPage.drawText('Proveedor:', {
      x: leftColumnX,
      y: yPosition - 45,
      size: 10,
      font: helveticaBoldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    currentPage.drawText(sumital.supplier_name || 'Sin proveedor especificado', {
      x: leftColumnX,
      y: yPosition - 63,
      size: 12,
      font: helveticaFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Estado de aprobación con diseño ejecutivo
    let approvalStatus = 'Pendiente';
    let statusColor = rgb(0.8, 0.6, 0.0); // Amarillo para pendiente
    if (sumital.is_approved === true) {
      approvalStatus = 'Aprobado';
      statusColor = rgb(0.0, 0.6, 0.0); // Verde para aprobado
    } else if (sumital.is_approved === false) {
      approvalStatus = 'Rechazado';
      statusColor = rgb(0.8, 0.0, 0.0); // Rojo para rechazado
    }
    
    currentPage.drawText('Estado:', {
      x: leftColumnX,
      y: yPosition - 90,
      size: 10,
      font: helveticaBoldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    // Caja para el estado
    currentPage.drawRectangle({
      x: leftColumnX - 2,
      y: yPosition - 115,
      width: 80,
      height: 18,
      color: statusColor,
      opacity: 0.1,
    });
    
    currentPage.drawText(approvalStatus, {
      x: leftColumnX,
      y: yPosition - 108,
      size: 12,
      font: helveticaBoldFont,
      color: statusColor,
    });

    // Columna derecha
    currentPage.drawText('ID del Sistema:', {
      x: rightColumnX,
      y: yPosition,
      size: 10,
      font: helveticaBoldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    currentPage.drawText(sumital.id.substring(0, 8) + '...', {
      x: rightColumnX,
      y: yPosition - 18,
      size: 12,
      font: helveticaFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Precio total destacado
    const totalPrice = sumital.total_price ? `$${Number(sumital.total_price).toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : 'No especificado';
    currentPage.drawText('Precio Total:', {
      x: rightColumnX,
      y: yPosition - 45,
      size: 10,
      font: helveticaBoldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    // Caja para el precio
    currentPage.drawRectangle({
      x: rightColumnX - 2,
      y: yPosition - 70,
      width: 120,
      height: 18,
      color: rgb(0.0, 0.4, 0.0),
      opacity: 0.1,
    });
    
    currentPage.drawText(totalPrice, {
      x: rightColumnX,
      y: yPosition - 63,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0.0, 0.4, 0.0),
    });

    yPosition -= 140;

    // SECCIÓN: DESCRIPCIÓN DEL EQUIPO (Diseño ejecutivo)
    const description = sumital.equipment_description || 'Sin descripción especificada';
    
    // Verificar si necesitamos una nueva página para la descripción del equipo
    const descriptionLines = Math.ceil(description.length / 80) + 1;
    const descriptionHeight = Math.max(60, descriptionLines * 16 + 20);
    checkPageBreak(descriptionHeight + 80);

    // Título de sección con línea lateral
    currentPage.drawRectangle({
      x: margin - 5,
      y: yPosition - 2,
      width: 4,
      height: 20,
      color: rgb(0.16, 0.50, 0.73),
    });

    currentPage.drawText('DESCRIPCIÓN DEL EQUIPO', {
      x: margin + 10,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 35;

    // Caja de contenido
    currentPage.drawRectangle({
      x: margin + 15,
      y: yPosition - descriptionHeight + 10,
      width: contentWidth - 30,
      height: descriptionHeight,
      color: rgb(0.98, 0.98, 0.98),
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });

    // Texto con word wrap mejorado
    const words = description.split(' ');
    let currentLine = '';
    const maxLineWidth = contentWidth - 60;
    let currentY = yPosition - 20;
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = helveticaFont.widthOfTextAtSize(testLine, 11);
      
      if (textWidth > maxLineWidth && currentLine) {
        currentPage.drawText(currentLine, {
          x: margin + 25,
          y: currentY,
          size: 11,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        currentY -= 16;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      currentPage.drawText(currentLine, {
        x: margin + 25,
        y: currentY,
        size: 11,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    yPosition -= descriptionHeight + 30;

    // SECCIÓN: INFORMACIÓN TÉCNICA DEL EQUIPO (Diseño ejecutivo)
    const technicalFields = [
      { label: 'Marca', value: sumital.brand },
      { label: 'Modelo', value: sumital.model },
      { label: 'País de origen', value: sumital.country_of_origin },
      { label: 'Período de garantía', value: sumital.warranty_period },
      { label: 'Vida útil', value: sumital.useful_life },
      { label: 'Teléfono del proveedor', value: sumital.supplier_phone }
    ].filter(field => field.value).map(field => ({
      ...field,
      value: String(field.value)
    }));

    if (technicalFields.length > 0) {
      // Verificar si necesitamos una nueva página para la información técnica
      const technicalSectionHeight = Math.ceil(technicalFields.length / 2) * 40 + 100;
      checkPageBreak(technicalSectionHeight);

      // Título de sección con línea lateral
      currentPage.drawRectangle({
        x: margin - 5,
        y: yPosition - 2,
        width: 4,
        height: 20,
        color: rgb(0.16, 0.50, 0.73),
      });

      currentPage.drawText('INFORMACIÓN TÉCNICA', {
        x: margin + 10,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 35;

      // Mostrar campos en dos columnas con mejor espaciado
      const leftColX = margin + 20;
      const rightColX = margin + (contentWidth / 2) + 20;
      let currentY = yPosition;
      
      technicalFields.forEach((field, index) => {
        const isLeftColumn = index % 2 === 0;
        const x = isLeftColumn ? leftColX : rightColX;
        
        if (!isLeftColumn && index > 0) {
          // No cambiar Y para la columna derecha en la misma fila
        } else if (index > 1) {
          currentY -= 40; // Espacio entre filas
        }

        // Etiqueta
        currentPage.drawText(`${field.label}:`, {
          x: x,
          y: currentY,
          size: 10,
          font: helveticaBoldFont,
          color: rgb(0.4, 0.4, 0.4),
        });

        // Valor
        currentPage.drawText(field.value, {
          x: x,
          y: currentY - 18,
          size: 11,
          font: helveticaFont,
          color: rgb(0.1, 0.1, 0.1),
        });
      });

      yPosition = currentY - 60;
    }

    // SECCIÓN: INFORMACIÓN ADICIONAL (Diseño ejecutivo)
    const additionalSections = [
      { title: 'MANTENIMIENTO', content: sumital.maintenance },
      { title: 'CAPACITACIÓN', content: sumital.training },
      { title: 'OBSERVACIONES', content: sumital.observations }
    ].filter(section => section.content);

    additionalSections.forEach((section, index) => {
      // Calcular el espacio necesario para esta sección
      const contentLines = Math.ceil(section.content.length / 80) + 1;
      const sectionHeight = Math.max(60, contentLines * 16 + 20);
      const requiredSpace = sectionHeight + 70; // Incluye título y espaciado
      
      // Verificar si necesitamos una nueva página
      checkPageBreak(requiredSpace);
      
      // Título de sección con línea lateral
      currentPage.drawRectangle({
        x: margin - 5,
        y: yPosition - 2,
        width: 4,
        height: 20,
        color: rgb(0.16, 0.50, 0.73),
      });

      currentPage.drawText(section.title, {
        x: margin + 10,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 35;

      // Caja de contenido
      currentPage.drawRectangle({
        x: margin + 15,
        y: yPosition - sectionHeight + 10,
        width: contentWidth - 30,
        height: sectionHeight,
        color: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
      });

      // Contenido con word wrap
      const words = section.content.split(' ');
      let currentLine = '';
      const maxLineWidth = contentWidth - 60;
      let currentY = yPosition - 20;
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const textWidth = helveticaFont.widthOfTextAtSize(testLine, 11);
        
        if (textWidth > maxLineWidth && currentLine) {
          currentPage.drawText(currentLine, {
            x: margin + 25,
            y: currentY,
            size: 11,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          });
          currentY -= 16;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        currentPage.drawText(currentLine, {
          x: margin + 25,
          y: currentY,
          size: 11,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      yPosition -= sectionHeight + 30;
    });

    // Información de fechas (diseño ejecutivo)
    yPosition -= 20;
    
    // Verificar si necesitamos una nueva página para las fechas
    checkPageBreak(60);
    
    if (sumital.created_at) {
      const createdDate = new Date(sumital.created_at).toLocaleDateString('es-ES');
      currentPage.drawText(`Fecha de creación: ${createdDate}`, {
        x: margin,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= 20;
    }

    if (sumital.updated_at) {
      const updatedDate = new Date(sumital.updated_at).toLocaleDateString('es-ES');
      currentPage.drawText(`Última actualización: ${updatedDate}`, {
        x: margin,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= 20;
    }

    // (Eliminado) Lista de adjuntos en la página principal.
    // Esta sección se ha removido para evitar que aparezca la página "ARCHIVOS ADJUNTOS"
    // en el cuerpo del PDF. Los anexos ahora se generan con React-PDF y se agregan al final.

    // Agregar páginas para cada adjunto (solo PDFs e imágenes)
    let processedAttachments = 0;
    console.log('=== STARTING ATTACHMENT PROCESSING ===');
    console.log('allAttachments exists?', !!allAttachments);
    console.log('allAttachments length:', allAttachments?.length);
    if (allAttachments && allAttachments.length > 0) {
      console.log('Entering attachment processing loop...');
      for (const attachment of allAttachments) {
        try {
          // No crear páginas informativas para enlaces externos; se listan en los ANEXOS al final.
          if (attachment.is_json_attachment) {
            continue; // Pasar al siguiente adjunto
          }

          // No embeber adjuntos del tipo "Sumital Firmado"; quedarán solo en ANEXOS.
          if (attachment.attachment_type === 'signed_sumital') {
            continue;
          }

          // Validar que el adjunto tenga la información necesaria (solo para adjuntos físicos)
          if (!attachment.file_path || !attachment.file_name) {
            console.warn(`Skipping attachment with missing data:`, attachment);
            continue;
          }

          // No crear páginas informativas. Solo embebemos el contenido cuando sea visualizable.

          // Obtener el archivo desde Supabase Storage (usar Service Role si está disponible para evitar problemas de RLS)
          const storageClient = adminSupabase || supabase;
          const { data: fileData, error: fileError } = await storageClient.storage
            .from('sumitals')
            .download(attachment.file_path);

          if (fileError || !fileData) {
            console.error(`Error downloading file ${attachment.file_name}:`, fileError);
            continue;
          }

          if (fileData.size === 0) {
            console.warn(`File ${attachment.file_name} is empty, skipping`);
            continue;
          }

          const fileBuffer = await fileData.arrayBuffer();
          const uint8Array = new Uint8Array(fileBuffer);

          // Si es un PDF, embebemos solo sus páginas (sin página informativa)
          if (attachment.file_type === 'application/pdf') {
            try {
              const existingPdf = await PDFDocument.load(uint8Array);
              const pages = await pdfDoc.copyPages(existingPdf, existingPdf.getPageIndices());
              pages.forEach((page) => pdfDoc.addPage(page));
              processedAttachments += pages.length;
            } catch (pdfError) {
              console.error(`Error embedding PDF ${attachment.file_name}:`, pdfError);
              // Sin páginas informativas: el acceso quedará en ANEXOS.
            }
          } 
          // Si es una imagen, crear una página limpia y dibujarla (sin encabezados)
          else if (attachment.file_type?.startsWith('image/')) {
            try {
              let image;
              if (attachment.file_type === 'image/jpeg' || attachment.file_type === 'image/jpg') {
                image = await pdfDoc.embedJpg(uint8Array);
              } else if (attachment.file_type === 'image/png') {
                image = await pdfDoc.embedPng(uint8Array);
              }
              if (image) {
                const imgPage = pdfDoc.addPage([pageWidth, pageHeight]);
                const maxWidth = contentWidth;
                const maxHeight = pageHeight - 2 * margin;
                let width = image.width;
                let height = image.height;
                const scaleW = maxWidth / width;
                const scaleH = maxHeight / height;
                const scale = Math.min(scaleW, scaleH, 1);
                width = width * scale;
                height = height * scale;
                imgPage.drawImage(image, {
                  x: margin + (contentWidth - width) / 2,
                  y: margin + (maxHeight - height) / 2,
                  width,
                  height,
                });
                processedAttachments++;
              }
            } catch (imageError) {
              console.error(`Error embedding image ${attachment.file_name}:`, imageError);
              // Sin páginas informativas; el acceso quedará en ANEXOS.
            }
          } else {
            // Tipos no visualizables se omiten aquí; quedarán accesibles vía ANEXOS al final.
          }

        } catch (error) {
          console.error(`Error processing attachment ${attachment.file_name}:`, error);
          continue;
        }
      }
    }

    // Página final con espacio para firma (diseño ejecutivo)
    const signaturePage = pdfDoc.addPage([pageWidth, pageHeight]);
    let signatureY = pageHeight - margin;

    // Header de la página de firma
    signaturePage.drawRectangle({
      x: 0,
      y: signatureY - 60,
      width: pageWidth,
      height: 60,
      color: rgb(0.96, 0.97, 0.98),
    });

    signaturePage.drawText('PÁGINA DE FIRMA', {
      x: margin,
      y: signatureY - 30,
      size: 18,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    signatureY -= 100;

    signaturePage.drawText('He revisado toda la documentación adjunta y confirmo que:', {
      x: margin,
      y: signatureY,
      size: 12,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    signatureY -= 40;

    // Checkboxes con mejor diseño
    const checkboxItems = [
      'La información presentada es correcta',
      'Los documentos adjuntos han sido revisados',
      'Apruebo el contenido del sumital'
    ];

    checkboxItems.forEach((item, index) => {
      // Checkbox
      signaturePage.drawRectangle({
        x: margin + 20,
        y: signatureY - 5,
        width: 12,
        height: 12,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 1,
      });

      signaturePage.drawText(item, {
        x: margin + 40,
        y: signatureY,
        size: 12,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      signatureY -= 30;
    });

    signatureY -= 50;

    // Líneas para firma con mejor diseño
    signaturePage.drawLine({
      start: { x: margin, y: signatureY },
      end: { x: margin + 200, y: signatureY },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    signaturePage.drawText('Firma del Cliente', {
      x: margin,
      y: signatureY - 20,
      size: 11,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    signaturePage.drawLine({
      start: { x: pageWidth - margin - 200, y: signatureY },
      end: { x: pageWidth - margin, y: signatureY },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    signaturePage.drawText('Fecha', {
      x: pageWidth - margin - 200,
      y: signatureY - 20,
      size: 11,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // === PÁGINAS DE ANEXOS GENERADAS POR SEPARADO (React-PDF) Y UNIDAS AL FINAL ===
    try {
      const documentAttachments = allAttachments.filter((att: any) => att.attachment_type === 'document' && !att.is_json_attachment);
      const signedAttachments = allAttachments.filter((att: any) => att.attachment_type === 'signed_sumital' && !att.is_json_attachment);
      const linkAttachments = allAttachments.filter((att: any) => att.is_json_attachment);

      const projectName = String(sumital.project?.name || 'Proyecto');

      // Renderizar con React-PDF a un buffer
      const annexStream = await pdfRenderer(
        React.createElement(SumitalAnnexesDocument, {
          projectName,
          documentAttachments,
          signedAttachments,
          linkAttachments,
          origin,
        })
      );
      const annexBuffer = await annexStream.toBuffer();

      // Cargar el PDF de anexos y copiar sus páginas al final del PDF principal
      const annexDoc = await PDFDocument.load(annexBuffer);
      const annexPages = await pdfDoc.copyPages(annexDoc, annexDoc.getPageIndices());
      annexPages.forEach((p) => pdfDoc.addPage(p));
    } catch (annexError) {
      console.error('Error generando/uniendo anexos (React-PDF):', annexError);
    }

    // Generar el PDF
    const pdfBytes = await pdfDoc.save();

    // Crear nombre descriptivo del archivo
    const sumitalNumber = sumital.sumital_number || 'N/A';
    const projectName = sumital.project?.name || 'Proyecto';
    const createdDate = sumital.created_at ? new Date(sumital.created_at).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
    
    // Limpiar el nombre del proyecto para que sea válido como nombre de archivo
    const cleanProjectName = projectName
      .replace(/[<>:"/\\|?*]/g, '') // Remover caracteres no válidos para nombres de archivo
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim()
      .substring(0, 50); // Limitar longitud
    
    const filename = `Sumital #${sumitalNumber} - ${cleanProjectName} - ${createdDate}.pdf`;

    // Retornar el PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    let errorMessage = 'Error al generar el PDF';
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      errorMessage = `Error al generar el PDF: ${error.message}`;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}