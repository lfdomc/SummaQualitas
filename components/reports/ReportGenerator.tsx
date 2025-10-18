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
import { 
  DirectExpensesByProjectMonth,
  ProjectTotalIncome,
  SupplierExpensesByYear,
  ProjectProfitabilityAnalysis
} from '@/lib/types/custom-reports';

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

// Unimos directamente los tipos reales que devuelven los servicios
 type ReportData = 
  | DirectExpensesByProjectMonth 
  | ProjectTotalIncome 
  | SupplierExpensesByYear 
  | ProjectProfitabilityAnalysis;

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
    name: 'Resumen por Proveedor',
    description: 'Gastos por proveedor durante el año',
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    id: 'monthly_overview' as SimpleReportType,
    name: 'Análisis de Rentabilidad',
    description: 'Resumen de ingresos/gastos y KPIs por proyecto',
    icon: <FileText className="h-4 w-4" />
  }
];

function ReportGenerator() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ReportData[] | null>(null);
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
      let reportData: ReportData[];
      
      switch (config.type) {
        case 'project_expenses': {
          const month = config.dateFrom.getMonth() + 1;
          const year = config.dateFrom.getFullYear();
          const data = await CustomReportsService.getDirectExpensesByProjectMonth(
            config.projectIds,
            month,
            year
          );
          reportData = data as DirectExpensesByProjectMonth[];
          break;
        }

        case 'project_income': {
          const data = await CustomReportsService.getProjectTotalIncome(
            config.projectIds,
            config.dateFrom.toISOString().split('T')[0],
            config.dateTo.toISOString().split('T')[0]
          );
          reportData = data as ProjectTotalIncome[];
          break;
        }

        case 'project_summary': {
          const reportYear = config.dateFrom.getFullYear();
          const data = await CustomReportsService.getSupplierExpensesByYear(
            reportYear,
            undefined,
            { projectIds: config.projectIds }
          );
          reportData = data as SupplierExpensesByYear[];
          break;
        }

        case 'monthly_overview': {
          const data = await CustomReportsService.getProjectProfitabilityAnalysis(
            config.projectIds,
            config.dateFrom.toISOString().split('T')[0],
            config.dateTo.toISOString().split('T')[0]
          );
          reportData = data as ProjectProfitabilityAnalysis[];
          break;
        }

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

  const getClientName = (client: any) => {
    if (!client) return 'Sin cliente';
    if (typeof client === 'string') return client;
    return client.name || 'Sin cliente';
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
              >
                Seleccionar Todos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeselectAllProjects}
              >
                Quitar Todos
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-auto">
            {projects.map(project => (
              <div key={project.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div>
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-gray-600">{getClientName(project.client)}</div>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                </div>
                <Checkbox 
                  checked={config.projectIds.includes(project.id)} 
                  onCheckedChange={() => handleProjectToggle(project.id)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handlePreview}
          disabled={previewLoading || loading || config.projectIds.length === 0}
        >
          <Eye className="h-4 w-4 mr-2" />
          {previewLoading ? 'Generando Vista Previa...' : 'Vista Previa'}
        </Button>
        <Button 
          onClick={generateReport}
          disabled={generating || loading || config.projectIds.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          {generating ? 'Generando...' : 'Generar Reporte'}
        </Button>
      </div>

      {/* Vista Previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista Previa: {config.title || 'Reporte'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            <ReportPreviewContent type={config.type} data={previewData} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Formateo común
const formatCurrency = (value: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(value);
const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(d);
};

// Render de vista previa por tipo
const ReportPreviewContent: React.FC<{ type: SimpleReportType; data: ReportData[] | null }> = ({ type, data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos disponibles para la vista previa
      </div>
    );
  }

  switch (type) {
    case 'project_expenses':
      return (
        <div className="space-y-6">
          {data.map((item, index) => {
            const projectData = item as DirectExpensesByProjectMonth;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {projectData.project.name}
                    <span className="text-sm text-gray-500 ml-2">({projectData.project.client})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total en CRC:</span>
                        <span className="font-semibold">{formatCurrency(projectData.totalInCRC)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total en USD:</span>
                        <span className="font-semibold">${projectData.totalInUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Número de Gastos:</span>
                        <span className="font-semibold">{projectData.expenseCount}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-2">Gastos Directos</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Subcontratos</span>
                          <span>{formatCurrency(projectData.directExpenses.subcontratos)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Materiales</span>
                          <span>{formatCurrency(projectData.directExpenses.materiales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Otros</span>
                          <span>{formatCurrency(projectData.directExpenses.otros)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Total</span>
                          <span>{formatCurrency(projectData.directExpenses.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      );

    case 'project_income':
      return (
        <div className="space-y-6">
          {data.map((item, index) => {
            const incomeData = item as ProjectTotalIncome;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {incomeData.project.name}
                    <span className="text-sm text-gray-500 ml-2">({incomeData.project.client})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total de Ingresos:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(incomeData.totalIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ingresos Confirmados:</span>
                        <span className="font-semibold">{formatCurrency(incomeData.confirmedIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ingresos Pendientes:</span>
                        <span className="font-semibold">{formatCurrency(incomeData.pendingIncome)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Número de Ingresos</div>
                        <div className="text-3xl font-bold">{incomeData.incomeCount}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      );

    case 'project_summary':
      return (
        <div className="space-y-6">
          {data.map((item, index) => {
            const supplierData = item as SupplierExpensesByYear;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {supplierData.supplier.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total de Gastos:</span>
                        <span className="font-semibold">{formatCurrency(supplierData.totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Número de Gastos:</span>
                        <span className="font-semibold">{supplierData.expenseCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Año:</span>
                        <span className="font-semibold">{supplierData.year}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-2">Por Proyecto</div>
                      <div className="space-y-1">
                        {supplierData.projects.map((proj, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{proj.projectName}</span>
                            <span>{formatCurrency(proj.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      );

    case 'monthly_overview':
      return (
        <div className="space-y-6">
          {data.map((item, index) => {
            const projectData = item as ProjectProfitabilityAnalysis;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {projectData.project.name}
                    <span className="text-sm text-gray-500 ml-2">
                      ({projectData.project.client})
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
            );
          })}
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