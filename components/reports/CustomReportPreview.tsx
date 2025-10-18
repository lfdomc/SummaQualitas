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
    }).format(amount || 0);
  };

  const renderDirectExpensesByProjectMonth = (items: DirectExpensesByProjectMonth[]) => (
    <div className="space-y-6">
      {(() => {
        const totalCRC = (items || []).reduce((sum, it) => sum + (it.totalInCRC || 0), 0);
        const projectsCount = (items || []).length;
        const month = items?.[0]?.month;
        const year = items?.[0]?.year;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Gastos (CRC)</p>
                    <p className="text-lg font-semibold">{formatCurrency(totalCRC, 'CRC')}</p>
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
                    <p className="text-lg font-semibold">{projectsCount}</p>
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
                    <p className="text-lg font-semibold">{month}/{year}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(items || []).map((item, index) => (
              <div key={item.project?.id || `expense-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.project?.name}</p>
                  <p className="text-sm text-gray-600">{item.expenseCount} gastos</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(item.totalInCRC, 'CRC')}</p>
                  <Badge variant="secondary" className="text-xs">CRC</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectTotalIncome = (items: ProjectTotalIncome[]) => (
    <div className="space-y-6">
      {(() => {
        const totalIncome = (items || []).reduce((sum, it) => sum + (it.totalIncome || 0), 0);
        const projectsCount = (items || []).length || 1;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Ingresos Totales</p>
                    <p className="text-lg font-semibold">{formatCurrency(totalIncome)}</p>
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
                    <p className="text-lg font-semibold">{projectsCount}</p>
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
                    <p className="text-lg font-semibold">{formatCurrency(totalIncome / projectsCount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(items || []).map((it, index) => (
              <div key={it.project?.id || `income-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{it.project?.name}</p>
                  <p className="text-sm text-gray-600">{it.incomeCount} ingresos</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(it.totalIncome)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSupplierExpensesByYear = (items: SupplierExpensesByYear[]) => (
    <div className="space-y-6">
      {(() => {
        const totalExpenses = (items || []).reduce((sum, it) => sum + (it.totalExpenses || 0), 0);
        const supplierCount = (items || []).length;
        const year = items?.[0]?.year;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Gastos</p>
                    <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
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
                    <p className="text-lg font-semibold">{supplierCount}</p>
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
                    <p className="text-lg font-semibold">{year}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(items || []).map((it, index) => (
              <div key={it.supplier?.id || `supplier-expense-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{it.supplier?.name}</p>
                  <p className="text-sm text-gray-600">{it.expenseCount} transacciones</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(it.totalExpenses)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMonthlyExpensesByCategory = (items: MonthlyExpensesByCategory[]) => {
    const entry = (items || [])[0];
    if (!entry) {
      return (
        <div className="text-center py-8 text-gray-500">No hay datos para el período seleccionado</div>
      );
    }
    const categoryCount = entry.categories?.length || 0;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Gastos</p>
                  <p className="text-lg font-semibold">{formatCurrency(entry.totalAmount)}</p>
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
                  <p className="text-lg font-semibold">{categoryCount}</p>
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
                  <p className="text-lg font-semibold">{entry.month}/{entry.year}</p>
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
              {(entry.categories || []).map((cat, index) => (
                <div key={cat.category || `category-${index}`} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{cat.category}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {cat.percentage?.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Monto (CRC)</p>
                      <p className="font-semibold">{formatCurrency(cat.amountCRC, 'CRC')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Monto (USD)</p>
                      <p className="font-semibold">{formatCurrency(cat.amountUSD, 'USD')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Transacciones</p>
                      <p className="font-semibold">{cat.count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProjectProfitabilityAnalysis = (items: ProjectProfitabilityAnalysis[]) => (
    <div className="space-y-6">
      {(() => {
        const totalIncome = (items || []).reduce((sum, it) => sum + (it.totalIncome || 0), 0);
        const totalExpenses = (items || []).reduce((sum, it) => sum + (it.totalExpenses || 0), 0);
        const grossProfit = totalIncome - totalExpenses;
        const margin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Ingresos Totales</p>
                    <p className="text-lg font-semibold">{formatCurrency(totalIncome)}</p>
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
                    <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Ganancia Bruta</p>
                    <p className="text-lg font-semibold">{formatCurrency(grossProfit)}</p>
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
                    <p className="text-lg font-semibold">{margin.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle>Análisis por Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(items || []).map((it, index) => (
              <div key={it.project?.id || `project-${index}`} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{it.project?.name}</h4>
                  <Badge 
                    variant={it.grossProfit > 0 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {it.grossProfit > 0 ? 'Rentable' : 'Pérdida'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ingresos</p>
                    <p className="font-semibold">{formatCurrency(it.totalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gastos</p>
                    <p className="font-semibold">{formatCurrency(it.totalExpenses)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ganancia</p>
                    <p className={`font-semibold ${it.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(it.grossProfit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Margen</p>
                    <p className={`font-semibold ${it.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {it.profitMargin.toFixed(1)}%
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

  const renderSupplierPaymentAnalysis = (items: SupplierPaymentAnalysis[]) => (
    <div className="space-y-6">
      {(() => {
        const totalPaid = (items || []).reduce((sum, it) => sum + (it.paidAmount || 0), 0);
        const totalPending = (items || []).reduce((sum, it) => sum + (it.pendingAmount || 0), 0);
        const supplierCount = (items || []).length;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Pagado</p>
                    <p className="text-lg font-semibold">{formatCurrency(totalPaid)}</p>
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
                    <p className="text-lg font-semibold">{formatCurrency(totalPending)}</p>
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
                    <p className="text-lg font-semibold">{supplierCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle>Estado de Pagos por Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(items || []).map((it, index) => (
              <div key={it.supplier?.id || `supplier-${index}`} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{it.supplier?.name}</h4>
                  <Badge 
                    variant={it.pendingAmount > 0 ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {it.pendingAmount > 0 ? 'Pendiente' : 'Al día'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Pagado</p>
                    <p className="font-semibold text-green-600">{formatCurrency(it.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pendiente</p>
                    <p className="font-semibold text-red-600">{formatCurrency(it.pendingAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Transacciones</p>
                    <p className="font-semibold">{it.invoiceCount}</p>
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
        return renderDirectExpensesByProjectMonth(data as DirectExpensesByProjectMonth[]);
      case 'project_total_income':
        return renderProjectTotalIncome(data as ProjectTotalIncome[]);
      case 'supplier_expenses_by_year':
        return renderSupplierExpensesByYear(data as SupplierExpensesByYear[]);
      case 'monthly_expenses_by_category':
        return renderMonthlyExpensesByCategory(data as MonthlyExpensesByCategory[]);
      case 'project_profitability_analysis':
        return renderProjectProfitabilityAnalysis(data as ProjectProfitabilityAnalysis[]);
      case 'supplier_payment_analysis':
        return renderSupplierPaymentAnalysis(data as SupplierPaymentAnalysis[]);
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
                <p className="font-medium">{format(config.dateRange.from, 'PPP', { locale: es })}</p>
              </div>
            )}
            {config.dateRange.to && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha de Fin</p>
                <p className="font-medium">{format(config.dateRange.to, 'PPP', { locale: es })}</p>
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