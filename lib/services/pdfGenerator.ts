import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportData {
  title: string;
  projects: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    expenses?: Array<{
      description: string;
      amount: number;
      date: string;
      category: string;
    }>;
  }>;
  sections: {
    includeProjectDetails: boolean;
    includeFinancialSummary: boolean;
    includeExpenseBreakdown: boolean;
    includeTimeline: boolean;
  };
  dateRange?: {
    start: string;
    end: string;
  };
  generatedAt: string;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;
  private lineHeight: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
    this.lineHeight = 7;
  }

  private async addHeader(title: string): Promise<void> {
    // Cargar y agregar logo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => {
          // Agregar logo a la izquierda (30x30 pixels)
          const logoWidth = 25;
          const logoHeight = 25;
          
          // Convertir imagen a canvas para obtener datos base64
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = logoImg.width;
          canvas.height = logoImg.height;
          ctx?.drawImage(logoImg, 0, 0);
          const logoData = canvas.toDataURL('image/jpeg', 0.8);
          
          this.doc.addImage(logoData, 'JPEG', this.margin, this.currentY - 5, logoWidth, logoHeight);
          resolve();
        };
        logoImg.onerror = () => {
          console.warn('No se pudo cargar el logo, continuando sin él');
          resolve();
        };
        logoImg.src = '/images/summa/logo.jpg';
      });
    } catch (error) {
      console.warn('Error al cargar el logo:', error);
    }
    
    // Texto del encabezado a la derecha del logo
    const textStartX = this.margin + 35; // Espacio para el logo + margen
    
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SUMMA QUALITAS', textStartX, this.currentY);
    
    this.currentY += 10;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Constructora y Servicios', textStartX, this.currentY);
    
    // Línea separadora
    this.currentY += 10;
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    // Título del reporte
    this.currentY += 15;
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    
    this.currentY += 15;
  }

  private addFooter(): void {
    const footerY = this.pageHeight - 20;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Generado el ${new Date().toLocaleDateString('es-ES')} - Página ${this.doc.internal.getNumberOfPages()}`,
      this.margin,
      footerY
    );
  }

  private checkPageBreak(requiredSpace: number = 20): void {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addSection(title: string): void {
    this.checkPageBreak(25);
    this.currentY += 10;
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    
    this.currentY += 8;
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 10;
  }

  private addProjectDetails(projects: ReportData['projects']): void {
    this.addSection('DETALLES DE PROYECTOS');
    
    projects.forEach((project, index) => {
      this.checkPageBreak(40);
      
      // Nombre del proyecto
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${project.name}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      // Descripción
      if (project.description) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        const descriptionLines = this.doc.splitTextToSize(
          `Descripción: ${project.description}`,
          this.pageWidth - 2 * this.margin
        );
        this.doc.text(descriptionLines, this.margin + 5, this.currentY);
        this.currentY += descriptionLines.length * this.lineHeight;
      }
      
      // Estado y fechas
      this.doc.setFontSize(10);
      this.doc.text(`Estado: ${project.status}`, this.margin + 5, this.currentY);
      this.currentY += this.lineHeight;
      
      if (project.start_date) {
        this.doc.text(
          `Fecha de inicio: ${new Date(project.start_date).toLocaleDateString('es-ES')}`,
          this.margin + 5,
          this.currentY
        );
        this.currentY += this.lineHeight;
      }
      
      if (project.end_date) {
        this.doc.text(
          `Fecha de fin: ${new Date(project.end_date).toLocaleDateString('es-ES')}`,
          this.margin + 5,
          this.currentY
        );
        this.currentY += this.lineHeight;
      }
      
      if (project.budget) {
        this.doc.text(
          `Presupuesto: $${project.budget.toLocaleString('es-ES')}`,
          this.margin + 5,
          this.currentY
        );
        this.currentY += this.lineHeight;
      }
      
      this.currentY += 5;
    });
  }

  private addFinancialSummary(projects: ReportData['projects']): void {
    this.addSection('RESUMEN FINANCIERO');
    
    let totalBudget = 0;
    let totalExpenses = 0;
    
    projects.forEach(project => {
      if (project.budget) totalBudget += project.budget;
      if (project.expenses) {
        totalExpenses += project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      }
    });
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Presupuesto total: $${totalBudget.toLocaleString('es-ES')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Gastos totales: $${totalExpenses.toLocaleString('es-ES')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    const remaining = totalBudget - totalExpenses;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      `Saldo restante: $${remaining.toLocaleString('es-ES')}`,
      this.margin,
      this.currentY
    );
    this.currentY += this.lineHeight * 2;
  }

  private addExpenseBreakdown(projects: ReportData['projects']): void {
    this.addSection('DESGLOSE DE GASTOS');
    
    projects.forEach(project => {
      if (project.expenses && project.expenses.length > 0) {
        this.checkPageBreak(30);
        
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(project.name, this.margin, this.currentY);
        this.currentY += this.lineHeight;
        
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        
        project.expenses.forEach(expense => {
          this.checkPageBreak(15);
          
          const expenseText = `• ${expense.description} - $${expense.amount.toLocaleString('es-ES')} (${new Date(expense.date).toLocaleDateString('es-ES')})`;
          const lines = this.doc.splitTextToSize(expenseText, this.pageWidth - 2 * this.margin - 10);
          
          this.doc.text(lines, this.margin + 5, this.currentY);
          this.currentY += lines.length * this.lineHeight;
        });
        
        this.currentY += 5;
      }
    });
  }

  public async generateReport(data: ReportData): Promise<void> {
    try {
      // Encabezado
      await this.addHeader(data.title);
      
      // Información general
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Fecha de generación: ${new Date(data.generatedAt).toLocaleDateString('es-ES')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      if (data.dateRange) {
        this.doc.text(
          `Período: ${new Date(data.dateRange.start).toLocaleDateString('es-ES')} - ${new Date(data.dateRange.end).toLocaleDateString('es-ES')}`,
          this.margin,
          this.currentY
        );
        this.currentY += this.lineHeight;
      }
      
      this.doc.text(`Número de proyectos: ${data.projects.length}`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 2;
      
      // Secciones según configuración
      if (data.sections.includeProjectDetails) {
        this.addProjectDetails(data.projects);
      }
      
      if (data.sections.includeFinancialSummary) {
        this.addFinancialSummary(data.projects);
      }
      
      if (data.sections.includeExpenseBreakdown) {
        this.addExpenseBreakdown(data.projects);
      }
      
      // Pie de página en todas las páginas
      const totalPages = this.doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        this.doc.setPage(i);
        this.addFooter();
      }
      
      // Descargar el PDF
      const fileName = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      this.doc.save(fileName);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new Error('Error al generar el reporte PDF');
    }
  }
}

export const generatePDFReport = async (data: ReportData): Promise<void> => {
  const generator = new PDFGenerator();
  await generator.generateReport(data);
};