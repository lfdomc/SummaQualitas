'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { ProjectService } from '@/lib/supabase/database';
import { ProjectFinancialSummary } from '@/lib/types';
import type { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Building2,
  FileText,
  Settings,
  Ruler
} from 'lucide-react';
import Link from 'next/link';
import { Suspense, lazy } from 'react';
// Carga diferida de componentes pesados usando React.lazy en lugar de next/dynamic para evitar errores de app-dynamic
// Mapeamos exports nombrados a default cuando es necesario
const BudgetItemsBreakdown = lazy(
  () => import('@/components/projects/BudgetItemsBreakdown').then(mod => ({ default: mod.BudgetItemsBreakdown }))
);
const BudgetPieChart = lazy(
  () => import('@/components/projects/BudgetPieChart').then(mod => ({ default: mod.BudgetPieChart }))
);
const BudgetBreakdown = lazy(
  () => import('@/components/projects/BudgetBreakdown').then(mod => ({ default: mod.BudgetBreakdown }))
);
const ProjectExpenses = lazy(
  () => import('@/components/projects/ProjectExpenses').then(mod => ({ default: mod.ProjectExpenses }))
);
const ProjectIncomes = lazy(() => import('@/components/projects/ProjectIncomes'));
import ProjectFinancialAnalysis from '@/components/projects/ProjectFinancialAnalysis';
import ProjectChangeOrders from '@/components/projects/ProjectChangeOrders';
import { withAuth } from '@/components/auth/withAuth';

function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthContext();
  const [project, setProject] = useState<Project | null>(null);
  const [financialSummary, setFinancialSummary] = useState<ProjectFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const projectId = params.id as string;
  const projectService = new ProjectService(false); // false para cliente

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectData = await projectService.getProjectById(projectId);

      if (!projectData) {
        throw new Error('Proyecto no encontrado');
      }

      setProject(projectData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido al cargar el proyecto');
      toast.error('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Cargar resumen financiero sólo cuando el usuario abre la pestaña "Financiero"
  useEffect(() => {
    const loadFinancial = async () => {
      if (activeTab === 'financial' && project && !financialSummary) {
        try {
          const financialData = await projectService.getProjectFinancialSummary(project.id);
          setFinancialSummary(financialData);
        } catch (e) {
          console.warn('No se pudo cargar el resumen financiero:', e);
        }
      }
    };
    loadFinancial();
  }, [activeTab, project, financialSummary]);

  const statusConfig = {
    planificacion: { label: 'Planificación', variant: 'secondary' as const, icon: Clock },
    en_progreso: { label: 'En Progreso', variant: 'success' as const, icon: TrendingUp },
    pausado: { label: 'Pausado', variant: 'outline' as const, icon: AlertTriangle },
    completado: { label: 'Completado', variant: 'default' as const, icon: CheckCircle },
    cancelado: { label: 'Cancelado', variant: 'destructive' as const, icon: AlertTriangle }
  };

  const canEdit = profile && ['gerencia', 'administrativo'].includes(profile.role);

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Proyecto no encontrado'}</p>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Proyectos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatUSDCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Porcentajes por defecto para el desglose presupuestario (ajustados proporcionalmente)
  const DEFAULT_BUDGET_PERCENTAGES = {
    costos_directos: 0.650,              // 65.0%
    costos_indirectos: 0.040,            // 4.0%
    administracion: 0.100,               // 10.0%
    mano_obra: 0.190,                    // 19.0%
    imprevistos: 0.020,                  // 2.0%
    utilidad: 0.000                      // 0.0%
  };

  // Función para calcular el desglose automático del presupuesto
  const calculateBudgetBreakdown = (totalBudget: number) => {
    return {
      costos_directos: Math.round(totalBudget * DEFAULT_BUDGET_PERCENTAGES.costos_directos),
      costos_indirectos: Math.round(totalBudget * DEFAULT_BUDGET_PERCENTAGES.costos_indirectos),
      administracion: Math.round(totalBudget * DEFAULT_BUDGET_PERCENTAGES.administracion),
      mano_obra: Math.round(totalBudget * DEFAULT_BUDGET_PERCENTAGES.mano_obra),
      imprevistos: Math.round(totalBudget * DEFAULT_BUDGET_PERCENTAGES.imprevistos),
      utilidad: Math.round(totalBudget * DEFAULT_BUDGET_PERCENTAGES.utilidad)
    };
  };

  // Obtener el presupuesto total del proyecto
  const totalBudget = project.presupuesto_final || project.presupuesto_inicial || project.presupuesto_original || project.budget || 0;
  
  // Calcular el desglose automático si los campos están vacíos
  const budgetBreakdown = calculateBudgetBreakdown(totalBudget);
  
  // Función para obtener el valor del campo (prioriza valores calculados)
  const getBudgetValue = (fieldValue: number | null | undefined, calculatedValue: number): number => {
    return calculatedValue;
  };

  const calculateUSDAmount = (amount: number): number => {
    const exchangeRate = project?.exchange_rate_usd || 500;
    return exchangeRate > 0 ? amount / exchangeRate : 0;
  };

  const formatDate = (date: string) => {
    if (!date) return 'Sin definir';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para calcular quincenas entre dos fechas
  const calculateFortnights = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calcular diferencia en días
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Convertir días a quincenas (15 días = 1 quincena)
    return Math.ceil(diffDays / 15);
  };

  // Función para calcular costo por quincena
  const calculateCostPerFortnight = (): number => {
    // Calcular el valor de mano de obra basado en el presupuesto final
    const percentage = (project.mano_obra_porcentaje || DEFAULT_BUDGET_PERCENTAGES.mano_obra) / 100;
    const manoObraValue = totalBudget * percentage;
    
    if (!manoObraValue) return 0;
    
    const fortnights = calculateFortnights(
      project.estimated_start_date || '',
      project.estimated_end_date || ''
    );
    
    if (fortnights === 0) return 0;
    
    // El costo total de mano de obra dividido entre el número de quincenas
    return manoObraValue / fortnights;
  };

  // Función para calcular meses entre dos fechas
  const calculateMonths = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calcular diferencia en meses
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    
    return yearDiff * 12 + monthDiff + (end.getDate() >= start.getDate() ? 1 : 0);
  };

  const StatusIcon = statusConfig[project.status]?.icon || Clock;
  const statusInfo = statusConfig[project.status] || statusConfig.planificacion;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm max-[350px]:text-xs text-gray-500 mb-6">
        <Link href="/projects" className="hover:text-gray-700">
          Proyectos
        </Link>
        <span>/</span>
        <span>{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant={statusInfo.variant} className="flex items-center space-x-1">
                <StatusIcon className="h-3 w-3" />
                <span>{statusInfo.label}</span>
              </Badge>
              <span className="text-gray-500">ID: {project.id}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link href="/projects" prefetch={false}>
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          {canEdit && (
            <Link href={`/projects/${project.id}/edit`} prefetch={false}>
              <Button className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap gap-2">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
          {canEdit && <TabsTrigger value="expenses">Gastos</TabsTrigger>}
          {canEdit && <TabsTrigger value="incomes">Ingresos</TabsTrigger>}
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
          {canEdit && <TabsTrigger value="change-orders">Órdenes de Cambio</TabsTrigger>}
          <TabsTrigger value="timeline">Cronograma</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Project Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Presupuesto del Proyecto</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Presupuesto Inicial */}
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Presupuesto Inicial</p>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                      {(project.presupuesto_inicial || project.presupuesto_original || project.budget) ? 
                        formatCurrency(project.presupuesto_inicial || project.presupuesto_original || project.budget || 0) : 
                        'No definido'}
                    </div>
                    {(project.presupuesto_inicial || project.presupuesto_original || project.budget) && (
                      <p className="text-sm text-gray-500">
                        {formatUSDCurrency(calculateUSDAmount(project.presupuesto_inicial || project.presupuesto_original || project.budget || 0))}
                      </p>
                    )}
                  </div>
                  
                  {/* Presupuesto Final */}
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Presupuesto Final</p>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                      {(project.presupuesto_final || project.presupuesto_inicial || project.presupuesto_original || project.budget) ? 
                        formatCurrency(project.presupuesto_final || project.presupuesto_inicial || project.presupuesto_original || project.budget || 0) : 
                        'No definido'}
                    </div>
                    {(project.presupuesto_final || project.presupuesto_inicial || project.presupuesto_original || project.budget) && (
                      <p className="text-sm text-gray-500">
                        {formatUSDCurrency(calculateUSDAmount(project.presupuesto_final || project.presupuesto_inicial || project.presupuesto_original || project.budget || 0))}
                      </p>
                    )}
                  </div>
                  
                  {/* Diferencia */}
                  {(project.presupuesto_inicial || project.presupuesto_original || project.budget) && 
                   (project.presupuesto_final || project.presupuesto_inicial || project.presupuesto_original || project.budget) && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600 font-medium">Variación por Órdenes de Cambio</p>
                      <div className={`text-lg font-bold ${
                        ((project.presupuesto_final || project.presupuesto_inicial || project.presupuesto_original || project.budget || 0) - 
                         (project.presupuesto_inicial || project.presupuesto_original || project.budget || 0)) >= 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {((project.presupuesto_final || project.presupuesto_inicial || project.presupuesto_original || project.budget || 0) - 
                          (project.presupuesto_inicial || project.presupuesto_original || project.budget || 0)) >= 0 ? '+' : ''}
                        {formatCurrency((project.presupuesto_final || project.presupuesto_inicial || project.presupuesto_original || project.budget || 0) - 
                                       (project.presupuesto_inicial || project.presupuesto_original || project.budget || 0))}
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                  Tipo de cambio: ₡{project.exchange_rate_usd || 500} por USD
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cliente</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <p className="font-medium">{(() => {
                    const c: any = project.client;
                    if (Array.isArray(c)) return c[0]?.name ?? c[0] ?? 'Sin asignar';
                    if (typeof c === 'object' && c !== null) return c.name ?? 'Sin asignar';
                    return typeof c === 'string' ? c : 'Sin asignar';
                  })()}</p>
                </div>
              </CardContent>
            </Card>



            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ubicación</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.location || 'No especificada'}
              </div>
            </CardContent>
          </Card>

          {/* Área Total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Área Total</CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof project.total_area === 'number' && isFinite(project.total_area)
                  ? `${project.total_area} m²`
                  : 'No especificada'}
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Detailed Dates Section */}
          <Card>
            <CardHeader>
              <CardTitle>Fechas del Proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Inicio Estimado</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {project.estimated_start_date ? formatDate(project.estimated_start_date) : 'Sin definir'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Fin Estimado</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {project.estimated_end_date ? formatDate(project.estimated_end_date) : 'Sin definir'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Inicio Real</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {project.actual_start_date ? formatDate(project.actual_start_date) : 'Sin definir'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Fin Real</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {project.actual_end_date ? formatDate(project.actual_end_date) : 'Sin definir'}
                  </p>
                </div>
              </div>
              
              {/* Datos Estimados */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Estimados</h3>
                <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Quincenas Estimadas</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {calculateFortnights(
                      project.estimated_start_date || '',
                      project.estimated_end_date || ''
                    )} quincenas
                  </p>
                </div>
                <div className="bg-sky-50 p-4 rounded-lg">
                  <p className="text-sm text-sky-600 font-medium">Meses Estimados</p>
                  <p className="text-2xl font-bold text-sky-800">
                    {calculateMonths(
                      project.estimated_start_date || '',
                      project.estimated_end_date || ''
                    )} meses
                  </p>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <p className="text-sm text-cyan-600 font-medium">Costo por Quincena Estimado</p>
                  <p className="text-2xl font-bold text-cyan-800">
                    {formatCurrency(calculateCostPerFortnight())}
                  </p>
                </div>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Breakdown Section */}
          <Card>
            <CardHeader>
              <CardTitle>Desglose Presupuestario</CardTitle>
              <CardDescription>Distribución detallada del presupuesto por categorías</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const totalBudget = (project.presupuesto_final || project.presupuesto_inicial || project.budget || 0);
                  const calculatePercentage = (amount: number): string => {
                    if (totalBudget === 0) return '0%';
                    return `${((amount / totalBudget) * 100).toFixed(1)}%`;
                  };
                  
                  return (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">Costos Directos - Totales</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {formatCurrency(getBudgetValue(project.costos_directos, budgetBreakdown.costos_directos))}
                        </p>
                        <p className="text-sm text-blue-600 font-medium">
                          {calculatePercentage(getBudgetValue(project.costos_directos, budgetBreakdown.costos_directos))}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium">Costos Indirectos</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {formatCurrency(getBudgetValue(project.costos_indirectos, budgetBreakdown.costos_indirectos))}
                        </p>
                        <p className="text-sm text-yellow-600 font-medium">
                          {calculatePercentage(getBudgetValue(project.costos_indirectos, budgetBreakdown.costos_indirectos))}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm font-medium">Gastos Administrativos</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {formatCurrency(getBudgetValue(project.administracion, budgetBreakdown.administracion))}
                        </p>
                        <p className="text-sm text-purple-600 font-medium">
                          {calculatePercentage(getBudgetValue(project.administracion, budgetBreakdown.administracion))}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm font-medium">Mano de Obra</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {formatCurrency(getBudgetValue(project.mano_obra, budgetBreakdown.mano_obra))}
                        </p>
                        <p className="text-sm text-red-600 font-medium">
                          {calculatePercentage(getBudgetValue(project.mano_obra, budgetBreakdown.mano_obra))}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm font-medium">Imprevistos</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {formatCurrency(getBudgetValue(project.imprevistos, budgetBreakdown.imprevistos))}
                        </p>
                        <p className="text-sm text-orange-600 font-medium">
                          {calculatePercentage(getBudgetValue(project.imprevistos, budgetBreakdown.imprevistos))}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm font-medium">Utilidad</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {formatCurrency(getBudgetValue(project.utilidad, budgetBreakdown.utilidad))}
                        </p>
                        <p className="text-sm text-emerald-600 font-medium">
                          {calculatePercentage(getBudgetValue(project.utilidad, budgetBreakdown.utilidad))}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción del Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Partidas Presupuestarias */}
          {activeTab === 'financial' && (
            <Suspense fallback={<div className="h-24 w-full animate-pulse" />}>
              <BudgetItemsBreakdown 
                project={project}
                exchangeRate={project.exchange_rate_usd || 500}
              />
            </Suspense>
          )}
          
          {/* Gráfico de Distribución del Presupuesto */}
          {activeTab === 'financial' && (
            <Suspense fallback={<div className="h-24 w-full animate-pulse" />}>
              <BudgetPieChart project={project} />
            </Suspense>
          )}
          
          {/* Desglose Detallado */}
          {activeTab === 'financial' && financialSummary && (
            <Suspense fallback={<div className="h-24 w-full animate-pulse" />}>
              <BudgetBreakdown 
                projectId={project.id}
                totalBudget={totalBudget}
                exchangeRate={project.exchange_rate_usd || 500}
              />
            </Suspense>
          )}
        </TabsContent>

        {canEdit && (
          <TabsContent value="expenses" className="space-y-6">
            <Suspense fallback={<div className="h-24 w-full animate-pulse" />}>
              <ProjectExpenses 
                project={project} 
                canEdit={canEdit} 
                showHeader={false} 
              />
            </Suspense>
          </TabsContent>
        )}

        {canEdit && (
          <TabsContent value="incomes" className="space-y-6">
            <Suspense fallback={<div className="h-24 w-full animate-pulse" />}>
              <ProjectIncomes 
                projectId={project.id}
                clientId={project.client_id}
                projectName={project.name}
                canManage={canEdit}
              />
            </Suspense>
          </TabsContent>
        )}

        <TabsContent value="analysis" className="space-y-6">
          <ProjectFinancialAnalysis 
            projectId={project.id}
            projectBudget={totalBudget}
            projectExpenses={financialSummary?.expenses ? {
              total: financialSummary.expenses.total || 0,
              byCategory: financialSummary.expenses.byCategory || {
                costos_directos: 0,
                costos_indirectos: 0,
                administracion: 0,
                mano_obra: 0,
                imprevistos: 0,
                utilidad: 0,
              }
            } : {
              total: 0,
              byCategory: {
                costos_directos: 0,
                costos_indirectos: 0,
                administracion: 0,
                mano_obra: 0,
                imprevistos: 0,
                utilidad: 0,
              }
            }}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma del Proyecto</CardTitle>
              <CardDescription>
                Visualización del progreso y hitos del proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Cronograma en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canEdit && (
          <TabsContent value="change-orders" className="space-y-6">
            <ProjectChangeOrders 
              projectId={project.id}
              projectName={project.name}
            />
          </TabsContent>
        )}

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos del Proyecto</CardTitle>
              <CardDescription>
                Contratos, planos, permisos y otros documentos relacionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay documentos disponibles</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-20" />
          <span>/</span>
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProjectDetailPage, ['gerencia', 'administrativo', 'cliente']);