'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project, ProjectStatus, Report } from '@/lib/types';
import { projectService } from '@/lib/supabase/database';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';
import { generatePDFReport, ReportData } from '@/lib/services/pdfGenerator';
// Removed date-fns imports due to TypeScript issues
import {
  Download,
  FileText,
  Calendar as CalendarIcon,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Building,
  AlertTriangle,
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportConfig {
  title: string;
  description: string;
  reportType: 'financial' | 'progress' | 'performance' | 'executive' | 'custom';
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  projects: string[];
  includeCharts: boolean;
  includeKPIs: boolean;
  includeFinancials: boolean;
  includeTimeline: boolean;
  includeRisks: boolean;
  includeTeam: boolean;
  format: 'pdf' | 'excel' | 'word';
  sections: {
    executive_summary: boolean;
    project_overview: boolean;
    financial_analysis: boolean;
    progress_tracking: boolean;
    risk_assessment: boolean;
    recommendations: boolean;
    appendices: boolean;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportConfig['reportType'];
  defaultSections: Partial<ReportConfig['sections']>;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive',
    name: 'Reporte Ejecutivo',
    description: 'Resumen ejecutivo con métricas clave y estado general',
    type: 'executive',
    defaultSections: {
      executive_summary: true,
      project_overview: true,
      financial_analysis: true,
      recommendations: true
    }
  },
  {
    id: 'financial',
    name: 'Análisis Financiero',
    description: 'Análisis detallado de costos, presupuestos y rentabilidad',
    type: 'financial',
    defaultSections: {
      financial_analysis: true,
      project_overview: true,
      risk_assessment: true,
      appendices: true
    }
  },
  {
    id: 'progress',
    name: 'Seguimiento de Progreso',
    description: 'Estado de avance y cronograma de proyectos',
    type: 'progress',
    defaultSections: {
      project_overview: true,
      progress_tracking: true,
      risk_assessment: true,
      recommendations: true
    }
  },
  {
    id: 'performance',
    name: 'Análisis de Rendimiento',
    description: 'KPIs, métricas de rendimiento y análisis EVM',
    type: 'performance',
    defaultSections: {
      executive_summary: true,
      project_overview: true,
      progress_tracking: true,
      risk_assessment: true
    }
  }
];

export function ReportGenerator() {
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    title: '',
    description: '',
    reportType: 'executive',
    dateRange: {
      from: undefined,
      to: undefined
    },
    projects: [],
    includeCharts: true,
    includeKPIs: true,
    includeFinancials: true,
    includeTimeline: true,
    includeRisks: true,
    includeTeam: false,
    format: 'pdf',
    sections: {
      executive_summary: true,
      project_overview: true,
      financial_analysis: false,
      progress_tracking: false,
      risk_assessment: false,
      recommendations: false,
      appendices: false
    }
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
    
        const allProjects = await projectService.getAllProjects();
        setProjects(allProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Error al cargar los proyectos');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleTemplateSelect = (template: ReportTemplate) => {
    setConfig(prev => ({
      ...prev,
      title: template.name,
      description: template.description,
      reportType: template.type,
      sections: {
        ...prev.sections,
        ...template.defaultSections
      }
    }));
  };

  const handleProjectToggle = (projectId: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      projects: checked 
        ? [...prev.projects, projectId]
        : prev.projects.filter(id => id !== projectId)
    }));
  };

  const handleSectionToggle = (section: keyof ReportConfig['sections'], checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: checked
      }
    }));
  };

  const generateReport = async () => {
    if (!config.title.trim()) {
      toast.error('Por favor ingresa un título para el reporte');
      return;
    }

    if (config.projects.length === 0) {
      toast.error('Selecciona al menos un proyecto para incluir en el reporte');
      return;
    }

    try {
      setGenerating(true);
      
      // Obtener datos completos de los proyectos seleccionados
      const selectedProjects = projects.filter(p => config.projects.includes(p.id));
      
      // Preparar datos para el PDF
      const reportData: ReportData = {
        title: config.title,
        projects: selectedProjects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          status: project.status,
          budget: project.budget || 0,
          start_date: project.start_date || '',
          end_date: project.end_date || '',
          expenses: [] // TODO: Obtener gastos reales del proyecto
        })),
        sections: {
          includeProjectDetails: config.sections.project_overview,
          includeFinancialSummary: config.sections.financial_analysis,
          includeExpenseBreakdown: config.sections.appendices,
          includeTimeline: config.sections.progress_tracking
        },
        dateRange: config.dateRange.from && config.dateRange.to ? {
          start: config.dateRange.from.toISOString(),
          end: config.dateRange.to.toISOString()
        } : undefined,
        generatedAt: new Date().toISOString()
      };

      // Generar PDF
      await generatePDFReport(reportData);
      
      toast.success('Reporte PDF generado y descargado exitosamente');
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el reporte PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    if (!config.title.trim()) {
      toast.error('Por favor ingresa un título para el reporte');
      return;
    }

    if (config.projects.length === 0) {
      toast.error('Selecciona al menos un proyecto para incluir en el reporte');
      return;
    }

    setShowPreview(true);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'active':
        return 'Activo';
      case 'paused':
        return 'Pausado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Plantillas de Reporte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Plantillas de Reporte
          </CardTitle>
          <CardDescription>
            Selecciona una plantilla predefinida o crea un reporte personalizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {REPORT_TEMPLATES.map((template) => (
              <Card 
                key={template.id} 
                className={cn(
                  "cursor-pointer transition-colors hover:bg-gray-50",
                  config.reportType === template.type && "ring-2 ring-blue-500"
                )}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración del Reporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Reporte</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Reporte Mensual de Proyectos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={config.description}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del contenido y propósito del reporte"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !config.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.dateRange.from ? (
                        config.dateRange.from.toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={config.dateRange.from}
                      onSelect={(date) => setConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, from: date }
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
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !config.dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.dateRange.to ? (
                        config.dateRange.to.toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={config.dateRange.to}
                      onSelect={(date) => setConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, to: date }
                      }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Formato de Salida</Label>
              <Select 
                value={config.format} 
                onValueChange={(value: 'pdf' | 'excel' | 'word') => 
                  setConfig(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="word">Word</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Selección de Proyectos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Proyectos a Incluir
            </CardTitle>
            <CardDescription>
              Selecciona los proyectos que deseas incluir en el reporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={project.id}
                        checked={config.projects.includes(project.id)}
                        onCheckedChange={(checked) => 
                          handleProjectToggle(project.id, checked as boolean)
                        }
                      />
                      <div>
                        <Label htmlFor={project.id} className="font-medium cursor-pointer">
                          {project.name}
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {typeof project.client === 'string' ? project.client : project.client?.name || 'Sin cliente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {projects.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      projects: projects.map(p => p.id)
                    }))}
                  >
                    Seleccionar Todos
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      projects: []
                    }))}
                  >
                    Deseleccionar Todos
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secciones del Reporte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Secciones del Reporte
          </CardTitle>
          <CardDescription>
            Selecciona las secciones que deseas incluir en el reporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="executive_summary"
                checked={config.sections.executive_summary}
                onCheckedChange={(checked) => 
                  handleSectionToggle('executive_summary', checked as boolean)
                }
              />
              <Label htmlFor="executive_summary" className="cursor-pointer">
                Resumen Ejecutivo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="project_overview"
                checked={config.sections.project_overview}
                onCheckedChange={(checked) => 
                  handleSectionToggle('project_overview', checked as boolean)
                }
              />
              <Label htmlFor="project_overview" className="cursor-pointer">
                Resumen de Proyectos
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="financial_analysis"
                checked={config.sections.financial_analysis}
                onCheckedChange={(checked) => 
                  handleSectionToggle('financial_analysis', checked as boolean)
                }
              />
              <Label htmlFor="financial_analysis" className="cursor-pointer">
                Análisis Financiero
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="progress_tracking"
                checked={config.sections.progress_tracking}
                onCheckedChange={(checked) => 
                  handleSectionToggle('progress_tracking', checked as boolean)
                }
              />
              <Label htmlFor="progress_tracking" className="cursor-pointer">
                Seguimiento de Progreso
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="risk_assessment"
                checked={config.sections.risk_assessment}
                onCheckedChange={(checked) => 
                  handleSectionToggle('risk_assessment', checked as boolean)
                }
              />
              <Label htmlFor="risk_assessment" className="cursor-pointer">
                Evaluación de Riesgos
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recommendations"
                checked={config.sections.recommendations}
                onCheckedChange={(checked) => 
                  handleSectionToggle('recommendations', checked as boolean)
                }
              />
              <Label htmlFor="recommendations" className="cursor-pointer">
                Recomendaciones
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="appendices"
                checked={config.sections.appendices}
                onCheckedChange={(checked) => 
                  handleSectionToggle('appendices', checked as boolean)
                }
              />
              <Label htmlFor="appendices" className="cursor-pointer">
                Anexos
              </Label>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h4 className="font-medium">Elementos Adicionales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeCharts: checked as boolean }))
                  }
                />
                <Label htmlFor="includeCharts" className="cursor-pointer">
                  Incluir Gráficos
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeKPIs"
                  checked={config.includeKPIs}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeKPIs: checked as boolean }))
                  }
                />
                <Label htmlFor="includeKPIs" className="cursor-pointer">
                  Incluir KPIs
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFinancials"
                  checked={config.includeFinancials}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeFinancials: checked as boolean }))
                  }
                />
                <Label htmlFor="includeFinancials" className="cursor-pointer">
                  Datos Financieros
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTimeline"
                  checked={config.includeTimeline}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeTimeline: checked as boolean }))
                  }
                />
                <Label htmlFor="includeTimeline" className="cursor-pointer">
                  Cronograma
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRisks"
                  checked={config.includeRisks}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeRisks: checked as boolean }))
                  }
                />
                <Label htmlFor="includeRisks" className="cursor-pointer">
                  Análisis de Riesgos
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTeam"
                  checked={config.includeTeam}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeTeam: checked as boolean }))
                  }
                />
                <Label htmlFor="includeTeam" className="cursor-pointer">
                  Información del Equipo
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {config.projects.length} proyecto(s) seleccionado(s)
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                disabled={generating}
                onClick={handlePreview}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
              <Button 
                onClick={generateReport} 
                disabled={generating || !config.title.trim() || config.projects.length === 0}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Vista Previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa del Reporte</DialogTitle>
            <DialogDescription>
              Configuración y contenido del reporte "{config.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Información General */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Título</Label>
                <p className="text-sm text-gray-900">{config.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Tipo de Reporte</Label>
                <p className="text-sm text-gray-900 capitalize">{config.reportType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Formato</Label>
                <p className="text-sm text-gray-900 uppercase">{config.format}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Proyectos Incluidos</Label>
                <p className="text-sm text-gray-900">{config.projects.length} proyecto(s)</p>
              </div>
            </div>

            {config.description && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Descripción</Label>
                <p className="text-sm text-gray-900">{config.description}</p>
              </div>
            )}

            {/* Proyectos Seleccionados */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Proyectos Seleccionados</Label>
              <div className="space-y-2">
                {config.projects.map(projectId => {
                  const project = projects.find(p => p.id === projectId);
                  if (!project) return null;
                  return (
                    <div key={projectId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-600">{project.location}</p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secciones Incluidas */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Secciones Incluidas</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(config.sections).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      value ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span className={`text-sm ${
                      value ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Opciones Adicionales */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Opciones Adicionales</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    config.includeCharts ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Incluir Gráficos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    config.includeKPIs ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Incluir KPIs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    config.includeFinancials ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Incluir Financieros</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    config.includeTimeline ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Incluir Cronograma</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    config.includeRisks ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Incluir Riesgos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    config.includeTeam ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Incluir Equipo</span>
                </div>
              </div>
            </div>

            {/* Botones de Acción en el Modal */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cerrar
              </Button>
              <Button onClick={() => {
                setShowPreview(false);
                generateReport();
              }}>
                <Download className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}