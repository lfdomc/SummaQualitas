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
import { CustomReportsService } from '@/lib/services/custom-reports';
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
  const [selectedTemplate, setSelectedTemplate] = useState<CustomReportType | ''>('direct_expenses_by_project_month');
  
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

  return (
    <div className="space-y-6">
      {/* Selección de Proyectos */}
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
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.reportType ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleTemplateSelect(template.reportType)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getTemplateIcon(template.reportType)}
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
                  <SelectItem key="format-pdf" value="pdf">PDF</SelectItem>
                  <SelectItem key="format-excel" value="excel">Excel</SelectItem>
                  <SelectItem key="format-csv" value="csv">CSV</SelectItem>
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

          {/* Periodo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Periodo</Label>
              <Select 
                value={config.period} 
                onValueChange={(value: ReportPeriod) => 
                  setConfig(prev => ({ ...prev, period: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="period-monthly" value="monthly">Mensual</SelectItem>
                  <SelectItem key="period-quarterly" value="quarterly">Trimestral</SelectItem>
                  <SelectItem key="period-yearly" value="yearly">Anual</SelectItem>
                  <SelectItem key="period-custom" value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Pickers */}
            <div className="space-y-2">
              <Label>Desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(config.dateRange.from, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.from}
                    onSelect={(date) => setConfig(prev => ({ 
                      ...prev, 
                      dateRange: {
                        ...prev.dateRange,
                        from: date || new Date()
                      }
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(config.dateRange.to, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.to}
                    onSelect={(date) => setConfig(prev => ({ 
                      ...prev, 
                      dateRange: {
                        ...prev.dateRange,
                        to: date || new Date()
                      }
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filtros Avanzados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros Avanzados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categorías</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Subcontratos', 'Materiales', 'Servicios', 'Transporte', 'Otros'].map(cat => (
                      <Badge
                        key={cat}
                        variant={config.filters.categories?.includes(cat) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setConfig(prev => ({
                            ...prev,
                            filters: {
                              ...prev.filters,
                              categories: prev.filters.categories?.includes(cat)
                                ? prev.filters.categories.filter(c => c !== cat)
                                : [...(prev.filters.categories || []), cat]
                            }
                          }));
                        }}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select 
                    value={config.filters.currency || 'both'} 
                    onValueChange={(value: 'CRC' | 'USD' | 'both') => 
                      setConfig(prev => ({ 
                        ...prev, 
                        filters: { ...prev.filters, currency: value } 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Ambas</SelectItem>
                      <SelectItem value="CRC">CRC</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Vista Previa del Reporte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Vista Previa del Reporte Seleccionado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomReportPreview config={config} data={previewData} />
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => {}} // handle preview is inside CustomReportPreview
          disabled={loading || !selectedTemplate}
        >
          <Eye className="h-4 w-4 mr-2" />
          {loading ? 'Generando Vista Previa...' : 'Vista Previa'}
        </Button>
        <Button 
          onClick={() => {}} // generation handled elsewhere
          disabled={loading || !selectedTemplate}
        >
          <Download className="h-4 w-4 mr-2" />
          {loading ? 'Generando...' : 'Generar Reporte'}
        </Button>
      </div>
    </div>
  );
}

// Utilidades
const getStatusColor = (status: ProjectStatus | string) => {
  switch (status) {
    case 'active':
    case 'en_progreso': return 'bg-green-100 text-green-800';
    case 'completed':
    case 'completado': return 'bg-blue-100 text-blue-800';
    case 'on_hold':
    case 'pausado': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
    case 'cancelado': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: ProjectStatus | string) => {
  switch (status) {
    case 'active': return 'Activo';
    case 'completed': return 'Completado';
    case 'on_hold': return 'En Pausa';
    case 'cancelled': return 'Cancelado';
    case 'en_progreso': return 'En Progreso';
    case 'pausado': return 'Pausado';
    case 'completado': return 'Completado';
    case 'cancelado': return 'Cancelado';
    default: return 'Desconocido';
  }
};

const getTemplateIcon = (type: CustomReportType) => {
  switch (type) {
    case 'direct_expenses_by_project_month': return <DollarSign className="h-4 w-4" />;
    case 'project_total_income': return <TrendingUp className="h-4 w-4" />;
    case 'supplier_expenses_by_year': return <Users className="h-4 w-4" />;
    case 'monthly_expenses_by_category': return <PieChart className="h-4 w-4" />;
    case 'project_profitability_analysis': return <BarChart3 className="h-4 w-4" />;
    case 'supplier_payment_analysis': return <Wallet className="h-4 w-4" />;
    case 'quarterly_financial_summary': return <Clock className="h-4 w-4" />;
    case 'project_cost_breakdown': return <Building2 className="h-4 w-4" />;
    case 'annual_revenue_analysis': return <Target className="h-4 w-4" />;
    case 'expense_trend_analysis': return <FileText className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

export { ReportGenerator };