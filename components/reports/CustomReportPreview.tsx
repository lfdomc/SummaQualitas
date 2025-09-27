'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CustomReportType, 
  CustomReportConfig,
  DirectExpensesByProjectMonth,
  ProjectTotalIncome,
  SupplierExpensesByYear,
  MonthlyExpensesByCategory,
  ProjectProfitabilityAnalysis,
  SupplierPaymentAnalysis,
  CUSTOM_REPORT_TEMPLATES
} from '@/lib/types/custom-reports';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Building2, 
  Users, 
  PieChart,
  BarChart3,
  Target,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomReportPreviewProps {
  config: CustomReportConfig;
  data: any;
}

export default function CustomReportPreview({ config, data }: CustomReportPreviewProps) {
  const template = CUSTOM_REPORT_TEMPLATES.find(t => t.reportType === config.reportType);

  const formatCurrency = (amount: number, currency: string = 'CRC') => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderDirectExpensesByProjectMonth = (reportData: DirectExpensesByProjectMonth) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Gastos</p>
                <p className="text-lg font-semibold">{formatCurrency(reportData.totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Proyectos</p>
                <p className="text-lg font-semibold">{reportData.projectCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Período</p>
                <p className="text-lg font-semibold">{reportData.month}/{reportData.year}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.expenses.map((expense, index) => (
              <div key={expense.projectName || `expense-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{expense.projectName}</p>
                  <p className="text-sm text-gray-600">{expense.expenseCount} gastos</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(expense.totalAmount, expense.currency)}</p>
                  <Badge variant="secondary" className="text-xs">
                    {expense.currency}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectTotalIncome = (reportData: ProjectTotalIncome) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-lg font-semibold">{formatCurrency(reportData.totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Proyectos</p>
                <p className="text-lg font-semibold">{reportData.projectCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Promedio por Proyecto</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(reportData.totalIncome / reportData.projectCount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.incomes.map((income, index) => (
              <div key={income.projectName || `income-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{income.projectName}</p>
                  <p className="text-sm text-gray-600">{income.incomeCount} ingresos</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(income.totalAmount, income.currency)}</p>
                  <Badge variant="secondary" className="text-xs">
                    {income.currency}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSupplierExpensesByYear = (reportData: SupplierExpensesByYear) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Gastos</p>
                <p className="text-lg font-semibold">{formatCurrency(reportData.totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Proveedores</p>
                <p className="text-lg font-semibold">{reportData.supplierCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Año</p>
                <p className="text-lg font-semibold">{reportData.year}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.expenses.map((expense, index) => (
              <div key={expense.supplierName || `supplier-expense-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{expense.supplierName}</p>
                  <p className="text-sm text-gray-600">{expense.expenseCount} transacciones</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(expense.totalAmount, expense.currency)}</p>
                  <Badge variant="secondary" className="text-xs">
                    {expense.currency}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMonthlyExpensesByCategory = (reportData: MonthlyExpensesByCategory) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Gastos</p>
                <p className="text-lg font-semibold">{formatCurrency(reportData.totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Categorías</p>
                <p className="text-lg font-semibold">{reportData.categoryCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Período</p>
                <p className="text-lg font-semibold">{reportData.month}/{reportData.year}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.expenses.map((expense, index) => (
              <div key={expense.category || `category-expense-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{expense.category}</p>
                  <p className="text-sm text-gray-600">{expense.expenseCount} gastos</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(expense.totalAmount, expense.currency)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${expense.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">{expense.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectProfitabilityAnalysis = (reportData: ProjectProfitabilityAnalysis) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-lg font-semibold">{formatCurrency(reportData.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Gastos Totales</p>
                <p className="text-lg font-semibold">{formatCurrency(reportData.totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Ganancia Neta</p>
                <p className="text-lg font-semibold">{formatCurrency(reportData.netProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Margen (%)</p>
                <p className="text-lg font-semibold">{reportData.profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análisis por Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.projects.map((project, index) => (
              <div key={project.projectName || `project-${index}`} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{project.projectName}</h4>
                  <Badge 
                    variant={project.profitMargin > 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {project.profitMargin > 0 ? 'Rentable' : 'Pérdida'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ingresos</p>
                    <p className="font-semibold">{formatCurrency(project.revenue, project.currency)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gastos</p>
                    <p className="font-semibold">{formatCurrency(project.expenses, project.currency)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ganancia</p>
                    <p className={`font-semibold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(project.profit, project.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Margen</p>
                    <p className={`font-semibold ${project.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {project.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSupplierPaymentAnalysis = (reportData: SupplierPaymentAnalysis) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Pagado</p>
                <p className="text-lg font-semibold">{formatCurrency(reportData.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Pendiente</p>
                <p className="text-lg font-semibold">{formatCurrency(reportData.totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Proveedores</p>
                <p className="text-lg font-semibold">{reportData.supplierCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Pagos por Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.suppliers.map((supplier, index) => (
              <div key={supplier.supplierName || `supplier-${index}`} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{supplier.supplierName}</h4>
                  <Badge 
                    variant={supplier.pendingAmount > 0 ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {supplier.pendingAmount > 0 ? 'Pendiente' : 'Al día'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Pagado</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(supplier.paidAmount, supplier.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pendiente</p>
                    <p className="font-semibold text-red-600">
                      {formatCurrency(supplier.pendingAmount, supplier.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Transacciones</p>
                    <p className="font-semibold">{supplier.transactionCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGenericData = (data: any) => (
    <Card>
      <CardHeader>
        <CardTitle>Datos del Reporte</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-sm overflow-auto max-h-96 bg-gray-50 p-4 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );

  const renderReportData = () => {
    if (!data) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No hay datos disponibles para mostrar</p>
          </CardContent>
        </Card>
      );
    }

    switch (config.reportType) {
      case 'direct_expenses_by_project_month':
        return renderDirectExpensesByProjectMonth(data);
      case 'project_total_income':
        return renderProjectTotalIncome(data);
      case 'supplier_expenses_by_year':
        return renderSupplierExpensesByYear(data);
      case 'monthly_expenses_by_category':
        return renderMonthlyExpensesByCategory(data);
      case 'project_profitability_analysis':
        return renderProjectProfitabilityAnalysis(data);
      case 'supplier_payment_analysis':
        return renderSupplierPaymentAnalysis(data);
      default:
        return renderGenericData(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Información General del Reporte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {template && (
              <>
                {config.reportType === 'direct_expenses_by_project_month' && <Building2 key="direct-expenses-icon" className="h-5 w-5" />}
                {config.reportType === 'project_total_income' && <DollarSign key="project-income-icon" className="h-5 w-5" />}
                {config.reportType === 'supplier_expenses_by_year' && <Users key="supplier-expenses-icon" className="h-5 w-5" />}
                {config.reportType === 'monthly_expenses_by_category' && <PieChart key="monthly-category-icon" className="h-5 w-5" />}
                {config.reportType === 'project_profitability_analysis' && <TrendingUp key="profitability-icon" className="h-5 w-5" />}
                {config.reportType === 'supplier_payment_analysis' && <Wallet key="payment-analysis-icon" className="h-5 w-5" />}
              </>
            )}
            {config.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tipo de Reporte</p>
              <p className="font-medium">{template?.name || 'Reporte Personalizado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Formato de Exportación</p>
              <p className="font-medium">{config.exportFormat.toUpperCase()}</p>
            </div>
            {config.dateRange.from && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha de Inicio</p>
                <p className="font-medium">{format(config.dateRange.from, "PPP", { locale: es })}</p>
              </div>
            )}
            {config.dateRange.to && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha de Fin</p>
                <p className="font-medium">{format(config.dateRange.to, "PPP", { locale: es })}</p>
              </div>
            )}
          </div>
          {config.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-1">Descripción</p>
              <p className="text-sm">{config.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Datos del Reporte */}
      {renderReportData()}
    </div>
  );
}