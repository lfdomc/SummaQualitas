'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Project, ChangeOrder } from '@/types/database';
import { Income, Expense } from '@/types/database';
import { projectService, incomeService, expenseService } from '@/lib/supabase/database';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { translateCategory } from '@/lib/utils';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Building,
  Settings,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  AlertTriangle,
  Eye,
  Package
} from 'lucide-react';
const { format } = require('date-fns');
const { es } = require('date-fns/locale');
import { pdf } from '@react-pdf/renderer';
import PDFReportDocument from './PDFReportDocument';
import PDFAnnexesDocument from './PDFAnnexesDocument';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExpenseChartHTML } from './ExpenseChartHTML';

// Función helper para obtener el presupuesto final con fallback
const getFinalBudget = (project: Project): number => {
  return project.presupuesto_final || 
         project.presupuesto_inicial || 
         project.presupuesto_original || 
         project.budget || 
         0;
};

// Función helper para obtener el presupuesto inicial con fallback
const getInitialBudget = (project: Project): number => {
  return project.presupuesto_original || 
         project.presupuesto_inicial || 
         project.budget || 
         0;
};

interface ReportData {
  project: Project;
  incomes: Income[];
  expenses: Expense[];
  changeOrders: ChangeOrder[];
  exchangeRate: number;
}

type ReportSection = 'incomes' | 'costos_directos' | 'costos_indirectos' | 'mano_obra' | 'imprevistos' | 'administracion' | 'summary';

interface DetailedProjectReportProps {
  projectId?: string;
}

// Componente para header de página
const PageHeader = ({ pageNumber, totalPages, projectName }: { pageNumber: number; totalPages: number; projectName: string }) => (
  <div className="flex items-center justify-between mb-6 pb-4 border-b-2" style={{ borderColor: '#2980b9' }}>
    <div className="flex items-center">
      <img 
        src="/images/summa/logo_2b.png" 
        alt="Summa Qualitas Logo" 
        className="w-24 h-12 mr-4 object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'w-20 h-10 bg-blue-600 rounded flex items-center justify-center mr-4';
          fallback.innerHTML = '<span class="text-white font-bold text-sm">SQ</span>';
          target.parentNode?.insertBefore(fallback, target);
        }}
      />
      <div className="ml-2">
        <h1 className="text-lg font-bold" style={{ color: '#34495e' }}>PROJECT EXECUTIVE REPORT</h1>
        <p className="text-sm text-gray-600">{projectName}</p>
      </div>
    </div>
    <div className="text-right">
      <h1 className="text-md font-bold" style={{ color: '#2980b9' }}>SUMMA QUALITAS</h1>
      <p className="text-xs" style={{ color: '#2980b9' }}>Corporate ID: 3-102-849290</p>
      <p className="text-xs text-gray-500 mt-1">Page {pageNumber} of {totalPages}</p>
    </div>
  </div>
);

// Interfaces para tipado TypeScript
interface PageHeaderProps {
  pageNumber: number;
  totalPages: number;
  projectName: string;
}

interface PageFooterProps {
  pageNumber: number;
  totalPages: number;
}

interface StandardPageProps {
  pageNumber: number;
  totalPages: number;
  projectName: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// Componente para footer de página
const PageFooter = ({ pageNumber, totalPages }: PageFooterProps) => (
  <div className="mt-8 pt-4 text-center text-xs text-gray-500 border-t">
    <p>Generated on {format(new Date(), 'MM/dd/yyyy HH:mm')}</p>
    <p>Page {pageNumber} of {totalPages}</p>
  </div>
);

// Componente base unificado para todas las páginas
const StandardPage = ({ pageNumber, totalPages, projectName, title, children, className = '' }: StandardPageProps) => (
  <div className={`pdf-page ${className}`}>
    <PageHeader pageNumber={pageNumber} totalPages={totalPages} projectName={projectName} />
    <div className="page-content">
      {title && (
        <div className="section-spacing">
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: '#2c3e50' }}>
            {title}
          </h2>
        </div>
      )}
      <div className="component-container">
        {children}
      </div>
    </div>
    <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
  </div>
);

// Función global para calcular el número total de páginas
const calculateTotalPages = (incomes: Income[], expenses: Expense[], changeOrders?: ChangeOrder[]) => {
  let pageCount = 0;
  
  // Verificar si hay datos para Change Orders e Income
  const hasChangeOrders = changeOrders && changeOrders.length > 0;
  const hasIncomes = incomes && incomes.length > 0;
  
  // Página para Change Orders (solo si hay datos)
  if (hasChangeOrders) {
    pageCount++;
  }
  
  // Página para Income (solo si hay datos)
  if (hasIncomes) {
    pageCount++;
  }
  
  // Define cost sections (using current database categories)
  const costSections = [
    { title: 'DIRECT COSTS', expenses: expenses.filter(e => e.category === 'costos_directos') },
    { title: 'INDIRECT COSTS', expenses: expenses.filter(e => e.category === 'costos_indirectos') },
    { title: 'LABOR', expenses: expenses.filter(e => e.category === 'mano_obra') },
    { title: 'CONTINGENCIES', expenses: expenses.filter(e => e.category === 'imprevistos') },
    { title: 'ADMINISTRATION', expenses: expenses.filter(e => e.category === 'administracion') }
  ];
  
  // Contar páginas para secciones de costos (cada sección con datos = 1 página)
  costSections.forEach(section => {
    if (section.expenses.length > 0) {
      pageCount++;
    }
  });
  
  pageCount++; // Página para resumen ejecutivo
  pageCount++; // Página para gráfico de gastos
  
  // Página para anexos (solo si hay adjuntos)
  if (incomes.some(income => income.receipt_url) || expenses.some(expense => expense.receipt_url)) {
    pageCount++;
  }
  
  return pageCount;
};

export function DetailedProjectReport({ projectId }: DetailedProjectReportProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [currentSection, setCurrentSection] = useState<ReportSection>('incomes');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(520); // Tipo de cambio por defecto
  const [tempExchangeRate, setTempExchangeRate] = useState<string>('520'); // Estado temporal para el input
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [dataCache, setDataCache] = useState<Map<string, { data: ReportData; timestamp: number }>>(new Map());
  
  // Configuración de caché (5 minutos)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Sincronizar el estado temporal con el estado principal
  useEffect(() => {
    setTempExchangeRate(exchangeRate.toString());
  }, [exchangeRate]);

  const sections = [
    { id: 'incomes' as ReportSection, name: 'Ingresos', icon: DollarSign },
    { id: 'costos_directos' as ReportSection, name: 'Costos Directos', icon: Building },
    { id: 'costos_indirectos' as ReportSection, name: 'Costos Indirectos', icon: Settings },
    { id: 'mano_obra' as ReportSection, name: 'Mano de Obra', icon: Users },
    { id: 'imprevistos' as ReportSection, name: 'Imprevistos', icon: AlertTriangle },
    { id: 'administracion' as ReportSection, name: 'Administración', icon: Package },
    { id: 'summary' as ReportSection, name: 'Resumen General', icon: TrendingUp }
  ];

  const fetchProjects = useCallback(async () => {
    try {
      const allProjects = await projectService.getAllProjects();
      setProjects(allProjects);
      if (!selectedProjectId && allProjects.length > 0) {
        setSelectedProjectId(allProjects[0].id);
      } else if (!selectedProjectId && allProjects.length === 0) {
        // Si no hay proyectos disponibles, intentar obtener project_ids desde ingresos
        try {
            // Usar cliente de Supabase directamente para obtener project_ids
            const supabase = createClient();
            const { data: incomes } = await supabase
              .from('incomes')
              .select('project_id')
              .not('project_id', 'is', null)
              .limit(1);
          
          if (incomes && incomes.length > 0) {
            const projectId = incomes[0].project_id;
            setSelectedProjectId(projectId);
            toast.info('Proyecto cargado desde datos de ingresos');
          }
        } catch (incomeError) {
          console.error('Error obteniendo project_ids desde ingresos:', incomeError);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar los proyectos');
    }
  }, [selectedProjectId, projectService]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchReportData();
    }
  }, [selectedProjectId, exchangeRate]);

  const fetchReportData = async () => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      setLoadingMessage('Verificando datos en caché...');
      
      // Verificar caché primero
      const cacheKey = `${selectedProjectId}-${exchangeRate}`;
      const cachedData = dataCache.get(cacheKey);
      const now = Date.now();
      
      if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
        setLoadingMessage('Cargando datos desde caché...');
        setReportData(cachedData.data);
        setLoading(false);
        setLoadingMessage('');
        return;
      }
      setLoadingMessage('Obteniendo datos del servidor...');
      
      // Ejecutar todas las consultas en paralelo para mejorar el rendimiento
      const [incomes, expenses, changeOrdersResponse] = await Promise.all([
        incomeService.getProjectIncomes(selectedProjectId),
        expenseService.getProjectExpenses(selectedProjectId),
        fetch(`/api/change-orders?project_id=${selectedProjectId}`)
      ]);
      
      // Log temporal para debuggear campos reference e invoice_number
      console.log('Debug - Primeros 3 gastos:', expenses.slice(0, 3).map(expense => ({
        id: expense.id,
        description: expense.description,
        reference: expense.reference,
        invoice_number: expense.invoice_number,
        supplier: expense.supplier?.name,
        category: expense.category
      })));
      
      // Log adicional para verificar categorías de todos los gastos
      console.log('Debug - Categorías de gastos:', expenses.map(expense => expense.category));
      console.log('Debug - Total de gastos:', expenses.length);
      
      // Log para verificar filtrado por categorías específicas
      const directCosts = expenses.filter(e => e.category === 'costos_directos');
      const indirectCosts = expenses.filter(e => e.category === 'costos_indirectos');
      console.log('Debug - Costos directos encontrados:', directCosts.length);
      console.log('Debug - Costos indirectos encontrados:', indirectCosts.length);
      


      // Intentar obtener datos del proyecto
      let project = projects.find(p => p.id === selectedProjectId);
      
      // Si no se puede obtener el proyecto (por políticas RLS), crear uno temporal
      if (!project) {
        console.warn('No se pudo cargar el proyecto, creando datos temporales...');
        
        // Intentar obtener información del cliente desde los ingresos
        let clientInfo = null;
        if (incomes.length > 0 && incomes[0].client) {
          clientInfo = incomes[0].client;
        }
        
        project = {
          id: selectedProjectId,
          name: `Proyecto ${selectedProjectId.substring(0, 8)}`,
          description: 'Proyecto cargado desde datos de transacciones',
          client_id: clientInfo?.id || '',
          client: clientInfo,
          status: 'active' as const,
          budget: 0,
          presupuesto_inicial: 0,
          costos_directos: 0,
          costos_indirectos: 0,
          administracion: 0,
          mano_obra: 0,
          imprevistos: 0,
          utilidad: 0,
          estimated_start_date: incomes.length > 0 ? incomes[0].received_date : new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        toast.info('Datos del proyecto cargados desde transacciones');
      }

      // Procesar respuesta de órdenes de cambio
      const changeOrdersData = changeOrdersResponse.ok ? await changeOrdersResponse.json() : [];
      
      // La API puede devolver { data: [...] } o directamente [...]
      const changeOrders = Array.isArray(changeOrdersData) ? changeOrdersData : (changeOrdersData.data || []);



      const newReportData = {
        project,
        incomes,
        expenses,
        changeOrders,
        exchangeRate: exchangeRate // Usar el tipo de cambio seleccionado por el usuario
      };
      
      setReportData(newReportData);
      
      // Guardar en caché
      const newCache = new Map(dataCache);
      newCache.set(cacheKey, {
        data: newReportData,
        timestamp: now
      });
      setDataCache(newCache);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Error al cargar los datos del reporte');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Función auxiliar para extraer enlaces de una página
  const extractLinksFromPage = (pageElement: HTMLElement, pageIndex: number) => {
    const links: Array<{href: string, text: string, x: number, y: number, width: number, height: number}> = [];
    const linkElements = pageElement.querySelectorAll('a[href]');
    
    linkElements.forEach((linkElement, linkIndex) => {
      // Obtener posición usando offsetTop y offsetLeft para coordenadas más precisas
      let element = linkElement as HTMLElement;
      let x = 0;
      let y = 0;
      
      // Calcular posición acumulativa hasta llegar al elemento de la página
      while (element && element !== pageElement) {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent as HTMLElement;
      }
      
      const rect = linkElement.getBoundingClientRect();
      const href = (linkElement as HTMLAnchorElement).href;
      const text = linkElement.textContent || '';
      
      
      
      links.push({
        href,
        text,
        x,
        y,
        width: rect.width,
        height: rect.height
      });
    });
    
    return links;
  };

  // Nueva función para exportar PDF con enlaces clickeables usando @react-pdf/renderer (solo anexos)
  const exportToPDFWithClickableLinks = async () => {
    if (!reportData) {
      toast.error('No data to export');
      return;
    }

    setIsExporting(true);
    
    try {
      // Crear el documento PDF usando @react-pdf/renderer (solo página de anexos)
      const pdfDocument = (
        <PDFAnnexesDocument 
          reportData={reportData}
          formatCurrency={formatCurrency}
          convertCurrency={convertCurrency}
        />
      );
      
      // Generar el blob del PDF
      const blob = await pdf(pdfDocument).toBlob();
      
      // Crear URL para descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `annexes-${reportData.project.name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      // Descargar el archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      URL.revokeObjectURL(url);
      
      toast.success('Annexes PDF generated successfully with clickable links');
    } catch (error) {
      console.error('Error generating annexes PDF with @react-pdf/renderer:', error);
      toast.error('Error generating annexes PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Nueva función combinada que genera reporte principal como imagen + anexos con enlaces
  const exportToCombinedPDF = async () => {
    if (!reportData) {
      toast.error('No data to export');
      return;
    }

    try {
      setIsExporting(true);
      
      // Abrir automáticamente la vista previa si no está abierta
      if (!showPreview) {
        toast.info('Opening preview...');
        setShowPreview(true);
        // Esperar un momento para que se renderice la vista previa
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      toast.info('Generating combined PDF...');

      // Obtener todas las páginas individuales
      let pageElements = document.querySelectorAll('.pdf-page');
      if (pageElements.length === 0) {
        toast.error('No pages found in preview. Retrying...');
        // Esperar un poco más y reintentar
        await new Promise(resolve => setTimeout(resolve, 1000));
        pageElements = document.querySelectorAll('.pdf-page');
        if (pageElements.length === 0) {
          toast.error('Could not load preview pages.');
          return;
        }
      }

      // Crear PDF con formato Letter optimizado
      const jsPdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter', // 215.9 x 279.4 mm
        compress: true,
        precision: 2
      });
      const pdfWidth = jsPdf.internal.pageSize.getWidth(); // 215.9mm
      const pdfHeight = jsPdf.internal.pageSize.getHeight(); // 279.4mm
      
      // Dimensiones exactas para formato Letter
      const availableWidth = pdfWidth;
      const availableHeight = pdfHeight;

      // Procesar solo las primeras 7 páginas (excluir anexos desde página 8)
      const maxPages = Math.min(pageElements.length, 7);
      for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
        const pageElement = pageElements[pageIndex] as HTMLElement;
        
        if (pageIndex > 0) {
          jsPdf.addPage('p', 'mm', 'letter');
        }

        try {
          // Extraer enlaces antes de generar la imagen
          const pageLinks = extractLinksFromPage(pageElement, pageIndex);
          
          // Asegurar que el elemento sea visible antes de capturar
          const originalDisplay = pageElement.style.display;
          const originalVisibility = pageElement.style.visibility;
          pageElement.style.display = 'block';
          pageElement.style.visibility = 'visible';
          
          // Esperar un momento para que el elemento se renderice
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Obtener las dimensiones completas del elemento incluyendo contenido scrolleable
          const elementRect = pageElement.getBoundingClientRect();
          const elementWidth = pageElement.scrollWidth || pageElement.offsetWidth || elementRect.width;
          const elementHeight = pageElement.scrollHeight || pageElement.offsetHeight || elementRect.height;
          
          // Capturar cada página individual con html2canvas usando dimensiones completas
          const canvas = await html2canvas(pageElement, {
            scale: 2, // Usar escala 2:1 para mejorar la calidad del texto
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            width: elementWidth, // Usar ancho completo incluyendo scroll
            height: elementHeight, // Usar alto completo incluyendo scroll
            scrollX: 0,
            scrollY: 0,
            logging: true, // Habilitar logging para debug
            removeContainer: false,
            foreignObjectRendering: false,
            imageTimeout: 15000,
            x: 0,
            y: 0,
             ignoreElements: (element) => {
              // Ignorar elementos que puedan causar problemas de renderizado
              return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
            },
            onclone: (clonedDoc) => {
              // Asegurar que los estilos se apliquen en el documento clonado
              const clonedElements = clonedDoc.querySelectorAll('.pdf-page');
              clonedElements.forEach((element) => {
                const htmlElement = element as HTMLElement;
                htmlElement.style.display = 'block';
                htmlElement.style.visibility = 'visible';
                htmlElement.style.backgroundColor = '#ffffff';
                // Forzar dimensiones completas para evitar cortes
                htmlElement.style.width = `${elementWidth}px`;
                htmlElement.style.height = `${elementHeight}px`;
                htmlElement.style.minHeight = `${elementHeight}px`;
                htmlElement.style.maxHeight = 'none';
                htmlElement.style.overflow = 'visible';
                // Forzar el padding en todos los elementos clonados
                htmlElement.style.padding = '10mm 10mm 10mm 10mm';
                htmlElement.style.boxSizing = 'border-box';
              });
              
              // Preservar todos los colores de texto y fondo
              const allElements = clonedDoc.querySelectorAll('*');
              allElements.forEach((element) => {
                const htmlElement = element as HTMLElement;
                const computedStyle = window.getComputedStyle(element);
                
                // Preservar colores de texto
                if (computedStyle.color && computedStyle.color !== 'rgba(0, 0, 0, 0)') {
                  htmlElement.style.color = computedStyle.color;
                }
                
                // Preservar colores de fondo
                if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                  htmlElement.style.backgroundColor = computedStyle.backgroundColor;
                }
                
                // Preservar bordes con colores
                if (computedStyle.borderColor && computedStyle.borderColor !== 'rgba(0, 0, 0, 0)') {
                  htmlElement.style.borderColor = computedStyle.borderColor;
                }
              });
              
              // Asegurar que los elementos SVG se rendericen correctamente
              const svgElements = clonedDoc.querySelectorAll('svg');
              svgElements.forEach((svg) => {
                const svgElement = svg as SVGElement;
                svgElement.style.display = 'block';
                svgElement.style.visibility = 'visible';
                // Asegurar que el SVG tenga dimensiones explícitas
                if (!svgElement.getAttribute('width')) {
                  svgElement.setAttribute('width', svgElement.getBoundingClientRect().width.toString());
                }
                if (!svgElement.getAttribute('height')) {
                  svgElement.setAttribute('height', svgElement.getBoundingClientRect().height.toString());
                }
              });
              
              // Asegurar que los elementos de texto SVG se rendericen
              const textElements = clonedDoc.querySelectorAll('svg text, svg tspan');
              textElements.forEach((text) => {
                const textElement = text as SVGTextElement;
                textElement.style.fontFamily = 'Arial, sans-serif';
                textElement.style.fontSize = textElement.style.fontSize || '12px';
              });
            }
          });
          
          // Restaurar estilos originales
          pageElement.style.display = originalDisplay;
          pageElement.style.visibility = originalVisibility;

          // Verificar que el canvas tenga contenido
          if (canvas.width === 0 || canvas.height === 0) {
            console.warn(`Página ${pageIndex + 1}: Canvas vacío (${canvas.width}x${canvas.height})`);
            toast.warning(`Página ${pageIndex + 1} parece estar vacía`);
            continue;
          }
          
          const imgData = canvas.toDataURL('image/png'); // PNG para preservar colores y transparencia
          
          // Verificar que la imagen tenga datos
          if (!imgData || imgData === 'data:,') {
            console.warn(`Página ${pageIndex + 1}: No se pudo generar imagen`);
            toast.warning(`No se pudo capturar la página ${pageIndex + 1}`);
            continue;
          }
          
          // Calcular dimensiones exactas para formato Letter
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          // Dimensiones Letter en mm: 215.9 x 279.4
          const letterWidthMm = 215.9;
          const letterHeightMm = 279.4;
          
          // Márgenes mínimos en mm (optimizados para máximo aprovechamiento del espacio)
          const marginMm = 7; // Márgenes laterales de 7mm para aprovechar al máximo el espacio
          const usableWidthMm = letterWidthMm - (marginMm * 2);
          const usableHeightMm = letterHeightMm - (marginMm * 2);
          
          // Factor de conversión de píxeles a mm (ajustado para escala 2:1)
          const pxToMm = 0.175; // Reducido a la mitad para compensar scale: 2
          
          // Calcular dimensiones de la imagen en mm
          const imgWidthMm = imgWidth * pxToMm;
          const imgHeightMm = imgHeight * pxToMm;
          
          // Calcular escala para usar todo el ancho disponible
          const scaleToFitWidth = usableWidthMm / imgWidthMm;
          const scaleToFitHeight = usableHeightMm / imgHeightMm;
          const finalScale = scaleToFitWidth; // Usar todo el ancho disponible
          
          // Dimensiones finales escaladas
          const scaledWidth = usableWidthMm; // Usar todo el ancho disponible
          const scaledHeight = imgHeightMm * finalScale;
          
          // Posicionar en la página usando todo el ancho
          const imgX = marginMm; // Alineado al margen izquierdo
          const imgY = marginMm; // Alineado al margen superior

          jsPdf.addImage(
            imgData,
            'PNG',
            imgX,
            imgY,
            scaledWidth,
            scaledHeight,
            undefined,
            'FAST' // Compresión rápida
          );

          // Agregar enlaces clickeables sobre la imagen
          const scaleFactorX = scaledWidth / imgWidthMm;
          const scaleFactorY = scaledHeight / imgHeightMm;
          
          pageLinks.forEach((link, linkIndex) => {
            // Convertir coordenadas de píxeles a mm y escalar
            const linkX = (link.x * pxToMm * scaleFactorX) + imgX;
            const linkY = (link.y * pxToMm * scaleFactorY) + imgY;
            const linkWidth = link.width * pxToMm * scaleFactorX;
            const linkHeight = link.height * pxToMm * scaleFactorY;
            

            
            // Agregar enlace clickeable usando jsPDF con validación
            try {
              if (linkX >= 0 && linkY >= 0 && linkWidth > 0 && linkHeight > 0) {
                jsPdf.link(linkX, linkY, linkWidth, linkHeight, { url: link.href });

              } else {

              }
            } catch (linkError) {

            }
          });

        } catch (pageError) {
          console.error(`Error procesando página ${pageIndex + 1}:`, pageError);
          // Continuar con la siguiente página en caso de error
        }
      }

      // Generar anexos usando @react-pdf/renderer
      toast.info('Generando anexos con enlaces clickeables...');
      const annexBlob = await pdf((
        <PDFAnnexesDocument 
          reportData={reportData}
          convertCurrency={convertCurrency}
          formatCurrency={formatCurrency}
        />
      )).toBlob();

      // Combinar PDFs usando pdf-lib
      const { PDFDocument } = await import('pdf-lib');
      const combinedPdf = await PDFDocument.create();
      
      // Agregar páginas del reporte principal (imagen)
      const mainPdfBytes = jsPdf.output('arraybuffer');
      const mainPdfDoc = await PDFDocument.load(mainPdfBytes);
      const mainPages = await combinedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
      mainPages.forEach((page) => combinedPdf.addPage(page));
      
      // Agregar páginas de los anexos (con enlaces)
      const annexArrayBuffer = await annexBlob.arrayBuffer();
      const annexPdfDoc = await PDFDocument.load(annexArrayBuffer);
      const annexPages = await combinedPdf.copyPages(annexPdfDoc, annexPdfDoc.getPageIndices());
      annexPages.forEach((page) => combinedPdf.addPage(page));
      
      // Generar PDF final combinado
      const combinedPdfBytes = await combinedPdf.save();
      const combinedBlob = new Blob([combinedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(combinedBlob);
      
      // Descargar PDF combinado
      const fileName = `reporte_completo_${reportData.project.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const totalPages = maxPages + annexPdfDoc.getPageCount();
      toast.success(`PDF completo generado: ${maxPages} páginas principales (imágenes) + ${annexPdfDoc.getPageCount()} páginas de anexos (enlaces clickeables)`);
    } catch (error) {
      console.error('Error generating combined PDF:', error);
      toast.error('Error al generar el PDF completo');
    } finally {
      setIsExporting(false);
    }
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'USD' && toCurrency === 'CRC') {
      return amount * exchangeRate;
    } else if (fromCurrency === 'CRC' && toCurrency === 'USD') {
      return amount / exchangeRate;
    }
    
    return amount;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
    // Formato con CRC para evitar problemas de símbolos
    const formattedNumber = new Intl.NumberFormat('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return `CRC ${formattedNumber}`;
  };

  const getCurrentSectionIndex = () => {
    return sections.findIndex(section => section.id === currentSection);
  };

  const goToPreviousSection = () => {
    const currentIndex = getCurrentSectionIndex();
    if (currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1].id);
    }
  };

  const goToNextSection = () => {
    const currentIndex = getCurrentSectionIndex();
    if (currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1].id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loadingMessage || 'Cargando datos del reporte...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Reporte */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Reporte Detallado de Proyecto</CardTitle>
              <CardDescription>
                Análisis completo de ingresos, costos y resumen financiero
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-700">Proyecto</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-700">Exchange Rate (USD)</label>
                <input
                  type="number"
                  placeholder="Ingrese el tipo de cambio"
                  value={tempExchangeRate}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-40"
                  min="1"
                  step="0.01"
                  onChange={(e) => {
                    setTempExchangeRate(e.target.value);
                  }}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (value > 0) {
                      setExchangeRate(value);
                      setTempExchangeRate(value.toString());
                    } else {
                      // Si el valor no es válido, restaurar el valor anterior
                      setTempExchangeRate(exchangeRate.toString());
                    }
                  }}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToCombinedPDF}
                  disabled={isExporting || !reportData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Generating...' : 'Export Complete PDF'}
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={exportToPDFWithClickableLinks}
                  disabled={isExporting || !reportData}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Generating...' : 'Export Annexes'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={!reportData}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Ocultar Vista Previa' : 'Vista Previa PDF'}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {reportData && (
        <>
          {/* Información del Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                {reportData.project.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-sm">{reportData.project.description || 'No description'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Final Budget</p>
                  <p className="text-sm font-semibold">
                    {formatCurrency(getFinalBudget(reportData.project), 'CRC')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Generation Date</p>
                  <p className="text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navegación de Secciones */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousSection}
                  disabled={getCurrentSectionIndex() === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                
                <div className="flex space-x-2">
                  {sections.map((section, index) => {
                    const Icon = section.icon;
                    return (
                      <Button
                        key={section.id}
                        variant={currentSection === section.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentSection(section.id)}
                        className="flex items-center"
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        {section.name}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextSection}
                  disabled={getCurrentSectionIndex() === sections.length - 1}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contenido de la Sección Actual */}
          <div className="min-h-[600px]">
            {currentSection === 'incomes' && (
              <IncomeReportSection 
                reportData={reportData} 
                convertCurrency={convertCurrency}
                formatCurrency={formatCurrency}
              />
            )}
            {currentSection === 'costos_directos' && (
              <div>
                <CostReportSection 
                  title="Costos Directos"
                  expenses={reportData.expenses.filter(e => e.category === 'costos_directos')}
                  convertCurrency={convertCurrency}
                  formatCurrency={formatCurrency}
                />
                {/* Debug temporal - mostrar información de gastos */}
                <Card className="mt-4 bg-yellow-50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-yellow-800">Debug Info - Costos Directos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs space-y-2">
                      <p><strong>Total gastos cargados:</strong> {reportData.expenses.length}</p>
                      <p><strong>Gastos con categoría 'costos_directos':</strong> {reportData.expenses.filter(e => e.category === 'costos_directos').length}</p>
                      <p><strong>Categorías encontradas:</strong> {[...new Set(reportData.expenses.map(e => e.category))].join(', ')}</p>
                      <p><strong>Primeros 3 gastos con reference/invoice:</strong></p>
                      <ul className="ml-4">
                        {reportData.expenses.slice(0, 3).map((expense, i) => (
                          <li key={i}>
                            {expense.description} - Cat: {expense.category} - Ref: {expense.reference || 'N/A'} - Invoice: {expense.invoice_number || 'N/A'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {currentSection === 'costos_indirectos' && (
              <div>
                <CostReportSection 
                  title="Costos Indirectos"
                  expenses={reportData.expenses.filter(e => e.category === 'costos_indirectos')}
                  convertCurrency={convertCurrency}
                  formatCurrency={formatCurrency}
                />
                {/* Debug temporal - mostrar información de gastos */}
                <Card className="mt-4 bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-blue-800">Debug Info - Costos Indirectos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs space-y-2">
                      <p><strong>Total gastos cargados:</strong> {reportData.expenses.length}</p>
                      <p><strong>Gastos con categoría 'costos_indirectos':</strong> {reportData.expenses.filter(e => e.category === 'costos_indirectos').length}</p>
                      <p><strong>Categorías encontradas:</strong> {[...new Set(reportData.expenses.map(e => e.category))].join(', ')}</p>
                      <p><strong>Gastos con reference o invoice_number:</strong></p>
                      <ul className="ml-4">
                        {reportData.expenses.filter(e => e.reference || e.invoice_number).slice(0, 5).map((expense, i) => (
                          <li key={i}>
                            {expense.description} - Cat: {expense.category} - Ref: {expense.reference || 'N/A'} - Invoice: {expense.invoice_number || 'N/A'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {currentSection === 'mano_obra' && (
              <CostReportSection 
                title="Mano de Obra"
                expenses={reportData.expenses.filter(e => e.category === 'mano_obra')}
                convertCurrency={convertCurrency}
                formatCurrency={formatCurrency}
              />
            )}
            {currentSection === 'imprevistos' && (
              <CostReportSection 
                title="Imprevistos"
                expenses={reportData.expenses.filter(e => e.category === 'imprevistos')}
                convertCurrency={convertCurrency}
                formatCurrency={formatCurrency}
              />
            )}
            {currentSection === 'administracion' && (
              <CostReportSection 
                title="Administración"
                expenses={reportData.expenses.filter(e => e.category === 'administracion')}
                convertCurrency={convertCurrency}
                formatCurrency={formatCurrency}
              />
            )}
            {currentSection === 'summary' && (
              <SummaryReportSection 
                reportData={reportData}
                convertCurrency={convertCurrency}
                formatCurrency={formatCurrency}
              />
            )}
          </div>
        </>
      )}
      
      {/* PDF Preview */}
      {showPreview && reportData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                PDF Preview
              </div>

            </CardTitle>
            <CardDescription>
              This is a representation of how the PDF will look when generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PDFPreview 
              reportData={reportData}
              convertCurrency={convertCurrency}
              formatCurrency={formatCurrency}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente para la vista previa del PDF
interface PDFPreviewProps {
  reportData: ReportData;
  convertCurrency: (amount: number, from: string, to: string) => number;
  formatCurrency: (amount: number, currency: string) => string;
}

function PDFPreview({ reportData, convertCurrency, formatCurrency }: PDFPreviewProps) {
  const { project, incomes, expenses, changeOrders, exchangeRate } = reportData;

  // Calcular totales en ambas monedas
  const totalIncomesCRC = incomes.reduce((sum, income) => {
    const amount = convertCurrency(income.amount, income.currency, 'CRC');
    return sum + amount;
  }, 0);

  const totalIncomesUSD = incomes.reduce((sum, income) => {
    const amount = convertCurrency(income.amount, income.currency, 'USD');
    return sum + amount;
  }, 0);

  const totalExpensesCRC = expenses.reduce((sum, expense) => {
    const amount = convertCurrency(expense.amount, expense.currency, 'CRC');
    return sum + amount;
  }, 0);

  const totalExpensesUSD = expenses.reduce((sum, expense) => {
    const amount = convertCurrency(expense.amount, expense.currency, 'USD');
    return sum + amount;
  }, 0);

  const netProfitCRC = totalIncomesCRC - totalExpensesCRC;
  const netProfitUSD = totalIncomesUSD - totalExpensesUSD;
  const profitMarginCRC = totalIncomesCRC > 0 ? (netProfitCRC / totalIncomesCRC) * 100 : 0;
  const profitMarginUSD = totalIncomesUSD > 0 ? (netProfitUSD / totalIncomesUSD) * 100 : 0;

  // Cost sections as in the PDF
  const costSections = [
    { title: 'DIRECT COSTS', expenses: expenses.filter(e => e.category === 'costos_directos') },
    { title: 'INDIRECT COSTS', expenses: expenses.filter(e => e.category === 'costos_indirectos') },
    { title: 'LABOR', expenses: expenses.filter(e => e.category === 'mano_obra') },
    { title: 'CONTINGENCIES', expenses: expenses.filter(e => e.category === 'imprevistos') },
    { title: 'ADMINISTRATION', expenses: expenses.filter(e => e.category === 'administracion') }
  ];

  // Determinar qué páginas mostrar basado en los datos disponibles
  const hasChangeOrders = changeOrders && changeOrders.length > 0;
  const hasIncomes = incomes && incomes.length > 0;
  const costSectionsWithData = costSections.filter(section => section.expenses.length > 0);

  // Calcular el total de páginas dinámicamente
  let totalPages = 0;
  if (hasChangeOrders) totalPages++; // Página de Change Orders
  if (hasIncomes) totalPages++; // Página de Income
  totalPages += costSectionsWithData.length; // Páginas de costos con datos
  totalPages += 2; // Página de gráfico y resumen final

  // Contador de página actual
  let currentPageNumber = 1;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: letter;
              margin: 15mm 20mm;
            }
            .pdf-page {
            page-break-after: always;
            break-after: page;
          }
          .pdf-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
            orphans: 3;
            widows: 3;
          }
          .table-container {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
          .chart-container {
            page-break-after: always;
            break-after: page;
          }
          .annexes-container {
          page-break-before: always;
          break-before: page;
          width: 8.5in !important;
          max-width: 8.5in !important;
          margin: 0 auto 2rem auto !important;
        }
        .annexes-container .table-container {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: auto !important;
        }
        .annexes-container table {
          width: 100% !important;
          max-width: 100% !important;
        }
          h2 {
            page-break-after: avoid;
            break-after: avoid;
          }
          table {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          a[href] {
            color: #2563eb !important;
            text-decoration: underline !important;
            font-weight: 500 !important;
            cursor: pointer !important;
          }
          
          /* Estilos específicos para enlaces en anexos */
          .annexes-container a[href] {
            color: #1d4ed8 !important;
            text-decoration: underline !important;
            font-weight: 600 !important;
            word-break: break-word !important;
            display: inline-block !important;
          }
          
          .annexes-container a[href]:hover {
            color: #1e40af !important;
            text-decoration: underline !important;
          }
        }
        
        /* Estilos unificados para todas las páginas - Formato Letter optimizado */
        .pdf-page {
          width: 8.5in !important;
          min-height: 14in !important; /* Aumentar significativamente la altura para evitar cortes */
          max-width: 8.5in !important;
          margin: 0 auto 1rem auto !important;
          padding: 10mm 10mm 10mm 10mm !important; /* Margenes uniformes de 10mm para maximizar espacio */
          background: white;
          border: 1px solid #ddd;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          overflow: visible;
          box-sizing: border-box;
          position: relative;
        }
        
        .pdf-page.chart-container {
          padding: 10mm 10mm 10mm 10mm !important;
          min-height: 14in !important; /* Asegurar altura consistente y amplia */
        }
        
        .page-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          overflow: visible;
          justify-content: flex-start;
          align-items: stretch;
        }
        
        .section-spacing {
          margin-bottom: 1.5rem;
        }
        
        .component-container {
          width: 100% !important;
          max-width: 100% !important;
          overflow: visible; /* Cambiar a visible para evitar corte de contenido */
          flex: 1; /* Permitir que se expanda para usar todo el espacio disponible */
        }
        
        .table-container {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: auto;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .letter-section {
          margin-bottom: 2rem;
          width: 100%;
        }
        
        .table-section {
          margin-bottom: 1.5rem;
          width: 100%;
        }
        
        table {
          width: 100% !important;
          max-width: 100% !important;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Estilos específicos para anexos */
        .annexes-container {
          page-break-before: always;
          break-before: page;
        }
        
        /* Espaciado entre secciones para Letter - reducido */
        .letter-section {
          margin-bottom: 1.5rem;
        }
        
        /* Espaciado compacto para tablas */
        .table-section {
          margin-bottom: 1rem;
        }
        
        /* Estilos específicos para impresión - Formato Letter optimizado */
        @media print {
          @page {
            size: letter; /* 8.5in x 11in */
            margin: 0.75in 0.75in 0.5in 0.75in; /* Top, Right, Bottom, Left */
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .pdf-page {
            page-break-after: always;
            page-break-inside: avoid;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none;
            border: none;
            width: 100% !important;
            height: 100% !important;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          
          .pdf-page:last-child {
            page-break-after: auto;
          }
          
          .page-content {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
        }
        `
      }} />
      <div id="pdf-preview-content" className="bg-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        {/* Change Orders & Final Budget Page - Only if there's data */}
        {hasChangeOrders && (
          <StandardPage 
            pageNumber={currentPageNumber++} 
            totalPages={totalPages} 
            projectName={project.name}
            title="CHANGE ORDERS & FINAL BUDGET"
          >
        <div className="letter-section">
          {/* Budget Information */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#2980b9' }}>BUDGET SUMMARY</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-600">Initial Budget</div>
                <div className="text-xl font-bold" style={{ color: '#2980b9' }}>
                  {formatCurrency(getInitialBudget(project), 'CRC')}
                </div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(convertCurrency(getInitialBudget(project), 'CRC', 'USD'), 'USD')}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-600">Final Budget</div>
                <div className="text-xl font-bold" style={{ color: getFinalBudget(project) !== getInitialBudget(project) ? '#e74c3c' : '#2980b9' }}>
                  {formatCurrency(getFinalBudget(project), 'CRC')}
                </div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(convertCurrency(getFinalBudget(project), 'CRC', 'USD'), 'USD')}
                </div>
              </div>
            </div>
            {getFinalBudget(project) !== getInitialBudget(project) && (
              <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-400">
                <div className="text-sm text-gray-600">Budget Variation</div>
                <div className="text-lg font-bold" style={{ color: (getFinalBudget(project) - getInitialBudget(project)) >= 0 ? '#e74c3c' : '#27ae60' }}>
                  {(getFinalBudget(project) - getInitialBudget(project)) >= 0 ? '+' : ''}
                  {formatCurrency(getFinalBudget(project) - getInitialBudget(project), 'CRC')}
                </div>
                <div className="text-sm text-gray-500">
                  {(getFinalBudget(project) - getInitialBudget(project)) >= 0 ? '+' : ''}
                  {formatCurrency(convertCurrency(getFinalBudget(project) - getInitialBudget(project), 'CRC', 'USD'), 'USD')}
                </div>
              </div>
            )}
          </div>

          {/* Change Orders Table */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#2980b9' }}>CHANGE ORDERS</h3>
            {changeOrders && changeOrders.length > 0 ? (
              <div className="table-container">
                <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#2980b9', color: 'white' }}>
                      <th className="p-2 text-left font-bold">#</th>
                      <th className="p-2 text-left font-bold">Document</th>
                      <th className="p-2 text-left font-bold">Title</th>
                      <th className="p-2 text-left font-bold">Type</th>
                      <th className="p-2 text-left font-bold">Impact</th>
                      <th className="p-2 text-left font-bold">Amount (CRC)</th>
                      <th className="p-2 text-left font-bold">Amount (USD)</th>
                      <th className="p-2 text-left font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changeOrders.map((changeOrder, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ecf0f1' : 'white' }}>
                        <td className="p-2" style={{ color: '#000000' }}>{index + 1}</td>
                        <td className="p-2" style={{ color: '#000000' }}>{changeOrder.document_number}</td>
                        <td className="p-2" style={{ color: '#000000' }}>{changeOrder.title.length > 20 ? changeOrder.title.substring(0, 17) + '...' : changeOrder.title}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            changeOrder.change_type === 'extras' ? 'bg-blue-100 text-blue-800' :
                            changeOrder.change_type === 'accion_correctiva' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {changeOrder.change_type === 'extras' ? 'Extra' :
                             changeOrder.change_type === 'accion_correctiva' ? 'Corrective' : 'Preventive'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            changeOrder.impact_type === 'positivo' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {changeOrder.impact_type === 'positivo' ? '+' : '-'}
                          </span>
                        </td>
                        <td className="p-2" style={{ color: changeOrder.impact_type === 'positivo' ? '#e74c3c' : '#27ae60' }}>
                          {changeOrder.impact_type === 'positivo' ? '+' : '-'}
                          {formatCurrency(changeOrder.cost_impact_crc || 0, 'CRC')}
                        </td>
                        <td className="p-2" style={{ color: changeOrder.impact_type === 'positivo' ? '#e74c3c' : '#27ae60' }}>
                          {changeOrder.impact_type === 'positivo' ? '+' : '-'}
                          {formatCurrency(convertCurrency(changeOrder.cost_impact_crc || 0, 'CRC', 'USD'), 'USD')}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            changeOrder.status === 'approved' ? 'bg-green-100 text-green-800' :
                            changeOrder.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {changeOrder.status === 'approved' ? 'Approved' :
                             changeOrder.status === 'pending_approval' ? 'Pending' : 'Rejected'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {changeOrders.length > 0 && (
                      <tr style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #2980b9' }}>
                        <td className="p-2 font-bold" colSpan={5} style={{ textAlign: 'right', color: '#000000' }}>TOTAL IMPACT:</td>
                        <td className="p-2 font-bold" style={{ color: '#2980b9' }}>
                          {formatCurrency(
                            changeOrders
                              .filter(co => co.status === 'approved')
                              .reduce((sum, co) => {
                                const impact = co.cost_impact_crc || 0;
                                return sum + (co.impact_type === 'positivo' ? impact : -impact);
                              }, 0),
                            'CRC'
                          )}
                        </td>
                        <td className="p-2 font-bold" style={{ color: '#2980b9' }}>
                          {formatCurrency(
                            convertCurrency(
                              changeOrders
                                .filter(co => co.status === 'approved')
                                .reduce((sum, co) => {
                                  const impact = co.cost_impact_crc || 0;
                                  return sum + (co.impact_type === 'positivo' ? impact : -impact);
                                }, 0),
                              'CRC',
                              'USD'
                            ),
                            'USD'
                          )}
                        </td>
                        <td className="p-2"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Change Orders Found</h4>
                <p className="text-gray-500 mb-4">This project doesn't have any change orders yet.</p>
                <p className="text-sm text-blue-600">Create a change order to track budget modifications and project variations.</p>
              </div>
            )}
          </div>
        </div>
      </StandardPage>
        )}

      {/* Project Income Page - Only if there's data */}
      {hasIncomes && (
        <StandardPage 
          pageNumber={currentPageNumber++} 
          totalPages={totalPages} 
          projectName={project.name}
          title="PROJECT INCOME"
        >
        <div className="table-section">
          {incomes.length === 0 ? (
            <p className="text-gray-500 italic text-sm text-center">No data available</p>
          ) : (
            <div className="table-container">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2980b9', color: 'white' }}>
                    <th className="p-2 text-left font-bold">#</th>
                    <th className="p-2 text-left font-bold">Date</th>
                <th className="p-2 text-left font-bold">Description</th>
                    <th className="p-2 text-left font-bold">Amount (CRC)</th>
                    <th className="p-2 text-left font-bold">Amount (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((income, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ecf0f1' : 'white' }}>
                      <td className="p-2" style={{ color: '#000000' }}>{index + 1}</td>
                      <td className="p-2" style={{ color: '#000000' }}>{format(new Date(income.received_date), 'dd/MM/yyyy')}</td>
                      <td className="p-2" style={{ color: '#000000' }}>{income.description.length > 25 ? income.description.substring(0, 22) + '...' : income.description}</td>
                      <td className="p-2" style={{ color: '#000000' }}>{formatCurrency(income.amount, income.currency)}</td>
                      <td className="p-2" style={{ color: '#000000' }}>{formatCurrency(convertCurrency(income.amount, income.currency, 'USD'), 'USD')}</td>
                    </tr>
                  ))}
                  {incomes.length > 0 && (
                    <tr style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #2980b9' }}>
                      <td className="p-2 font-bold" colSpan={3} style={{ textAlign: 'right', color: '#000000' }}>TOTAL:</td>
                      <td className="p-2 font-bold" style={{ color: '#27ae60' }}>{formatCurrency(totalIncomesCRC, 'CRC')}</td>
                      <td className="p-2 font-bold" style={{ color: '#27ae60' }}>{formatCurrency(totalIncomesUSD, 'USD')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </StandardPage>
      )}

      {/* Páginas de Secciones de Costos (una por página) - Solo las que tienen datos */}
      {costSections.map((section, sectionIndex) => {
        if (section.expenses.length === 0) return null;
        
        // Calcular el número de página correcto basado en las secciones anteriores
        const sectionsWithData = costSections.slice(0, sectionIndex).filter(s => s.expenses.length > 0);
        const currentPageNumber = 2 + sectionsWithData.length;
        
        return (
          <StandardPage 
            key={section.title}
            pageNumber={currentPageNumber} 
            totalPages={calculateTotalPages(incomes, expenses, changeOrders)} 
            projectName={project.name}
            title={section.title}
          >
            <div className="table-section">
              {section.expenses.length === 0 ? (
                <p className="text-gray-500 italic text-sm text-center">No hay datos disponibles</p>
              ) : (
                <div className="table-container">
                  <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#2980b9', color: 'white' }}>
                        <th className="p-2 text-left font-bold">#</th>
                        <th className="p-2 text-left font-bold">Date</th>
                        {section.title === 'DIRECT COSTS' && (
                          <th className="p-2 text-left font-bold">Supplier</th>
                        )}
                        <th className="p-2 text-left font-bold">Description</th>
                        {(section.title === 'DIRECT COSTS' || section.title === 'INDIRECT COSTS') && (
                          <th className="p-2 text-left font-bold">Reference</th>
                        )}
                        <th className="p-2 text-left font-bold">Amount (CRC)</th>
                        <th className="p-2 text-left font-bold">Amount (USD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.expenses.map((expense, index) => (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ecf0f1' : 'white' }}>
                          <td className="p-2" style={{ color: '#000000' }}>{index + 1}</td>
                          <td className="p-2" style={{ color: '#000000' }}>{format(new Date(expense.expense_date), 'dd/MM/yyyy')}</td>
                          {section.title === 'DIRECT COSTS' && (
                            <td className="p-2" style={{ color: '#000000' }}>{expense.supplier?.name || '-'}</td>
                          )}
                          <td className="p-2" style={{ color: '#000000' }}>{expense.description?.length > 25 ? expense.description.substring(0, 22) + '...' : (expense.description || 'No description')}</td>
                          {(section.title === 'DIRECT COSTS' || section.title === 'INDIRECT COSTS') && (
                            <td className="p-2" style={{ color: '#000000' }}>
                              {expense.reference || expense.invoice_number || '-'}
                            </td>
                          )}
                          <td className="p-2" style={{ color: '#000000' }}>{formatCurrency(expense.amount, expense.currency)}</td>
                          <td className="p-2" style={{ color: '#000000' }}>{formatCurrency(convertCurrency(expense.amount, expense.currency, 'USD'), 'USD')}</td>
                        </tr>
                      ))}
                      {section.expenses.length > 0 && (() => {
                        const sectionTotalCRC = section.expenses.reduce((sum, expense) => {
                          return sum + convertCurrency(expense.amount, expense.currency, 'CRC');
                        }, 0);
                        const sectionTotalUSD = section.expenses.reduce((sum, expense) => {
                          return sum + convertCurrency(expense.amount, expense.currency, 'USD');
                        }, 0);
                        const colSpan = section.title === 'DIRECT COSTS' ? 5 : 
                                       (section.title === 'INDIRECT COSTS' ? 4 : 3);
                        
                        return (
                          <tr style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #2980b9' }}>
                            <td className="p-2 font-bold" colSpan={colSpan} style={{ textAlign: 'right', color: '#000000' }}>TOTAL:</td>
                            <td className="p-2 font-bold" style={{ color: '#e74c3c' }}>{formatCurrency(sectionTotalCRC, 'CRC')}</td>
                            <td className="p-2 font-bold" style={{ color: '#e74c3c' }}>{formatCurrency(sectionTotalUSD, 'USD')}</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </StandardPage>
        );
      })}

      {/* Página N: Resumen Ejecutivo */}
      <StandardPage 
        pageNumber={1 + costSections.filter(s => s.expenses.length > 0).length + 1} 
        totalPages={calculateTotalPages(incomes, expenses, changeOrders)} 
        projectName={project.name}
        title="EXECUTIVE SUMMARY"
      >
        <div className="letter-section flex justify-center">
          <div className="p-6 rounded max-w-2xl w-full" style={{ backgroundColor: '#ecf0f1' }}>
            <div className="grid grid-cols-1 gap-3 text-base">
              <div className="flex justify-between">
                <span className="font-bold" style={{ color: '#000000' }}>Total Income:</span>
                <div className="text-right">
                  <div className="text-sm text-gray-500">USD</div>
                  <div className="font-bold text-xl" style={{ color: '#2980b9' }}>{formatCurrency(totalIncomesUSD, 'USD')}</div>
                </div>
              </div>
              
              {/* Desglose de gastos por categoría */}
              <div className="border-t pt-2 mt-2">
                <span className="font-bold text-gray-700" style={{ color: '#000000' }}>Expenses by Category:</span>
              </div>
              {costSections.map((section) => {
                const categoryTotal = section.expenses.reduce((sum, expense) => {
                  return sum + convertCurrency(expense.amount, expense.currency, 'CRC');
                }, 0);
                const categoryTotalUSD = section.expenses.reduce((sum, expense) => {
                  return sum + convertCurrency(expense.amount, expense.currency, 'USD');
                }, 0);
                
                if (categoryTotal === 0) return null;
                
                return (
                  <div key={section.title} className="flex justify-between pl-4">
                    <span className="text-gray-600" style={{ color: '#000000' }}>{section.title}:</span>
                    <div className="text-right">
                      <div className="font-medium text-lg" style={{ color: '#e74c3c' }}>{formatCurrency(categoryTotalUSD, 'USD')}</div>
                    </div>
                  </div>
                );
              })}
              
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-bold" style={{ color: '#000000' }}>Total Expenses:</span>
                <div className="text-right">
                  <div className="font-bold text-xl" style={{ color: '#e74c3c' }}>{formatCurrency(totalExpensesUSD, 'USD')}</div>
                </div>
              </div>
              

              
              {/* Separador para información del presupuesto */}
              <div className="border-t pt-2 mt-2">
                <span className="font-bold text-gray-700" style={{ color: '#000000' }}>Budget Information:</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-bold" style={{ color: '#000000' }}>Total Budget (Final):</span>
                <div className="text-right">
                  <div className="font-bold text-xl" style={{ color: '#2980b9' }}>
                    {formatCurrency(convertCurrency(getFinalBudget(project), 'CRC', 'USD'), 'USD')}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="font-bold" style={{ color: '#000000' }}>Amount Paid (Income):</span>
                <div className="text-right">
                  <div className="font-bold text-xl" style={{ color: '#27ae60' }}>
                    {formatCurrency(totalIncomesUSD, 'USD')}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="font-bold" style={{ color: '#000000' }}>Remaining to Pay:</span>
                <div className="text-right">
                  <div className="font-bold text-xl" style={{ color: convertCurrency(getFinalBudget(project), 'CRC', 'USD') - totalIncomesUSD >= 0 ? '#e74c3c' : '#27ae60' }}>
                    {formatCurrency(convertCurrency(getFinalBudget(project), 'CRC', 'USD') - totalIncomesUSD, 'USD')}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="font-bold" style={{ color: '#000000' }}>% Paid of Final Budget:</span>
                <div className="text-right">
                  <div className="font-bold text-xl" style={{ color: '#2980b9' }}>
                    {((convertCurrency(getFinalBudget(project), 'CRC', 'USD')) > 0 ? (totalIncomesUSD / (convertCurrency(getFinalBudget(project), 'CRC', 'USD') || 1)) * 100 : 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StandardPage>

      {/* Página N+1: Gráfico de Gastos */}
      <StandardPage 
        pageNumber={1 + costSections.filter(s => s.expenses.length > 0).length + 2} 
        totalPages={calculateTotalPages(incomes, expenses, changeOrders)} 
        projectName={project.name}
        title="EXPENSE ANALYSIS BY CATEGORY"
        className="chart-container"
      >
        <div className="letter-section">
          <ExpenseChartHTML 
            costSections={costSections}
            convertCurrency={convertCurrency}
            formatCurrency={formatCurrency}
            incomes={incomes}
            expenses={expenses}
            project={project}
          />
        </div>
      </StandardPage>


    </div>
    </>
  );
}

// Componente para el gráfico de gastos
interface ExpenseChartProps {
  costSections: { title: string; expenses: Expense[] }[];
  convertCurrency: (amount: number, from: string, to: string) => number;
  formatCurrency: (amount: number, currency: string) => string;
  incomes: Income[];
  expenses: Expense[];
  project: Project;
}

function ExpenseChart({ costSections, convertCurrency, formatCurrency, incomes, expenses, project }: ExpenseChartProps) {
  // Calcular totales por categoría en USD
  const chartData = costSections.map(section => {
    const total = section.expenses.reduce((sum, expense) => {
      return sum + convertCurrency(expense.amount, expense.currency, 'USD');
    }, 0);
    return {
      title: section.title,
      amount: total,
      shortTitle: section.title.replace('COSTOS ', '').replace('GASTOS ', '').replace('DIRECTOS', 'DIRECTOS').replace('INDIRECTOS', 'INDIRECTOS').replace('ADMINISTRATIVOS', 'ADMIN.').replace('IMPREVISTOS', 'IMPREVISTOS')
    };
  }).filter(item => item.amount > 0);

  const maxAmount = Math.max(...chartData.map(item => item.amount));
  const chartHeight = 300;
  const chartWidth = 500;
  const leftMargin = 100;
  const bottomMargin = 60; // Reduced since labels are now inside bars
  const topMargin = 100;
  const rightMargin = 60;
  
  // Calcular ancho de barras dinámicamente
  const availableWidth = chartWidth - 60;
  const barWidth = Math.min(85, availableWidth / chartData.length * 0.6); // Reduced bar width
  const totalBarsWidth = chartData.length * barWidth;
  const totalSpacing = availableWidth - totalBarsWidth;
  const barSpacing = Math.max(20, totalSpacing / (chartData.length + 1)); // Minimum spacing of 20px

  // Paleta de colores en escalas de azul
  const colorSets = [
    { main: '#1e40af', light: '#3b82f6', dark: '#1e3a8a' }, // Blue 700
    { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8' }, // Blue 600
    { main: '#3b82f6', light: '#93c5fd', dark: '#2563eb' }, // Blue 500
    { main: '#60a5fa', light: '#bfdbfe', dark: '#3b82f6' }, // Blue 400
    { main: '#93c5fd', light: '#dbeafe', dark: '#60a5fa' }  // Blue 300
  ];

  return (
    <div className="component-container w-full">
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-lg">
        <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">
          Análisis de Gastos por Categoría
        </h2>
        
        <div className="flex justify-center mb-8">
          <svg 
            width={chartWidth + leftMargin + rightMargin} 
            height={chartHeight + bottomMargin + topMargin}
            className="bg-white"
          >
            {/* Definir patrones sutiles */}
            <defs>
              {colorSets.map((colorSet, index) => (
                <linearGradient key={index} id={`gradient${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={colorSet.main} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={colorSet.main} stopOpacity="0.7" />
                </linearGradient>
              ))}
            </defs>

            {/* Chart title */}
            <text 
               x={(chartWidth + leftMargin + rightMargin) / 2} 
               y={35} 
               textAnchor="middle" 
               className="text-sm font-medium fill-gray-600"
             >
               Distribución de Gastos (USD)
             </text>

            {/* Fondo del área del gráfico */}
            <rect 
              x={leftMargin} 
              y={topMargin} 
              width={chartWidth} 
              height={chartHeight} 
              fill="#fefefe" 
              stroke="#f1f5f9" 
              strokeWidth="1"
            />

            {/* Líneas de referencia horizontales */}
            {Array.from({ length: 6 }, (_, i) => {
              const value = (maxAmount / 5) * i;
              const y = topMargin + chartHeight - (i * chartHeight / 5);
              return (
                <g key={i}>
                  <line 
                    x1={leftMargin} 
                    y1={y} 
                    x2={leftMargin + chartWidth} 
                    y2={y} 
                    stroke={i === 0 ? "#64748b" : "#e2e8f0"} 
                    strokeWidth={i === 0 ? "1.5" : "0.5"}
                    strokeDasharray={i === 0 ? "none" : "2,2"}
                  />
                  <text 
                     x={leftMargin - 15} 
                     y={y + 6} 
                     textAnchor="end" 
                     className="text-sm font-medium fill-gray-700"
                   >
                     ${(value / 1000).toFixed(0)}K
                   </text>
                </g>
              );
            })}

            {/* Y-axis label */}
            <text 
              x={30} 
              y={(topMargin + chartHeight) / 2} 
              textAnchor="middle" 
              className="text-sm font-semibold fill-gray-700"
              transform={`rotate(-90, 30, ${(topMargin + chartHeight) / 2})`}
            >
              Amount in USD (Thousands)
            </text>

            {/* Barras con efectos visuales */}
            {chartData.map((item, index) => {
              const barHeight = (item.amount / maxAmount) * chartHeight;
              const x = leftMargin + 30 + barSpacing + (index * (barWidth + barSpacing));
              const y = topMargin + chartHeight - barHeight;
              const colorSet = colorSets[index % colorSets.length];
              
              return (
                <g key={item.title}>
                  {/* Sombra sutil de la barra */}
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={barWidth}
                    height={barHeight}
                    fill="rgba(0,0,0,0.08)"
                    rx="2"
                  />
                  
                  {/* Barra principal */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={colorSet.main}
                    stroke={colorSet.dark}
                    strokeWidth="1"
                    rx="2"
                  />
                  
                  {/* Valor encima de la barra - sin caja */}
                  <text
                     x={x + barWidth / 2}
                     y={y - 8}
                     textAnchor="middle"
                     className="text-xs font-medium fill-gray-700"
                   >
                     {formatCurrency(item.amount, 'USD')}
                   </text>
                  
                  {/* Etiqueta de categoría dentro de la barra */}
                  <text
                    x={x + barWidth / 2}
                    y={y + barHeight / 2}
                    textAnchor="middle"
                    className="text-xs font-bold fill-white"
                    style={{ fontSize: '10px' }}
                  >
                    {(() => {
                      const words = item.shortTitle.split(' ');
                      const maxWidth = barWidth - 10; // Available width for text inside bar
                      const lineHeight = 12;
                      let lines = [];
                      let currentLine = '';
                      
                      words.forEach(word => {
                        const testLine = currentLine ? `${currentLine} ${word}` : word;
                        // Approximate character width calculation (rough estimate)
                        const estimatedWidth = testLine.length * 5.5;
                        
                        if (estimatedWidth <= maxWidth) {
                          currentLine = testLine;
                        } else {
                          if (currentLine) {
                            lines.push(currentLine);
                            currentLine = word;
                          } else {
                            lines.push(word);
                          }
                        }
                      });
                      
                      if (currentLine) {
                        lines.push(currentLine);
                      }
                      
                      // Limit to 2 lines to fit inside the bar
                      lines = lines.slice(0, 2);
                      
                      return lines.map((line, lineIndex) => (
                        <tspan
                          key={lineIndex}
                          x={x + barWidth / 2}
                          dy={lineIndex === 0 ? -(lines.length - 1) * lineHeight / 2 : lineHeight}
                        >
                          {line}
                        </tspan>
                      ));
                    })()}
                  </text>
                  
                  {/* Porcentaje arriba de la barra, debajo del valor */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 20}
                    textAnchor="middle"
                    className="fill-gray-600 font-medium"
                    style={{ fontSize: '9px' }}
                  >
                    {((item.amount / chartData.reduce((sum, d) => sum + d.amount, 0)) * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}


          </svg>
        </div>
        

        
        {/* Compact summary table */}
        <div className="mt-6 flex justify-center">
          <div className="w-full max-w-2xl">
            <h3 className="text-base font-semibold mb-4 text-center text-gray-700">Resumen Financiero</h3>
            <div className="overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <thead>
                 <tr className="bg-gray-50">
                   <th className="px-3 py-2 text-left font-semibold text-gray-700">Categoría</th>
                   <th className="px-3 py-2 text-right font-semibold text-gray-700">Monto (USD)</th>
                   <th className="px-3 py-2 text-right font-semibold text-gray-700">%</th>
                 </tr>
               </thead>
               <tbody>
                 {chartData.map((item, index) => {
                   const totalAmount = chartData.reduce((sum, data) => sum + data.amount, 0);
                   const percentage = (item.amount / totalAmount) * 100;
                   const colorSet = colorSets[index % colorSets.length];
                   
                   return (
                     <tr key={index} className="hover:bg-gray-50" style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                       <td className="px-3 py-2 border-b border-gray-200">
                         <div className="flex items-center space-x-2">
                           <div 
                             className="w-3 h-3 rounded-full" 
                             style={{ backgroundColor: colorSet.main }}
                           ></div>
                           <span className="font-medium text-gray-800">{item.shortTitle}</span>
                         </div>
                       </td>
                       <td className="px-3 py-2 text-right font-bold text-gray-800 border-b border-gray-200">
                          {formatCurrency(item.amount, 'USD')}
                        </td>
                       <td className="px-3 py-2 text-right border-b border-gray-200">
                         <span className="font-semibold text-gray-700">{percentage.toFixed(1)}%</span>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
               <tfoot>
                 <tr className="bg-gray-100 border-t-2 border-gray-300">
                   <td className="px-3 py-2 font-semibold text-gray-800">TOTAL</td>
                   <td className="px-3 py-2 text-right font-semibold text-gray-800">
                     {formatCurrency(chartData.reduce((sum, item) => sum + item.amount, 0), 'USD')}
                   </td>
                   <td className="px-3 py-2 text-right font-semibold text-gray-800">100.0%</td>
                 </tr>
               </tfoot>
            </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente separado para Anexos
interface AttachmentsPageProps {
  incomes: Income[];
  expenses: Expense[];
  project: Project;
  costSections: { title: string; expenses: Expense[] }[];
  changeOrders: ChangeOrder[];
}

function AttachmentsPage({ incomes, expenses, project, costSections, changeOrders }: AttachmentsPageProps) {
  if (!incomes.some(income => income.receipt_url) && !expenses.some(expense => expense.receipt_url)) {
    return null;
  }

  const pageNumber = 1 + costSections.filter(s => s.expenses.length > 0).length + 3;
  const totalPages = calculateTotalPages(incomes, expenses, changeOrders);

  return (
    <StandardPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      projectName={project.name}
      title="ANNEXES - ATTACHED DOCUMENTS"
      className="annexes-container"
    >
      <div className="table-section">
        {incomes.some(income => income.receipt_url) && (
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3" style={{ color: '#2980b9' }}>Income Attachments</h3>
            <div className="overflow-x-auto table-container">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2980b9', color: 'white' }}>
                    <th className="p-2 text-left font-bold">#</th>
                    <th className="p-2 text-left font-bold">Description</th>
                    <th className="p-2 text-left font-bold">Date</th>
                    <th className="p-2 text-left font-bold">Attached File</th>
                    <th className="p-2 text-left font-bold">Type</th>
                    <th className="p-2 text-right font-bold">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes
                    .filter(income => income.receipt_url)
                    .map((income, index) => (
                      <tr key={income.id} style={{ backgroundColor: index % 2 === 0 ? '#ecf0f1' : 'white' }}>
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">{income.description.length > 25 ? income.description.substring(0, 22) + '...' : income.description}</td>
                        <td className="p-2">
                          {income.received_date && !isNaN(new Date(income.received_date).getTime()) 
                            ? format(new Date(income.received_date), 'dd/MM/yyyy') 
                            : 'N/A'
                          }
                        </td>
                        <td className="p-2">
                          {income.receipt_url ? (
                            <a 
                              href={income.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                              title="Click to view the file"
                            >
                              Receipt
                            </a>
                          ) : (
                            'Receipt'
                          )}
                        </td>
                        <td className="p-2">PDF</td>
                        <td className="p-2 text-right">N/A</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {expenses.some(expense => expense.receipt_url || expense.reference_attachment_url) && (
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3" style={{ color: '#e74c3c' }}>Expense Attachments</h3>
            <div className="overflow-x-auto table-container">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e74c3c', color: 'white' }}>
                    <th className="p-2 text-left font-bold">#</th>
                    <th className="p-2 text-left font-bold">Category</th>
                    <th className="p-2 text-left font-bold">Description</th>
                    <th className="p-2 text-left font-bold">Date</th>
                    <th className="p-2 text-left font-bold">Invoice Receipt</th>
                    <th className="p-2 text-left font-bold">Reference Attachment</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses
                    .filter(expense => expense.receipt_url || expense.reference_attachment_url)
                    .map((expense, index) => (
                      <tr key={expense.id} style={{ backgroundColor: index % 2 === 0 ? '#ecf0f1' : 'white' }}>
                        <td className="p-2" style={{ color: '#000000' }}>{index + 1}</td>
                        <td className="p-2" style={{ color: '#000000' }}>{expense.description.length > 25 ? expense.description.substring(0, 22) + '...' : expense.description}</td>
                        <td className="p-2" style={{ color: '#000000' }}>
                          {translateCategory(expense.category || '')}
                        </td>
                        <td className="p-2" style={{ color: '#000000' }}>
                          {expense.expense_date && !isNaN(new Date(expense.expense_date).getTime()) 
                            ? format(new Date(expense.expense_date), 'dd/MM/yyyy') 
                            : 'N/A'
                          }
                        </td>
                        <td className="p-2" style={{ color: '#000000' }}>
                          {expense.receipt_url ? (
                            <a 
                              href={expense.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                              title="Click to view the invoice receipt"
                            >
                              Invoice
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-2" style={{ color: '#000000' }}>
                          {expense.reference_attachment_url ? (
                            <a 
                              href={expense.reference_attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                              title="Click to view the reference attachment"
                            >
                              {expense.reference_attachment_name || 'Reference'}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> The attached files listed in this section are available digitally in the system. Click on the file name to view the original document and verify its content.
          </p>
        </div>
      </div>
    </StandardPage>
  );
}

interface IncomeReportSectionProps {
   reportData: ReportData;
  convertCurrency: (amount: number, from: string, to: string) => number;
  formatCurrency: (amount: number, currency: string) => string;
}

function IncomeReportSection({ reportData, convertCurrency, formatCurrency }: IncomeReportSectionProps) {
  const totalCRC = reportData.incomes.reduce((sum, income) => {
    return sum + convertCurrency(income.amount, income.currency, 'CRC');
  }, 0);
  
  const totalUSD = reportData.incomes.reduce((sum, income) => {
    return sum + convertCurrency(income.amount, income.currency, 'USD');
  }, 0);

  const budgetDifference = getFinalBudget(reportData.project) - totalCRC;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Income Report
        </CardTitle>
        <CardDescription>
          Detail of all deposits and income for the project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Tabla de Ingresos */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Value in Colones</TableHead>
                  <TableHead className="text-right">Value in Dollars</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.incomes.map((income, index) => {
                  const amountCRC = convertCurrency(income.amount, income.currency, 'CRC');
                  const amountUSD = convertCurrency(income.amount, income.currency, 'USD');
                  
                  return (
                    <TableRow key={income.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{income.description}</TableCell>
                      <TableCell>{income.reference || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(income.received_date), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(amountCRC, 'CRC')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(amountUSD, 'USD')}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {reportData.incomes.length > 0 && (
                  <TableRow className="bg-gray-50 font-bold border-t-2">
                    <TableCell colSpan={4} className="text-right font-bold">
                      TOTAL:
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(totalCRC, 'CRC')}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(totalUSD, 'USD')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t my-4" />

          {/* Totales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Total in Colones</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalCRC, 'CRC')}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Total in Dollars</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalUSD, 'USD')}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Difference vs Final Budget</p>
                  <p className={`text-2xl font-bold ${
                    budgetDifference >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(Math.abs(budgetDifference), 'CRC')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {budgetDifference >= 0 ? 'Falta por cobrar' : 'Exceso cobrado'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para las secciones de costos
interface CostReportSectionProps {
  title: string;
  expenses: Expense[];
  convertCurrency: (amount: number, from: string, to: string) => number;
  formatCurrency: (amount: number, currency: string) => string;
}

function CostReportSection({ title, expenses, convertCurrency, formatCurrency }: CostReportSectionProps) {
  const totalCRC = expenses.reduce((sum, expense) => {
    return sum + convertCurrency(expense.amount, expense.currency, 'CRC');
  }, 0);
  
  const totalUSD = expenses.reduce((sum, expense) => {
    return sum + convertCurrency(expense.amount, expense.currency, 'USD');
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Detalle de gastos y costos asociados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Tabla de Gastos */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Valor en Colones</TableHead>
                  <TableHead className="text-right">Valor en Dólares</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense, index) => {
                  const amountCRC = convertCurrency(expense.amount, expense.currency, 'CRC');
                  const amountUSD = convertCurrency(expense.amount, expense.currency, 'USD');
                  
                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.reference || expense.invoice_number || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(amountCRC, 'CRC')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(amountUSD, 'USD')}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {expenses.length > 0 && (
                  <TableRow className="bg-gray-50 font-bold border-t-2">
                    <TableCell colSpan={4} className="text-right font-bold">
                      TOTAL:
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(totalCRC, 'CRC')}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(totalUSD, 'USD')}
                    </TableCell>
                  </TableRow>
                )}
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No hay gastos registrados en esta categoría
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t my-4" />

          {/* Totales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Total en Colones</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalCRC, 'CRC')}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Total en Dólares</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalUSD, 'USD')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para el resumen general
interface SummaryReportSectionProps {
  reportData: ReportData;
  convertCurrency: (amount: number, from: string, to: string) => number;
  formatCurrency: (amount: number, currency: string) => string;
}

function SummaryReportSection({ reportData, convertCurrency, formatCurrency }: SummaryReportSectionProps) {
  // Calcular totales de ingresos
  const totalIncomesCRC = reportData.incomes.reduce((sum, income) => {
    return sum + convertCurrency(income.amount, income.currency, 'CRC');
  }, 0);
  
  const totalIncomesUSD = reportData.incomes.reduce((sum, income) => {
    return sum + convertCurrency(income.amount, income.currency, 'USD');
  }, 0);

  // Calcular totales por categoría de gastos
  const categories = ['costos_directos', 'costos_indirectos', 'mano_obra', 'imprevistos', 'administracion'];
  const categoryTotals = categories.map(category => {
    const categoryExpenses = reportData.expenses.filter(e => e.category === category);
    const totalCRC = categoryExpenses.reduce((sum, expense) => {
      return sum + convertCurrency(expense.amount, expense.currency, 'CRC');
    }, 0);
    const totalUSD = categoryExpenses.reduce((sum, expense) => {
      return sum + convertCurrency(expense.amount, expense.currency, 'USD');
    }, 0);
    
    return {
      category,
      name: {
          costos_directos: 'Costos Directos',
          costos_indirectos: 'Costos Indirectos',
          mano_obra: 'Mano de Obra',
          imprevistos: 'Imprevistos',
          administracion: 'Administración'
        }[category],
      totalCRC,
      totalUSD
    };
  });

  const totalExpensesCRC = categoryTotals.reduce((sum, cat) => sum + cat.totalCRC, 0);
  const totalExpensesUSD = categoryTotals.reduce((sum, cat) => sum + cat.totalUSD, 0);
  
  const netProfitCRC = totalIncomesCRC - totalExpensesCRC;
  const netProfitUSD = totalIncomesUSD - totalExpensesUSD;
  
  const budgetDifference = getFinalBudget(reportData.project) - totalIncomesCRC;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          General Project Summary
        </CardTitle>
        <CardDescription>
          Complete financial consolidation of the project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Income Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-700">Total Income</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600">Total en Colones</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(totalIncomesCRC, 'CRC')}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600">Total en Dólares</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(totalIncomesUSD, 'USD')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="border-t my-4" />

          {/* Expense Summary by Category */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-red-700">Expenses by Category</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Total in Colones</TableHead>
                    <TableHead className="text-right">Total in Dollars</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryTotals.map((category) => (
                    <TableRow key={category.category}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(category.totalCRC, 'CRC')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(category.totalUSD, 'USD')}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-red-50 font-semibold">
                    <TableCell>Total General Expenses</TableCell>
                    <TableCell className="text-right text-red-700">
                      {formatCurrency(totalExpensesCRC, 'CRC')}
                    </TableCell>
                    <TableCell className="text-right text-red-700">
                      {formatCurrency(totalExpensesUSD, 'USD')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="border-t my-4" />

          {/* Financial Analysis */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Financial Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={netProfitCRC >= 0 ? 'bg-green-50' : 'bg-red-50'}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Net Profit (CRC)</p>
                    <p className={`text-2xl font-bold ${
                      netProfitCRC >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formatCurrency(netProfitCRC, 'CRC')}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={netProfitUSD >= 0 ? 'bg-green-50' : 'bg-red-50'}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Net Profit (USD)</p>
                    <p className={`text-2xl font-bold ${
                      netProfitUSD >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formatCurrency(netProfitUSD, 'USD')}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={budgetDifference >= 0 ? 'bg-yellow-50' : 'bg-blue-50'}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">vs Final Budget</p>
                    <p className={`text-2xl font-bold ${
                      budgetDifference >= 0 ? 'text-yellow-700' : 'text-blue-700'
                    }`}>
                      {formatCurrency(Math.abs(budgetDifference), 'CRC')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {budgetDifference >= 0 ? 'Pending to collect' : 'Excess collected'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}