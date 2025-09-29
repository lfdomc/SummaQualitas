'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project } from '@/lib/types';
import { projectService } from '@/lib/supabase/database';
import { 
  CalendarIcon, 
  FileText, 
  Download, 
  Eye, 
  BarChart3, 
  TrendingUp, 
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CustomReportsService from '@/lib/services/custom-reports';

// Tipos simplificados para reportes
type SimpleReportType = 
  | 'project_expenses' 
  | 'project_income' 
  | 'project_summary' 
  | 'monthly_overview';

interface SimpleReportConfig {
  type: SimpleReportType;
  title: string;
  projectIds: string[];
  dateFrom: Date;
  dateTo: Date;
  format: 'pdf' | 'excel';
}

const REPORT_TYPES = [
  {
    id: 'project_expenses' as SimpleReportType,
    name: 'Gastos por Proyecto',
    description: 'Reporte de gastos detallados por proyecto',
    icon: <DollarSign className="h-4 w-4" />
  },
  {
    id: 'project_income' as SimpleReportType,
    name: 'Ingresos por Proyecto',
    description: 'Reporte de ingresos por proyecto',
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'project_summary' as SimpleReportType,
    name: 'Resumen de Proyecto',
    description: 'Resumen general de proyectos seleccionados',
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    id: 'monthly_overview' as SimpleReportType,
    name: 'Vista Mensual',
    description: 'Resumen mensual de actividades',
    icon: <FileText className="h-4 w-4" />
  }
];

function ReportGenerator() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const [config, setConfig] = useState<SimpleReportConfig>({
    type: 'project_expenses',
    title: '',
    projectIds: [],
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    dateTo: new Date(),
    format: 'pdf'
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await projectService.getAllProjects();
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectToggle = (projectId: string) => {
    setConfig(prev => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds.filter(id => id !== projectId)
        : [...prev.projectIds, projectId]
    }));
  };

  const handleSelectAllProjects = () => {
    setConfig(prev => ({
      ...prev,
      projectIds: projects.map(p => p.id)
    }));
  };

  const handleDeselectAllProjects = () => {
    setConfig(prev => ({
      ...prev,
      projectIds: []
    }));
  };

  const generateReport = async () => {
    if (!config.title.trim()) {
      alert('Por favor, ingresa un título para el reporte');
      return;
    }

    if (config.projectIds.length === 0) {
      alert('Por favor, selecciona al menos un proyecto');
      return;
    }

    try {
      setGenerating(true);
      
      // Aquí iría la lógica de generación del reporte
      // Por ahora, simulamos la generación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Reporte "${config.title}" generado exitosamente`);
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async () => {
    if (config.projectIds.length === 0) {
      alert('Por favor, selecciona al menos un proyecto');
      return;
    }

    setPreviewLoading(true);
    try {
      let reportData;
      
      switch (config.type) {
        case 'project_expenses':
          const month = config.dateFrom.getMonth() + 1;
          const year = config.dateFrom.getFullYear();
          reportData = await CustomReportsService.getDirectExpensesByProjectMonth(
            config.projectIds,
            month,
            year
          );
          break;

        case 'project_income':
          reportData = await CustomReportsService.getProjectTotalIncome(
            config.projectIds,
            config.dateFrom.toISOString().split('T')[0],
            config.dateTo.toISOString().split('T')[0]
          );
          break;

        case 'project_summary':
          const reportYear = config.dateFrom.getFullYear();
          reportData = await CustomReportsService.getSupplierExpensesByYear(
            reportYear,
            undefined,
            { projectIds: config.projectIds }
          );
          break;

        case 'monthly_overview':
          reportData = await CustomReportsService.getProjectProfitabilityAnalysis(
            config.projectIds,
            config.dateFrom.toISOString().split('T')[0],
            config.dateTo.toISOString().split('T')[0]
          );
          break;

        default:
          alert('Tipo de reporte no implementado');
          return;
      }

      setPreviewData(reportData);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error al generar la vista previa');
    } finally {
      setPreviewLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'on_hold': return 'En Pausa';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Selección de Tipo de Reporte */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REPORT_TYPES.map((reportType) => (
              <Card 
                key={reportType.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.type === reportType.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setConfig(prev => ({ ...prev, type: reportType.id }))}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {reportType.icon}
                    <div>
                      <h3 className="font-medium">{reportType.name}</h3>
                      <p className="text-sm text-gray-600">{reportType.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuración Básica */}
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
              <Label htmlFor="format">Formato</Label>
              <Select 
                value={config.format} 
                onValueChange={(value: 'pdf' | 'excel') => 
                  setConfig(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rango de Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(config.dateFrom, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dateFrom}
                    onSelect={(date) => setConfig(prev => ({ 
                      ...prev, 
                      dateFrom: date || new Date()
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
                    {format(config.dateTo, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dateTo}
                    onSelect={(date) => setConfig(prev => ({ 
                      ...prev, 
                      dateTo: date || new Date()
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

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
                disabled={loading}
              >
                Seleccionar Todos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeselectAllProjects}
                disabled={loading}
              >
                Deseleccionar Todos
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando proyectos...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No se encontraron proyectos</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={project.id}
                    checked={config.projectIds.includes(project.id)}
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

      {/* Botones de Acción */}
      <div className="flex justify-end gap-4">
        <Button 
           variant="outline" 
           onClick={handlePreview}
           disabled={generating || loading || previewLoading || config.projectIds.length === 0}
           className="flex items-center gap-2"
         >
          {previewLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Cargando...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Vista Previa
            </>
          )}
        </Button>
        <Button 
          onClick={generateReport}
          disabled={generating || loading || config.projectIds.length === 0}
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

      {/* Información de Selección */}
      {config.projectIds.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">
              <strong>Proyectos seleccionados:</strong> {config.projectIds.length} de {projects.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <strong>Período:</strong> {format(config.dateFrom, "dd/MM/yyyy", { locale: es })} - {format(config.dateTo, "dd/MM/yyyy", { locale: es })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Vista Previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa del Reporte</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewData && (
               <ReportPreviewContent
                 reportType={config.type}
                 data={previewData}
               />
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para mostrar la vista previa del reporte
interface ReportPreviewContentProps {
  reportType: SimpleReportType;
  data: any[];
}

const ReportPreviewContent: React.FC<ReportPreviewContentProps> = ({ reportType, data }) => {
  const formatCurrency = (amount: number, currency: string = 'CRC') => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron datos para mostrar
      </div>
    );
  }

  switch (reportType) {
    case 'project_expenses':
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Gastos Directos por Proyecto</h3>
          {data.map((projectData: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">
                  {projectData.project?.name || 'Proyecto sin nombre'}
                  <span className="text-sm text-gray-500 ml-2">
                    ({projectData.project?.client || 'Cliente no especificado'})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total en CRC:</span>
                    <span className="font-semibold">
                      {formatCurrency(projectData.totalInCRC || 0, 'CRC')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total en USD:</span>
                    <span className="font-semibold">
                      {formatCurrency(projectData.totalInUSD || 0, 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Número de Gastos:</span>
                    <span>{projectData.expenseCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Período:</span>
                    <span>{projectData.month} {projectData.year}</span>
                  </div>
                  
                  {/* Desglose de gastos directos */}
                  {projectData.directExpenses && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Desglose de Gastos Directos:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Subcontratos:</span>
                          <span>{formatCurrency(projectData.directExpenses.subcontratos || 0, 'CRC')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Materiales:</span>
                          <span>{formatCurrency(projectData.directExpenses.materiales || 0, 'CRC')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Otros:</span>
                          <span>{formatCurrency(projectData.directExpenses.otros || 0, 'CRC')}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total:</span>
                          <span>{formatCurrency(projectData.directExpenses.total || 0, 'CRC')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case 'project_income':
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Ingresos Totales por Proyecto</h3>
          {data.map((projectData: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">
                  {projectData.project?.name || 'Proyecto sin nombre'}
                  <span className="text-sm text-gray-500 ml-2">
                    ({projectData.project?.client || 'Cliente no especificado'})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total de Ingresos:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(projectData.totalIncome || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Número de Ingresos:</span>
                    <span>{projectData.incomeCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado del Proyecto:</span>
                    <span className="capitalize">{projectData.project?.status || 'Sin estado'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case 'project_summary':
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Gastos por Proveedor</h3>
          {data.map((supplierData: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">
                  {supplierData.supplier?.name || 'Proveedor sin nombre'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total en CRC:</span>
                    <span className="font-semibold">
                      {formatCurrency(supplierData.totalExpensesCRC || 0, 'CRC')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total en USD:</span>
                    <span className="font-semibold">
                      {formatCurrency(supplierData.totalExpensesUSD || 0, 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Número de Gastos:</span>
                    <span>{supplierData.expenseCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Año:</span>
                    <span>{supplierData.year}</span>
                  </div>
                  
                  {/* Información de contacto */}
                  {supplierData.supplier?.contactName && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Contacto:</span>
                      <span>{supplierData.supplier.contactName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case 'monthly_overview':
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Análisis de Rentabilidad</h3>
          {data.map((projectData: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">
                  {projectData.project?.name || 'Proyecto sin nombre'}
                  <span className="text-sm text-gray-500 ml-2">
                    ({projectData.project?.client || 'Cliente no especificado'})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ingresos Totales:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(projectData.totalIncome || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gastos Totales:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(projectData.totalExpenses || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Ganancia Bruta:</span>
                      <span className={`font-semibold ${(projectData.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(projectData.grossProfit || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Margen de Ganancia:</span>
                      <span className={`font-semibold ${(projectData.profitMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(projectData.profitMargin || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ROI:</span>
                      <span className={`font-semibold ${(projectData.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(projectData.roi || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uso del Presupuesto:</span>
                      <span className="font-semibold">
                        {(projectData.budgetUtilization || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );

    default:
      return (
        <div className="text-center py-8 text-gray-500">
          Vista previa no disponible para este tipo de reporte
        </div>
      );
  }
};

export { ReportGenerator };