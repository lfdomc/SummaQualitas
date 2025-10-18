'use client';

import jsPDF from 'jspdf';
import { 
  CustomReportConfig,
  CustomReportData,
  DirectExpensesByProjectMonth,
  ProjectTotalIncome,
  SupplierExpensesByYear,
  MonthlyExpensesByCategory,
  ProjectProfitabilityAnalysis,
  SupplierPaymentAnalysis,
  QuarterlyFinancialSummary,
  ProjectCostBreakdown,
  AnnualRevenueAnalysis,
  ExpenseTrendAnalysis,
  CUSTOM_REPORT_TEMPLATES
} from '@/lib/types/custom-reports';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Unión de tipos para los datos de reportes
type ReportDataUnion = 
  | DirectExpensesByProjectMonth[]
  | ProjectTotalIncome[]
  | SupplierExpensesByYear[]
  | MonthlyExpensesByCategory[]
  | ProjectProfitabilityAnalysis[]
  | SupplierPaymentAnalysis[]
  | QuarterlyFinancialSummary[]
  | ProjectCostBreakdown[]
  | AnnualRevenueAnalysis[]
  | ExpenseTrendAnalysis[];

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
    }).format(amount || 0);
  }

  private addHeader(title: string): void {
    // Logo/Empresa (placeholder)
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SUMMA QUÁLITAS', this.margin, this.currentY);
    
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
    const template = CUSTOM_REPORT_TEMPLATES.find(t => t.reportType === config.reportType);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Tipo de Reporte: ${template?.name || 'Reporte Personalizado'}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Fecha de Generación: ${format(new Date(), "PPP", { locale: es })}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    if (config?.dateRange?.from && config?.dateRange?.to) {
      this.doc.text(
        `Período: ${format(config.dateRange.from, "PPP", { locale: es })} - ${format(config.dateRange.to, "PPP", { locale: es })}`,
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

  private generateDirectExpensesByProjectMonth(items: DirectExpensesByProjectMonth[]): void {
    this.addSection('RESUMEN GENERAL');

    const totalExpensesCRC = items.reduce((sum, it) => sum + (it.totalInCRC ?? 0), 0);
    const totalExpensesUSD = items.reduce((sum, it) => sum + (it.totalInUSD ?? 0), 0);
    const projectCount = items.length;
    const month = items[0]?.month ?? '-';
    const year = items[0]?.year ?? 0;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total de Gastos CRC: ${this.formatCurrency(totalExpensesCRC, 'CRC')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.text(`Total de Gastos USD: ${this.formatCurrency(totalExpensesUSD, 'USD')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Número de Proyectos: ${projectCount}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Período: ${month}/${year}`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;
    
    this.addSection('GASTOS POR PROYECTO');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    items.forEach((it, index) => {
      this.checkPageBreak(30);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${it.project.name}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Monto Total CRC: ${this.formatCurrency(it.totalInCRC, 'CRC')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Monto Total USD: ${this.formatCurrency(it.totalInUSD, 'USD')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Gastos Directos - Subcontratos: ${this.formatCurrency(it.directExpenses.subcontratos)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Gastos Directos - Materiales: ${this.formatCurrency(it.directExpenses.materiales)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Gastos Directos - Otros: ${this.formatCurrency(it.directExpenses.otros)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Total Directo: ${this.formatCurrency(it.directExpenses.total)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Número de Gastos: ${it.expenseCount}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Tasa de cambio: ${it.exchangeRate}`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 1.5;
    });
  }

  private generateProjectTotalIncome(items: ProjectTotalIncome[]): void {
    this.addSection('RESUMEN GENERAL');
    
    const totalIncomeCRC = items.reduce((sum, it) => sum + (it.totalIncomeCRC ?? 0), 0);
    const totalIncomeUSD = items.reduce((sum, it) => sum + (it.totalIncomeUSD ?? 0), 0);
    const totalIncome = items.reduce((sum, it) => sum + (it.totalIncome ?? 0), 0);
    const projectCount = items.length;
    const avgIncome = projectCount ? totalIncome / projectCount : 0;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Ingresos Totales CRC: ${this.formatCurrency(totalIncomeCRC, 'CRC')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.text(`Ingresos Totales USD: ${this.formatCurrency(totalIncomeUSD, 'USD')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Número de Proyectos: ${projectCount}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Promedio por Proyecto (CRC): ${this.formatCurrency(avgIncome, 'CRC')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;
    
    this.addSection('INGRESOS POR PROYECTO');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    items.forEach((it, index) => {
      this.checkPageBreak(25);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${it.project.name}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Monto Total CRC: ${this.formatCurrency(it.totalIncomeCRC, 'CRC')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Monto Total USD: ${this.formatCurrency(it.totalIncomeUSD, 'USD')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Confirmado: ${this.formatCurrency(it.confirmedIncome, 'CRC')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Pendiente: ${this.formatCurrency(it.pendingIncome, 'CRC')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Transacciones: ${it.incomeCount}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      if (it.firstIncomeDate || it.lastIncomeDate) {
        this.doc.text(`   Rango de fechas: ${it.firstIncomeDate || '-'} a ${it.lastIncomeDate || '-'}`, this.margin, this.currentY);
        this.currentY += this.lineHeight;
      }
      
      this.currentY += this.lineHeight * 0.5;
    });
  }

  private generateSupplierExpensesByYear(items: SupplierExpensesByYear[]): void {
    this.addSection('RESUMEN GENERAL');
    
    const totalCRC = items.reduce((sum, it) => sum + (it.totalExpensesCRC ?? 0), 0);
    const totalUSD = items.reduce((sum, it) => sum + (it.totalExpensesUSD ?? 0), 0);
    const supplierCount = items.length;
    const year = items[0]?.year ?? '';

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total de Gastos CRC: ${this.formatCurrency(totalCRC, 'CRC')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Total de Gastos USD: ${this.formatCurrency(totalUSD, 'USD')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Número de Proveedores: ${supplierCount}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    this.doc.text(`Año: ${year}`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;
    
    this.addSection('GASTOS POR PROVEEDOR');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    items.forEach((it, index) => {
      this.checkPageBreak(25);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${it.supplier.name}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Monto Total CRC: ${this.formatCurrency(it.totalExpensesCRC, 'CRC')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Monto Total USD: ${this.formatCurrency(it.totalExpensesUSD, 'USD')}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.doc.text(`   Número de Transacciones: ${it.expenseCount}`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 1.5;
    });
  }

  private generateMonthlyExpensesByCategory(items: MonthlyExpensesByCategory[]): void {
    this.addSection('RESUMEN GENERAL');

    const totalCRC = items.reduce((sum, it) => sum + (it.totalAmountCRC ?? 0), 0);
    const totalUSD = items.reduce((sum, it) => sum + (it.totalAmountUSD ?? 0), 0);
    const totalCount = items.reduce((sum, it) => sum + (it.totalCount ?? 0), 0);

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total de Gastos CRC: ${this.formatCurrency(totalCRC, 'CRC')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.text(`Total de Gastos USD: ${this.formatCurrency(totalUSD, 'USD')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.text(`Número de Registros: ${totalCount}`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;

    items.forEach((it, monthIdx) => {
      this.addSection(`GASTOS POR CATEGORÍA - ${it.month}/${it.year}`);

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');

      it.categories.forEach((cat, index) => {
        this.checkPageBreak(25);

        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${index + 1}. ${cat.category}${cat.subcategory ? ' - ' + cat.subcategory : ''}`, this.margin, this.currentY);
        this.currentY += this.lineHeight;

        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`   Monto CRC: ${this.formatCurrency(cat.amountCRC, 'CRC')}`, this.margin, this.currentY);
        this.currentY += this.lineHeight;

        this.doc.text(`   Monto USD: ${this.formatCurrency(cat.amountUSD, 'USD')}`, this.margin, this.currentY);
        this.currentY += this.lineHeight;

        this.doc.text(`   Porcentaje: ${Number(cat.percentage || 0).toFixed(1)}%`, this.margin, this.currentY);
        this.currentY += this.lineHeight;

        this.doc.text(`   Transacciones: ${cat.count}`, this.margin, this.currentY);
        this.currentY += this.lineHeight * 1.5;
      });
    });
  }

  private generateProjectProfitabilityAnalysis(items: ProjectProfitabilityAnalysis[]): void {
    this.addSection('RESUMEN GENERAL');

    const totalIncome = items.reduce((sum, it) => sum + (it.totalIncome ?? 0), 0);
    const totalExpenses = items.reduce((sum, it) => sum + (it.totalExpenses ?? 0), 0);
    const totalGrossProfit = items.reduce((sum, it) => sum + (it.grossProfit ?? 0), 0);
    const avgMargin = items.length ? (items.reduce((sum, it) => sum + (it.profitMargin ?? 0), 0) / items.length) : 0;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Ingresos Totales: ${this.formatCurrency(totalIncome)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.text(`Gastos Totales: ${this.formatCurrency(totalExpenses)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.text(`Ganancia Bruta: ${this.formatCurrency(totalGrossProfit)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.text(`Margen Promedio: ${avgMargin.toFixed(1)}%`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;

    this.addSection('ANÁLISIS POR PROYECTO');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    items.forEach((p, index) => {
      this.checkPageBreak(30);

      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${p.project.name}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Ingresos: ${this.formatCurrency(p.totalIncome)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Gastos: ${this.formatCurrency(p.totalExpenses)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Ganancia Bruta: ${this.formatCurrency(p.grossProfit)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Margen: ${p.profitMargin.toFixed(1)}%`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   ROI: ${p.roi.toFixed(1)}%`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Uso de Presupuesto: ${p.budgetUtilization.toFixed(1)}%`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 1.2;

      if (p.expenseBreakdown && p.expenseBreakdown.length > 0) {
        this.doc.text('   Desglose de Gastos:', this.margin, this.currentY);
        this.currentY += this.lineHeight;
        p.expenseBreakdown.forEach((e) => {
          this.doc.text(`     - ${e.category}: ${this.formatCurrency(e.amount)} (${e.percentage.toFixed(1)}%)`, this.margin, this.currentY);
          this.currentY += this.lineHeight;
        });
      }

      this.currentY += this.lineHeight * 0.5;
    });
  }

  private generateSupplierPaymentAnalysis(items: SupplierPaymentAnalysis[]): void {
    this.addSection('RESUMEN GENERAL');

    const totalPaid = items.reduce((sum, it) => sum + (it.paidAmount ?? 0), 0);
    const totalPending = items.reduce((sum, it) => sum + (it.pendingAmount ?? 0), 0);
    const totalAmount = items.reduce((sum, it) => sum + (it.totalAmount ?? 0), 0);
    const supplierCount = items.length;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total Pagado: ${this.formatCurrency(totalPaid)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.text(`Total Pendiente: ${this.formatCurrency(totalPending)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.text(`Total Facturado: ${this.formatCurrency(totalAmount)}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;

    this.doc.text(`Número de Proveedores: ${supplierCount}`, this.margin, this.currentY);
    this.currentY += this.lineHeight * 2;

    this.addSection('ESTADO DE PAGOS POR PROVEEDOR');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    items.forEach((s, index) => {
      this.checkPageBreak(30);

      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${s.supplier.name}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`   Total: ${this.formatCurrency(s.totalAmount)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Pagado: ${this.formatCurrency(s.paidAmount)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Pendiente: ${this.formatCurrency(s.pendingAmount)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Anulado: ${this.formatCurrency(s.cancelledAmount)}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Tasa de Pago: ${s.paymentRate.toFixed(1)}%`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Tiempo Promedio de Pago: ${s.averagePaymentTime} días`, this.margin, this.currentY);
      this.currentY += this.lineHeight;

      this.doc.text(`   Cantidad de Facturas: ${s.invoiceCount}`, this.margin, this.currentY);
      this.currentY += this.lineHeight * 1.2;

      if (s.projects && s.projects.length > 0) {
        this.doc.text('   Por Proyecto:', this.margin, this.currentY);
        this.currentY += this.lineHeight;
        s.projects.forEach((p) => {
          this.doc.text(`     - ${p.projectName}: Total ${this.formatCurrency(p.amount)}, Pagado ${this.formatCurrency(p.paidAmount)}, Pendiente ${this.formatCurrency(p.pendingAmount)}`, this.margin, this.currentY);
          this.currentY += this.lineHeight;
        });
      }

      this.currentY += this.lineHeight * 0.5;
    });
  }

  public async generateCustomReport(report: CustomReportData): Promise<void> {
    try {
      // Encabezado
      this.addHeader(report.config.title);
      
      // Información del reporte
      this.addReportInfo(report.config);
      
      const data = report.data;

      // Generar contenido según el tipo de reporte
      switch (report.config.reportType) {
        case 'direct_expenses_by_project_month':
          this.generateDirectExpensesByProjectMonth(data as DirectExpensesByProjectMonth[]);
          break;
        case 'project_total_income':
          this.generateProjectTotalIncome(data as ProjectTotalIncome[]);
          break;
        case 'supplier_expenses_by_year':
          this.generateSupplierExpensesByYear(data as SupplierExpensesByYear[]);
          break;
        case 'monthly_expenses_by_category':
          this.generateMonthlyExpensesByCategory(data as MonthlyExpensesByCategory[]);
          break;
        case 'project_profitability_analysis':
          this.generateProjectProfitabilityAnalysis(data as ProjectProfitabilityAnalysis[]);
          break;
        case 'supplier_payment_analysis':
          this.generateSupplierPaymentAnalysis(data as SupplierPaymentAnalysis[]);
          break;
        case 'quarterly_financial_summary':
        case 'project_cost_breakdown':
        case 'annual_revenue_analysis':
        case 'expense_trend_analysis':
          this.addSection('Este tipo de reporte todavía no está implementado para PDF.');
          this.doc.setFontSize(10);
          this.doc.setFont('helvetica', 'normal');
          this.doc.text('Por favor, use otra opción o contacte al administrador.', this.margin, this.currentY);
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
      const fileName = `${report.config.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      this.doc.save(fileName);
      
    } catch (error) {
      console.error('Error generando PDF personalizado:', error);
      throw new Error('Error al generar el reporte PDF personalizado');
    }
  }
}

export const generateCustomPDFReport = async (report: CustomReportData): Promise<void> => {
  const generator = new CustomPDFGenerator();
  await generator.generateCustomReport(report);
};