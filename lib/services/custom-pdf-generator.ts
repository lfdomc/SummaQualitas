'use client';

import jsPDF from 'jspdf';
import { 
  CustomReportConfig,
  DirectExpensesByProjectMonth,
  ProjectTotalIncome,
  SupplierExpensesByYear,
  MonthlyExpensesByCategory,
  ProjectProfitabilityAnalysis,
  SupplierPaymentAnalysis,
  CUSTOM_REPORT_TEMPLATES
} from '@/lib/types/custom-reports';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export class CustomPDFGenerator {
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

  private formatCurrency(amount: number, currency: string = 'CRC'): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private addHeader(title: string): void {
    // Logo/Empresa (placeholder)
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SUMMA QUALITAS', this.margin, this.currentY);
    
    this.currentY += 8;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Constructora y Servicios', this.margin, this.currentY);
    
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

  private addReportInfo(config: CustomReportConfig): void {
    const template = CUSTOM_REPORT_TEMPLATES.find(t => t.type === config.type);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Tipo de Reporte: ${template?.name || 'Reporte Personalizado'}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Fecha de Generación: ${format(new Date(), "PPP", { locale: es })}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    if (config.dateFrom && config.dateTo) {
      this.doc.text(
        `Período: ${format(config.dateFrom, "PPP", { locale: es })} - ${format(config.dateTo, "PPP", { locale: es })}`,
        this.margin,
        this.currentY
      );
      this.currentY += this.lineHeight;
    }
    
    if (config.description) {
      this.doc.text(`Descripción: ${config.description}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    this.currentY += 10;
  }

  private generateDirectExpensesByProjectMonth(data: DirectExpensesByProjectMonth): void {
    this.addSection('RESUMEN GENERAL');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total de Gastos: ${this.formatCurrency(data.totalExpenses)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Número de Proyectos: ${data.projectCount}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Período: ${data.month}/${data.year}`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;
    
    this.addSection('GASTOS POR PROYECTO');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    data.expenses.forEach((expense, index) => {
      this.checkPageBreak(20);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${expense.projectName}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Monto Total: ${this.formatCurrency(expense.totalAmount, expense.currency)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Número de Gastos: ${expense.expenseCount}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Moneda: ${expense.currency}`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 1.5;
    });
  }

  private generateProjectTotalIncome(data: ProjectTotalIncome): void {
    this.addSection('RESUMEN GENERAL');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Ingresos Totales: ${this.formatCurrency(data.totalIncome)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Número de Proyectos: ${data.projectCount}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    const avgIncome = data.totalIncome / data.projectCount;
    this.doc.text(`Promedio por Proyecto: ${this.formatCurrency(avgIncome)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;
    
    this.addSection('INGRESOS POR PROYECTO');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    data.incomes.forEach((income, index) => {
      this.checkPageBreak(20);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${income.projectName}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Monto Total: ${this.formatCurrency(income.totalAmount, income.currency)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Número de Ingresos: ${income.incomeCount}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Moneda: ${income.currency}`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 1.5;
    });
  }

  private generateSupplierExpensesByYear(data: SupplierExpensesByYear): void {
    this.addSection('RESUMEN GENERAL');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total de Gastos: ${this.formatCurrency(data.totalExpenses)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Número de Proveedores: ${data.supplierCount}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Año: ${data.year}`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;
    
    this.addSection('GASTOS POR PROVEEDOR');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    data.expenses.forEach((expense, index) => {
      this.checkPageBreak(20);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${expense.supplierName}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Monto Total: ${this.formatCurrency(expense.totalAmount, expense.currency)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Número de Transacciones: ${expense.expenseCount}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Moneda: ${expense.currency}`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 1.5;
    });
  }

  private generateMonthlyExpensesByCategory(data: MonthlyExpensesByCategory): void {
    this.addSection('RESUMEN GENERAL');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total de Gastos: ${this.formatCurrency(data.totalExpenses)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Número de Categorías: ${data.categoryCount}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Período: ${data.month}/${data.year}`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;
    
    this.addSection('GASTOS POR CATEGORÍA');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    data.expenses.forEach((expense, index) => {
      this.checkPageBreak(25);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${expense.category}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Monto Total: ${this.formatCurrency(expense.totalAmount, expense.currency)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Número de Gastos: ${expense.expenseCount}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Porcentaje del Total: ${expense.percentage.toFixed(1)}%`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Moneda: ${expense.currency}`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 1.5;
    });
  }

  private generateProjectProfitabilityAnalysis(data: ProjectProfitabilityAnalysis): void {
    this.addSection('RESUMEN GENERAL');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Ingresos Totales: ${this.formatCurrency(data.totalRevenue)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Gastos Totales: ${this.formatCurrency(data.totalExpenses)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Ganancia Neta: ${this.formatCurrency(data.netProfit)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Margen de Ganancia: ${data.profitMargin.toFixed(1)}%`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;
    
    this.addSection('ANÁLISIS POR PROYECTO');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    data.projects.forEach((project, index) => {
      this.checkPageBreak(30);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${project.projectName}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Ingresos: ${this.formatCurrency(project.revenue, project.currency)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Gastos: ${this.formatCurrency(project.expenses, project.currency)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Ganancia: ${this.formatCurrency(project.profit, project.currency)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Margen: ${project.profitMargin.toFixed(1)}%`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Estado: ${project.profitMargin >= 0 ? 'Rentable' : 'Pérdida'}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Moneda: ${project.currency}`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 1.5;
    });
  }

  private generateSupplierPaymentAnalysis(data: SupplierPaymentAnalysis): void {
    this.addSection('RESUMEN GENERAL');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total Pagado: ${this.formatCurrency(data.totalPaid)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Total Pendiente: ${this.formatCurrency(data.totalPending)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Número de Proveedores: ${data.supplierCount}`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;
    
    this.addSection('ESTADO DE PAGOS POR PROVEEDOR');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    data.suppliers.forEach((supplier, index) => {
      this.checkPageBreak(30);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${supplier.supplierName}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Total Pagado: ${this.formatCurrency(supplier.paidAmount, supplier.currency)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Pendiente: ${this.formatCurrency(supplier.pendingAmount, supplier.currency)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Transacciones: ${supplier.transactionCount}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Estado: ${supplier.pendingAmount > 0 ? 'Pendiente' : 'Al día'}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Moneda: ${supplier.currency}`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 1.5;
    });
  }

  public async generateCustomReport(config: CustomReportConfig, data: any): Promise<void> {
    try {
      // Encabezado
      this.addHeader(config.title);
      
      // Información del reporte
      this.addReportInfo(config);
      
      // Generar contenido según el tipo de reporte
      switch (config.type) {
        case 'direct_expenses_by_project_month':
          this.generateDirectExpensesByProjectMonth(data);
          break;
        case 'project_total_income':
          this.generateProjectTotalIncome(data);
          break;
        case 'supplier_expenses_by_year':
          this.generateSupplierExpensesByYear(data);
          break;
        case 'monthly_expenses_by_category':
          this.generateMonthlyExpensesByCategory(data);
          break;
        case 'project_profitability_analysis':
          this.generateProjectProfitabilityAnalysis(data);
          break;
        case 'supplier_payment_analysis':
          this.generateSupplierPaymentAnalysis(data);
          break;
        default:
          this.addSection('DATOS DEL REPORTE');
          this.doc.setFontSize(10);
          this.doc.setFont('helvetica', 'normal');
          this.doc.text('Datos no disponibles para este tipo de reporte', this.margin, this.currentY);
          break;
      }
      
      // Pie de página en todas las páginas
      const totalPages = this.doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        this.doc.setPage(i);
        this.addFooter();
      }
      
      // Descargar el PDF
      const fileName = `${config.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      this.doc.save(fileName);
      
    } catch (error) {
      console.error('Error generando PDF personalizado:', error);
      throw new Error('Error al generar el reporte PDF personalizado');
    }
  }
}

export const generateCustomPDFReport = async (config: CustomReportConfig, data: any): Promise<void> => {
  const generator = new CustomPDFGenerator();
  await generator.generateCustomReport(config, data);
};