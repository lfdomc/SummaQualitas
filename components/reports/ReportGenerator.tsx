'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project, ProjectStatus } from '@/lib/types';
import { Supplier } from '@/lib/types';
import { 
  CustomReportType, 
  CustomReportConfig, 
  CustomReportFilters,
  CUSTOM_REPORT_TEMPLATES,
  ExportFormat,
  ReportPeriod
} from '@/lib/types/custom-reports';
import { projectService } from '@/lib/supabase/database';
import { supplierService } from '@/lib/supabase/database';
import CustomReportsService from '@/lib/services/custom-reports';
import { generateCustomPDFReport } from '@/lib/services/custom-pdf-generator';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { 
  CalendarIcon, 
  FileText, 
  Download, 
  Eye, 
  Settings, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  AlertTriangle,
  Building2,
  PieChart,
  Target,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CustomReportPreview from './CustomReportPreview';

function ReportGenerator() {
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomReportType | ''>('');
  
  const [config, setConfig] = useState<CustomReportConfig>({
    reportType: 'direct_expenses_by_project_month',
    title: '',
    description: '',
    period: 'monthly',
    dateRange: {
      from: new Date(),
      to: new Date()
    },
    exportFormat: 'pdf',
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
    filters: {
      projectIds: [],
      supplierIds: [],
      categories: [],
      currency: 'both'
    }
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [projectsData, suppliersData] = await Promise.all([
        projectService.getProjects(),
        supplierService.getSuppliers()
      ]);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateType: CustomReportType) => {
    const template = CUSTOM_REPORT_TEMPLATES.find(t => t.reportType === templateType);
    if (template) {
      setSelectedTemplate(templateType);
      setConfig(prev => ({
        ...prev,
        reportType: templateType,
        title: template.name,
        description: template.description,
        period: template.defaultConfig.period || 'monthly',
        filters: {
          ...prev.filters,
          categories: template.defaultConfig.filters?.categories || []
        }
      }));
    }
  };

  const handleProjectToggle = (projectId: string) => {
    setConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        projectIds: prev.filters.projectIds?.includes(projectId)
          ? prev.filters.projectIds.filter(id => id !== projectId)
          : [...(prev.filters.projectIds || []), projectId]
      }
    }));
  };

  const handleSupplierToggle = (supplierId: string) => {
    setConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        supplierIds: prev.filters.supplierIds?.includes(supplierId)
          ? prev.filters.supplierIds.filter(id => id !== supplierId)
          : [...(prev.filters.supplierIds || []), supplierId]
      }
    }));
  };

  const handleSelectAllProjects = () => {
    setConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        projectIds: projects.map(p => p.id)
      }
    }));
  };

  const handleDeselectAllProjects = () => {
    setConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        projectIds: []
      }
    }));
  };

  const handleSelectAllSuppliers = () => {
    setConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        supplierIds: suppliers.map(s => s.id)
      }
    }));
  };

  const handleDeselectAllSuppliers = () => {
    setConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        supplierIds: []
      }
    }));
  };

  const generateReport = async () => {
    try {
      // Validación básica
      if (!config.title.trim()) {
        alert('Por favor, ingresa un título para el reporte');
        return;
      }

      setGenerating(true);

      // Generar datos según el tipo de reporte
      let reportData;
      
      switch (config.reportType) {
        case 'direct_expenses_by_project_month':
          if (!config.dateRange.from) {
            alert('Por favor, selecciona una fecha para el reporte mensual');
            return;
          }
          const month = config.dateRange.from.getMonth() + 1;
          const year = config.dateRange.from.getFullYear();
          reportData = await CustomReportsService.getDirectExpensesByProjectMonth(
            config.filters.projectIds || [],
            month,
            year,
            config.filters
          );
          break;

        case 'project_total_income':
          reportData = await CustomReportsService.getProjectTotalIncome(
            config.filters.projectIds || [],
            config.dateRange.from?.toISOString().split('T')[0],
            config.dateRange.to?.toISOString().split('T')[0],
            config.filters
          );
          break;

        case 'supplier_expenses_by_year':
          if (!config.dateRange.from) {
            alert('Por favor, selecciona un año para el reporte');
            return;
          }
          const reportYear = config.dateRange.from.getFullYear();
          reportData = await CustomReportsService.getSupplierExpensesByYear(
            reportYear,
            config.filters.supplierIds,
            config.filters
          );
          break;

        case 'monthly_expenses_by_category':
          if (!config.dateRange.from) {
            alert('Por favor, selecciona una fecha para el reporte mensual');
            return;
          }
          const expenseMonth = config.dateRange.from.getMonth() + 1;
          const expenseYear = config.dateRange.from.getFullYear();
          reportData = await CustomReportsService.getMonthlyExpensesByCategory(
            expenseMonth,
            expenseYear,
            config.filters
          );
          break;

        case 'project_profitability_analysis':
          reportData = await CustomReportsService.getProjectProfitabilityAnalysis(
            config.filters.projectIds || [],
            config.dateRange.from?.toISOString().split('T')[0],
            config.dateRange.to?.toISOString().split('T')[0]
          );
          break;

        case 'supplier_payment_analysis':
          reportData = await CustomReportsService.getSupplierPaymentAnalysis(
            config.filters.supplierIds || [],
            config.dateRange.from?.toISOString().split('T')[0],
            config.dateRange.to?.toISOString().split('T')[0]
          );
          break;

        default:
          alert('Tipo de reporte no implementado');
          return;
      }

      // Generar reporte según el formato
      if (config.exportFormat === 'pdf') {
        await generateCustomPDFReport(config, reportData);
      } else if (config.exportFormat === 'excel') {
        // TODO: Implementar generación de Excel
        alert('Generación de Excel no implementada aún');
      } else if (config.exportFormat === 'csv') {
        // TODO: Implementar generación de CSV
        alert('Generación de CSV no implementada aún');
      }

      alert('Reporte generado exitosamente');

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar el reporte. Por favor, intenta nuevamente.');
    } finally {
      setGenerating(false);
    }
  };

  const previewReport = async () => {
    try {
      if (!config.title.trim()) {
        alert('Por favor, ingresa un título para el reporte');
        return;
      }

      setLoading(true);

      // Generar vista previa de datos
      let previewData;
      
      switch (config.reportType) {
        case 'direct_expenses_by_project_month':
          if (!config.dateRange.from) {
            alert('Por favor, selecciona una fecha para el reporte mensual');
            return;
          }
          const month = config.dateRange.from.getMonth() + 1;
          const year = config.dateRange.from.getFullYear();
          previewData = await CustomReportsService.getDirectExpensesByProjectMonth(
            config.filters.projectIds || [],
            month,
            year,
            config.filters
          );
          break;

        case 'project_total_income':
          previewData = await CustomReportsService.getProjectTotalIncome(
            config.filters.projectIds || [],
            config.dateRange.from?.toISOString().split('T')[0],
            config.dateRange.to?.toISOString().split('T')[0],
            config.filters
          );
          break;

        case 'supplier_expenses_by_year':
          if (!config.dateRange.from) {
            alert('Por favor, selecciona un año para el reporte');
            return;
          }
          const reportYear = config.dateRange.from.getFullYear();
          previewData = await CustomReportsService.getSupplierExpensesByYear(
            reportYear,
            config.filters.supplierIds,
            config.filters
          );
          break;

        default:
          previewData = { message: 'Vista previa no disponible para este tipo de reporte' };
      }

      setPreviewData(previewData);
      setShowPreview(true);

    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error al generar la vista previa. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ProjectStatus): string => {
    switch (status) {
      case 'planning': return 'Planificación';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'on_hold': return 'En Pausa';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const getTemplateIcon = (type: CustomReportType) => {
    switch (type) {
      case 'direct_expenses_by_project_month':
        return <Building2 key="direct-expenses-icon" className="h-5 w-5" />;
      case 'project_total_income':
        return <DollarSign key="project-income-icon" className="h-5 w-5" />;
      case 'supplier_expenses_by_year':
        return <Users key="supplier-expenses-icon" className="h-5 w-5" />;
      case 'monthly_expenses_by_category':
        return <PieChart key="monthly-expenses-icon" className="h-5 w-5" />;
      case 'project_profitability_analysis':
        return <TrendingUp key="profitability-icon" className="h-5 w-5" />;
      case 'supplier_payment_analysis':
        return <Wallet key="supplier-payment-icon" className="h-5 w-5" />;
      case 'quarterly_financial_summary':
        return <BarChart3 key="quarterly-summary-icon" className="h-5 w-5" />;
      case 'project_cost_breakdown':
        return <Target key="cost-breakdown-icon" className="h-5 w-5" />;
      case 'annual_revenue_analysis':
        return <TrendingUp key="annual-revenue-icon" className="h-5 w-5" />;
      case 'expense_trend_analysis':
        return <BarChart3 key="expense-trend-icon" className="h-5 w-5" />;
      default:
        return <FileText key="default-icon" className="h-5 w-5" />;
    }
  };

  const requiresProjects = ['direct_expenses_by_project_month', 'project_total_income', 'project_profitability_analysis'];
  const requiresSuppliers = ['supplier_expenses_by_year', 'supplier_payment_analysis'];

  return (
    <div className="space-y-6">
      {/* Plantillas de Reportes Personalizados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Reportes Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CUSTOM_REPORT_TEMPLATES.map((template) => (
              <Card 
                key={template.type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.type ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleTemplateSelect(template.type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getTemplateIcon(template.type)}
                    <h3 className="font-medium text-sm">{template.name}</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs">
                      {(() => {
                        switch (template.defaultConfig.period) {
                          case 'monthly': return 'Mensual';
                          case 'yearly': return 'Anual';
                          case 'quarterly': return 'Trimestral';
                          default: return 'Personalizado';
                        }
                      })()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuración Básica del Reporte */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Reporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Reporte</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ingresa el título del reporte"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Formato de Exportación</Label>
              <Select 
                value={config.exportFormat} 
                onValueChange={(value: ExportFormat) => 
                  setConfig(prev => ({ ...prev, exportFormat: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="pdf" value="pdf">PDF</SelectItem>
                  <SelectItem key="excel" value="excel">Excel</SelectItem>
                  <SelectItem key="csv" value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción opcional del reporte"
              rows={3}
            />
          </div>

          {/* Rango de Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.from ? format(config.dateRange.from, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.from}
                    onSelect={(date) => setConfig(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, from: date || new Date() }
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.to ? format(config.dateRange.to, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.to}
                    onSelect={(date) => setConfig(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, to: date || new Date() }
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filtro de Moneda */}
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select 
              value={config.filters.currency} 
              onValueChange={(value: 'CRC' | 'USD' | 'both') => 
                setConfig(prev => ({ 
                  ...prev, 
                  filters: { ...prev.filters, currency: value }
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="both" value="both">Ambas Monedas</SelectItem>
                <SelectItem key="CRC" value="CRC">Colones (CRC)</SelectItem>
                <SelectItem key="USD" value="USD">Dólares (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selección de Proyectos */}
      {requiresProjects.includes(config.reportType) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Proyectos a Incluir</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAllProjects}
                >
                  Seleccionar Todos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeselectAllProjects}
                >
                  Deseleccionar Todos
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Cargando proyectos...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={project.id}
                      checked={config.filters.projectIds?.includes(project.id) || false}
                      onCheckedChange={() => handleProjectToggle(project.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={project.id} className="font-medium cursor-pointer">
                        {project.name}
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                        {project.budget && (
                          <span className="text-sm text-gray-500">
                            ${project.budget.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selección de Proveedores */}
      {requiresSuppliers.includes(config.reportType) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Proveedores a Incluir</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAllSuppliers}
                >
                  Seleccionar Todos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeselectAllSuppliers}
                >
                  Deseleccionar Todos
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Cargando proveedores...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={supplier.id}
                      checked={config.filters.supplierIds?.includes(supplier.id) || false}
                      onCheckedChange={() => handleSupplierToggle(supplier.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={supplier.id} className="font-medium cursor-pointer">
                        {supplier.name}
                      </Label>
                      <div className="mt-1">
                        <span className="text-sm text-gray-500">
                          {supplier.contact_name || 'Sin contacto'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botones de Acción */}
      <div className="flex justify-end gap-4">
        <Button 
          variant="outline" 
          onClick={previewReport}
          disabled={generating || loading}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Vista Previa
        </Button>
        <Button 
          onClick={generateReport}
          disabled={generating || loading}
          className="flex items-center gap-2"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Generar Reporte
            </>
          )}
        </Button>
      </div>

      {/* Modal de Vista Previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa del Reporte</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <CustomReportPreview config={config} data={previewData} />

            {/* Botones de Acción */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cerrar
              </Button>
              <Button onClick={() => {
                setShowPreview(false);
                generateReport();
              }} disabled={generating}>
                {generating ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { ReportGenerator };