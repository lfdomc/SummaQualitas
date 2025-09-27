// =====================================================
// TIPOS PARA REPORTES PERSONALIZADOS
// =====================================================

import { Project, Supplier, Client } from '@/lib/types';
import { Expense, Income } from '@/lib/types';

// Tipos de reportes personalizados disponibles
export type CustomReportType = 
  | 'direct_expenses_by_project_month'
  | 'project_total_income'
  | 'supplier_expenses_by_year'
  | 'monthly_expenses_by_category'
  | 'project_profitability_analysis'
  | 'supplier_payment_analysis'
  | 'quarterly_financial_summary'
  | 'project_cost_breakdown'
  | 'annual_revenue_analysis'
  | 'expense_trend_analysis';

// Períodos de tiempo para reportes
export type ReportPeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom';

// Formatos de exportación
export type ExportFormat = 'pdf' | 'excel' | 'csv';

// Configuración base para reportes personalizados
export interface CustomReportConfig {
  id?: string;
  title: string;
  description?: string;
  reportType: CustomReportType;
  period: ReportPeriod;
  dateRange: {
    from: Date;
    to: Date;
  };
  filters: CustomReportFilters;
  exportFormat: ExportFormat;
  includeCharts: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  createdBy?: string;
  createdAt?: string;
}

// Filtros específicos para reportes personalizados
export interface CustomReportFilters {
  projectIds?: string[];
  supplierIds?: string[];
  clientIds?: string[];
  categories?: string[];
  subcategories?: string[];
  paymentStatus?: string[];
  currency?: 'CRC' | 'USD' | 'both';
  amountRange?: {
    min: number;
    max: number;
  };
}

// Datos de gastos directos por proyecto y mes
export interface DirectExpensesByProjectMonth {
  project: {
    id: string;
    name: string;
    client: string;
  };
  month: string;
  year: number;
  directExpenses: {
    subcontratos: number;
    materiales: number;
    otros: number;
    total: number;
  };
  totalInCRC: number;
  totalInUSD: number;
  exchangeRate: number;
  expenseCount: number;
}

// Datos de ingresos totales por proyecto
export interface ProjectTotalIncome {
  project: {
    id: string;
    name: string;
    client: string;
    status: string;
    startDate: string;
    endDate?: string;
  };
  totalIncome: number;
  totalIncomeCRC: number;
  totalIncomeUSD: number;
  confirmedIncome: number;
  pendingIncome: number;
  incomeCount: number;
  firstIncomeDate?: string;
  lastIncomeDate?: string;
  averageIncomePerMonth: number;
}

// Datos de gastos por proveedor durante el año
export interface SupplierExpensesByYear {
  supplier: {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
  };
  year: number;
  totalExpenses: number;
  totalExpensesCRC: number;
  totalExpensesUSD: number;
  expenseCount: number;
  categories: {
    category: string;
    amount: number;
    count: number;
  }[];
  monthlyBreakdown: {
    month: string;
    amount: number;
    count: number;
  }[];
  projects: {
    projectId: string;
    projectName: string;
    amount: number;
    count: number;
  }[];
}

// Datos de gastos mensuales por categoría
export interface MonthlyExpensesByCategory {
  month: string;
  year: number;
  categories: {
    category: string;
    subcategory?: string;
    amount: number;
    amountCRC: number;
    amountUSD: number;
    count: number;
    percentage: number;
  }[];
  totalAmount: number;
  totalAmountCRC: number;
  totalAmountUSD: number;
  totalCount: number;
}

// Análisis de rentabilidad por proyecto
export interface ProjectProfitabilityAnalysis {
  project: {
    id: string;
    name: string;
    client: string;
    status: string;
    budget: number;
  };
  totalIncome: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
  roi: number; // Return on Investment
  budgetUtilization: number;
  expenseBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  incomeBreakdown: {
    month: string;
    amount: number;
  }[];
  expenseBreakdown_monthly: {
    month: string;
    amount: number;
  }[];
}

// Análisis de pagos a proveedores
export interface SupplierPaymentAnalysis {
  supplier: {
    id: string;
    name: string;
    contactName?: string;
  };
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  cancelledAmount: number;
  paymentRate: number; // Porcentaje de pagos realizados
  averagePaymentTime: number; // Días promedio para pagar
  invoiceCount: number;
  projects: {
    projectId: string;
    projectName: string;
    amount: number;
    paidAmount: number;
    pendingAmount: number;
  }[];
  paymentHistory: {
    month: string;
    amount: number;
    invoiceCount: number;
  }[];
}

// Resumen financiero trimestral
export interface QuarterlyFinancialSummary {
  quarter: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
  activeProjects: number;
  completedProjects: number;
  newProjects: number;
  monthlyBreakdown: {
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }[];
  topExpenseCategories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  topProjects: {
    projectId: string;
    projectName: string;
    income: number;
    expenses: number;
    profit: number;
  }[];
}

// Desglose de costos por proyecto
export interface ProjectCostBreakdown {
  project: {
    id: string;
    name: string;
    client: string;
    budget: number;
  };
  costBreakdown: {
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercentage: number;
    subcategories: {
      subcategory: string;
      amount: number;
      percentage: number;
    }[];
  }[];
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  budgetUtilization: number;
  costPerformanceIndex: number;
}

// Análisis de ingresos anuales
export interface AnnualRevenueAnalysis {
  year: number;
  totalRevenue: number;
  totalRevenueCRC: number;
  totalRevenueUSD: number;
  monthlyRevenue: {
    month: string;
    amount: number;
    amountCRC: number;
    amountUSD: number;
    projectCount: number;
  }[];
  clientBreakdown: {
    clientId: string;
    clientName: string;
    revenue: number;
    projectCount: number;
    percentage: number;
  }[];
  projectTypeBreakdown: {
    type: string;
    revenue: number;
    projectCount: number;
    percentage: number;
  }[];
  growthRate: number; // Comparado con el año anterior
  averageProjectValue: number;
}

// Análisis de tendencias de gastos
export interface ExpenseTrendAnalysis {
  period: string;
  categories: {
    category: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
    monthlyData: {
      month: string;
      amount: number;
    }[];
    averageMonthlyAmount: number;
    peakMonth: string;
    lowestMonth: string;
  }[];
  totalTrend: 'increasing' | 'decreasing' | 'stable';
  totalTrendPercentage: number;
  seasonalPatterns: {
    quarter: string;
    averageAmount: number;
    pattern: string;
  }[];
}

// Datos generales para reportes
export interface CustomReportData {
  config: CustomReportConfig;
  data: 
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
  summary: {
    totalRecords: number;
    totalAmount?: number;
    averageAmount?: number;
    currency: string;
    generatedAt: string;
  };
  charts?: {
    type: 'bar' | 'line' | 'pie' | 'area';
    title: string;
    data: any[];
  }[];
}

// Plantillas predefinidas de reportes
export interface CustomReportTemplate {
  id: string;
  name: string;
  description: string;
  reportType: CustomReportType;
  defaultConfig: Partial<CustomReportConfig>;
  icon: string;
  category: 'financial' | 'operational' | 'analytical';
}

// Constantes para las plantillas
export const CUSTOM_REPORT_TEMPLATES: CustomReportTemplate[] = [
  {
    id: 'direct_expenses_monthly',
    name: 'Gastos Directos Mensuales',
    description: 'Análisis de gastos directos por proyecto en un mes específico',
    reportType: 'direct_expenses_by_project_month',
    defaultConfig: {
      period: 'monthly',
      includeCharts: true,
      includeSummary: true,
      includeDetails: true,
      exportFormat: 'pdf'
    },
    icon: 'DollarSign',
    category: 'financial'
  },
  {
    id: 'project_income_total',
    name: 'Ingresos Totales por Proyecto',
    description: 'Resumen completo de ingresos generados por cada proyecto',
    reportType: 'project_total_income',
    defaultConfig: {
      period: 'custom',
      includeCharts: true,
      includeSummary: true,
      includeDetails: true,
      exportFormat: 'pdf'
    },
    icon: 'TrendingUp',
    category: 'financial'
  },
  {
    id: 'supplier_yearly_expenses',
    name: 'Gastos Anuales por Proveedor',
    description: 'Análisis detallado de gastos realizados a cada proveedor durante el año',
    reportType: 'supplier_expenses_by_year',
    defaultConfig: {
      period: 'yearly',
      includeCharts: true,
      includeSummary: true,
      includeDetails: true,
      exportFormat: 'pdf'
    },
    icon: 'Users',
    category: 'operational'
  },
  {
    id: 'monthly_category_expenses',
    name: 'Gastos Mensuales por Categoría',
    description: 'Desglose de gastos por categoría en períodos mensuales',
    reportType: 'monthly_expenses_by_category',
    defaultConfig: {
      period: 'monthly',
      includeCharts: true,
      includeSummary: true,
      includeDetails: true,
      exportFormat: 'pdf'
    },
    icon: 'PieChart',
    category: 'analytical'
  },
  {
    id: 'project_profitability',
    name: 'Análisis de Rentabilidad',
    description: 'Análisis completo de rentabilidad y ROI por proyecto',
    reportType: 'project_profitability_analysis',
    defaultConfig: {
      period: 'custom',
      includeCharts: true,
      includeSummary: true,
      includeDetails: true,
      exportFormat: 'pdf'
    },
    icon: 'BarChart3',
    category: 'analytical'
  },
  {
    id: 'supplier_payment_analysis',
    name: 'Análisis de Pagos a Proveedores',
    description: 'Estado de pagos y análisis de relaciones con proveedores',
    reportType: 'supplier_payment_analysis',
    defaultConfig: {
      period: 'custom',
      includeCharts: true,
      includeSummary: true,
      includeDetails: true,
      exportFormat: 'pdf'
    },
    icon: 'CreditCard',
    category: 'operational'
  }
];