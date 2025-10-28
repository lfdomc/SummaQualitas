'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DashboardMetrics, Project, ProjectStatus } from '@/lib/types';
import { projectService, incomeService, expenseService } from '@/lib/supabase/database';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Briefcase
} from 'lucide-react';
import { LazyLineChart, LazyBarChart, LazyPieChart, LazyAreaChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Bar, Pie, Cell, Area, LabelList } from '@/components/ui/lazy-chart';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface ProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  spent: number;
  variance: number;
  manager: string;
  dueDate: string;
}

interface FinancialTrend {
  // Index signature para compatibilidad con los componentes de gráficos
  [key: string]: string | number;
  month: string;
  revenue: number;
  costs: number;
  profit: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [financialTrends, setFinancialTrends] = useState<FinancialTrend[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Limpiar estado previo para evitar datos obsoletos
        setMetrics(null);
        setProjects([]);
        setFinancialTrends([]);
        setStatusDistribution([]);
        
        // Obtener proyectos
        const projectsResponse = await projectService.getProjects({}, { page: 1, limit: 50 });
        const allProjects = projectsResponse.data || [];
        
        // Obtener ingresos reales
        const incomesData = await incomeService.getIncomes();

        
        // Obtener gastos reales
        const expensesData = await expenseService.getExpenses();

        
        // Calcular métricas básicas
        const totalProjects = projectsResponse.total || 0;
        const activeProjects = allProjects.filter(p => p.status === 'en_progreso').length;
        const completedProjects = allProjects.filter(p => p.status === 'completado').length;
        
        // Calcular presupuesto total usando el presupuesto final (con fallbacks) y soportando posibles strings
        const getProjectBudget = (p: Project): number => {
          const raw: any = (p as any).total_budget ?? p.presupuesto_final ?? p.presupuesto_inicial ?? p.budget ?? 0;
          const val = typeof raw === 'string' ? parseFloat(raw) : raw;
          return isNaN(val) ? 0 : (val || 0);
        };

        const totalBudget = allProjects.reduce((sum, p) => {
          return sum + getProjectBudget(p);
        }, 0);
        
        // Calcular ingresos totales (convertir todo a CRC)
        const totalRevenue = incomesData.reduce((sum, income) => {
          const amountInCRC = income.currency === 'USD' ? income.amount * 520 : income.amount;
          return sum + amountInCRC;
        }, 0);
        
        // Calcular gastos totales (convertir todo a CRC)
        const totalSpent = expensesData.reduce((sum, expense) => {
          const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
          return sum + amountInCRC;
        }, 0);
        
        // Calcular métricas financieras reales
        const remainingBudget = totalBudget - totalSpent;
        const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalSpent) / totalRevenue) * 100 : 0;
        
        // Calcular proyectos vencidos
        const today = new Date();
        const overdueProjects = allProjects.filter(p => {
          if (!p.estimated_end_date) return false;
          const endDate = new Date(p.estimated_end_date);
          return endDate < today && p.status !== 'completado';
        }).length;
        
        // Calcular clientes activos únicos (proyectos en progreso con client_id válido)
        const activeClientsCount = new Set(
          allProjects
            .filter(p => p.status === 'en_progreso' && p.client_id) // Solo proyectos en progreso con client_id válido
            .map(p => p.client_id)
        ).size;
        
        // Calcular promedio de completitud basado en proyectos activos usando costos directos
        const averageCompletion = activeProjects > 0 ? 
          allProjects
            .filter(p => p.status === 'en_progreso')
            .reduce((sum, project) => {
              const plannedDirectCosts = project.costos_directos || 0;
              
              // Obtener gastos de costos directos para este proyecto
              const projectDirectExpenses = expensesData.filter(expense => 
                expense.project_id === project.id && expense.category === 'costos_directos'
              );
              const realDirectCostsSpent = projectDirectExpenses.reduce((expenseSum, expense) => {
                const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
                return expenseSum + amountInCRC;
              }, 0);
              
              // Calcular progreso basado en costos directos
              const projectProgress = plannedDirectCosts > 0 ? 
                Math.min((realDirectCostsSpent / plannedDirectCosts) * 100, 100) : 0;
              
              return sum + projectProgress;
            }, 0) / activeProjects : 0;
        
        // Calcular métricas financieras adicionales
        const roi = totalBudget > 0 ? ((totalRevenue - totalSpent) / totalBudget * 100) : 0;
        const costEfficiency = totalRevenue > 0 ? (totalSpent / totalRevenue * 100) : 0;
        const profitPerProject = completedProjects > 0 ? ((totalRevenue - totalSpent) / completedProjects) : 0;
        const revenuePerProject = totalProjects > 0 ? (totalRevenue / totalProjects) : 0;
        const budgetUtilizationRate = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;
        
        // Calcular métricas operacionales basadas en datos reales
        const teamUtilization = activeProjects > 0 ? Math.min(95, (activeProjects / Math.max(totalProjects, 1)) * 100) : 0;
        
        // Calcular score de calidad basado en proyectos completados a tiempo y dentro del presupuesto
        const onTimeProjects = allProjects.filter(p => {
          // Consideramos a tiempo si existe fecha real y estimada y la real es <= estimada
          if (p.status !== 'completado' || !p.actual_end_date || !p.estimated_end_date) return false;
          const actualEnd = new Date(p.actual_end_date);
          const estimatedEnd = new Date(p.estimated_end_date);
          return actualEnd <= estimatedEnd;
        }).length;
        
        const onBudgetProjects = allProjects.filter(p => {
          const spent = p.actualExpenses || p.total_expenses || 0;
          const budget = getProjectBudget(p);
          return budget > 0 && spent <= budget;
        }).length;
        
        const qualityScore = totalProjects > 0 ? 
          ((onTimeProjects + onBudgetProjects) / (totalProjects * 2)) * 10 : 0;
        
        // Calcular incidentes de seguridad basado en proyectos con problemas
        const safetyIncidents = Math.max(0, overdueProjects + Math.floor(totalProjects * 0.05));

        const realMetrics: DashboardMetrics = {
          total_projects: totalProjects,
          active_projects: activeProjects,
          completed_projects: completedProjects,
          total_budget: totalBudget,
          total_spent: totalSpent,
          budget_variance: remainingBudget,
          average_completion: averageCompletion,
          overdue_projects: overdueProjects,
          total_revenue: totalRevenue,
          profit_margin: profitMargin,
          roi: roi,
          cost_efficiency: costEfficiency,
          profit_per_project: profitPerProject,
          revenue_per_project: revenuePerProject,
          budget_utilization_rate: budgetUtilizationRate,
          active_clients: activeClientsCount,
          team_utilization: Math.round(teamUtilization),
          quality_score: Math.round(qualityScore * 10) / 10,
          safety_incidents: safetyIncidents,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setMetrics(realMetrics);
        setTotalRevenue(totalRevenue);
        setTotalSpent(totalSpent);

        // Preparar resumen de proyectos con datos reales (solo los primeros 10)
        const projectSummaries: ProjectSummary[] = await Promise.all(
          allProjects.slice(0, 10).map(async (project) => {
            const budget = project.presupuesto_final || project.budget || project.presupuesto_inicial || 0;
            const validBudget = isNaN(budget) ? 0 : budget;
            
            // Obtener costos directos planificados del proyecto
            const plannedDirectCosts = project.costos_directos || 0;
            
            // Obtener gastos reales del proyecto (solo costos directos)
            const projectExpenses = expensesData.filter(expense => 
              expense.project_id === project.id && expense.category === 'costos_directos'
            );
            const realDirectCostsSpent = projectExpenses.reduce((sum, expense) => {
              const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
              return sum + amountInCRC;
            }, 0);
            
            // Obtener gastos totales para mostrar en el dashboard
            const allProjectExpenses = expensesData.filter(expense => expense.project_id === project.id);
            const realSpent = allProjectExpenses.reduce((sum, expense) => {
              const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
              return sum + amountInCRC;
            }, 0);
            
            // Calcular progreso real basado en costos directos ejecutados vs planificados
            const realProgress = plannedDirectCosts > 0 ? 
              Math.min(Math.round((realDirectCostsSpent / plannedDirectCosts) * 100), 100) : 0;
            
            // Calcular varianza real (gastos reales - presupuesto estimado)
            const realVariance = realSpent - validBudget;
            
            return {
              id: project.id,
              name: project.name,
              status: project.status,
              progress: typeof project.progress === 'number' ? project.progress : realProgress,
              budget: validBudget,
              spent: realSpent,
              variance: realVariance,
              manager: project.manager_id || 'Sin asignar',
              dueDate: project.estimated_end_date || new Date().toISOString()
            };
          })
        );

        setProjects(projectSummaries);

        // Calcular tendencias financieras reales (últimos 6 meses)
        const currentDate = new Date();
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const realTrends: FinancialTrend[] = [];
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const monthName = monthNames[date.getMonth()];
          
          // Filtrar ingresos del mes
          const monthlyIncomes = incomesData.filter(income => {
            const incomeDate = new Date(income.received_date);
            return incomeDate.getFullYear() === year && incomeDate.getMonth() + 1 === month;
          });
          
          // Filtrar gastos del mes
          const monthlyExpenses = expensesData.filter(expense => {
            const expenseDate = new Date(expense.expense_date);
            return expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month;
          });
          
          // Calcular totales del mes
          const monthRevenue = monthlyIncomes.reduce((sum, income) => {
            const amountInCRC = income.currency === 'USD' ? income.amount * 520 : income.amount;
            return sum + amountInCRC;
          }, 0);
          
          const monthCosts = monthlyExpenses.reduce((sum, expense) => {
            const amountInCRC = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
            return sum + amountInCRC;
          }, 0);
          
          realTrends.push({
            month: monthName,
            revenue: monthRevenue,
            costs: monthCosts,
            profit: monthRevenue - monthCosts
          });
        }
        
        setFinancialTrends(realTrends);

        // Distribución de estados con datos reales
        const statusMapping: Record<string, string> = {
          'planificacion': 'Planificación',
          'en_progreso': 'En Progreso',
          'completado': 'Completado',
          'pausado': 'Pausado',
          'cancelado': 'Cancelado'
        };
        
        const statusCounts = allProjects.reduce((acc, project) => {
          const status = project.status || 'unknown';
          const displayStatus = statusMapping[status] || status;
          acc[displayStatus] = (acc[displayStatus] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const statusDistribution: StatusDistribution[] = Object.entries(statusCounts).map(([status, count]) => ({
          status: status as ProjectStatus,
          count,
          percentage: totalProjects > 0 ? (count / totalProjects) * 100 : 0
        }));
        
        setStatusDistribution(statusDistribution);
      } catch (error) {
        console.warn('Error fetching dashboard data:', error);
        // Establecer datos por defecto en caso de error
        setMetrics({
          total_projects: 0,
          active_projects: 0,
          completed_projects: 0,
          total_budget: 0,
          total_spent: 0,
          budget_variance: 0,
          average_completion: 0,
          overdue_projects: 0,
          total_revenue: 0,
          profit_margin: 0,
          active_clients: 0,
          team_utilization: 0,
          quality_score: 0,
          safety_incidents: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setProjects([]);
        setFinancialTrends([]);
        setStatusDistribution([]);
        toast.error('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Suscripciones en tiempo real para mantener el dashboard ejecutivo actualizado
    const channel = supabase
      .channel('realtime-executive-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomes' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

const getStatusColor = (status: ProjectStatus) => {
  // Usar los estados en español alineados con la base de datos
  switch (status) {
    case 'completado':
      return 'bg-green-100 text-green-800';
    case 'en_progreso':
      return 'bg-blue-100 text-blue-800';
    case 'pausado':
      return 'bg-orange-100 text-orange-800';
    case 'cancelado':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: ProjectStatus) => {
  switch (status) {
    case 'completado':
      return 'Completado';
    case 'en_progreso':
      return 'En Progreso';
    case 'pausado':
      return 'Pausado';
    case 'cancelado':
      return 'Cancelado';
    case 'planificacion':
    default:
      return 'Planificación';
  }
};

if (loading) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

if (!metrics) {
  return (
    <div className="text-center py-8">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No hay datos disponibles
      </h3>
      <p className="text-gray-600">
        Los datos del dashboard no están disponibles en este momento.
      </p>
    </div>
  );
}

return (
  <div className="space-y-6">
    {/* Métricas Principales */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos Totales</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total_projects}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.active_projects} activos
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Proyectos Totales:</p>
              <p className="text-sm">Número total de proyectos registrados en el sistema, incluyendo todos los estados (activos, completados, pausados, cancelados).</p>
              <div className="text-sm space-y-1">
                <p>• <strong>Proyectos Activos:</strong> {metrics.active_projects}</p>
                <p>• <strong>Total Registrados:</strong> {metrics.total_projects}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Este valor representa la inversión total planificada en todos los proyectos.
              </p>
            </div>
          </TooltipContent>
        </UITooltip>
      </TooltipProvider>

      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.total_budget || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Suma de todos los presupuestos
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Presupuesto Total:</p>
              <p className="text-sm">Suma de todos los presupuestos asignados a los proyectos registrados en el sistema.</p>
              <div className="text-sm space-y-1">
                <p>• <strong>Cálculo:</strong> Σ(presupuesto de cada proyecto)</p>
                <p>• <strong>Incluye:</strong> Proyectos activos, completados y pausados</p>
                <p>• <strong>Moneda:</strong> Colones costarricenses (₡)</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Este valor representa la inversión total planificada en todos los proyectos.
              </p>
            </div>
          </TooltipContent>
        </UITooltip>
      </TooltipProvider>

      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Margen de Ganancia</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.profit_margin.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  Promedio de proyectos
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Cálculo del Margen de Ganancia:</p>
              <p className="text-sm">
                <strong>Fórmula:</strong> ((Ingresos Totales - Gastos Totales) / Ingresos Totales) × 100
              </p>
              <div className="text-sm space-y-1">
                <p><strong>Ingresos Totales:</strong> ₡{(totalRevenue / 1000000).toFixed(2)}M</p>
                <p><strong>Gastos Totales:</strong> ₡{(totalSpent / 1000000).toFixed(2)}M</p>
                <p><strong>Ganancia Neta:</strong> ₡{((totalRevenue - totalSpent) / 1000000).toFixed(2)}M</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Este porcentaje indica qué tan rentables son los proyectos en promedio.
              </p>
            </div>
          </TooltipContent>
        </UITooltip>
      </TooltipProvider>

      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.average_completion?.toFixed(0) ?? 0}%</div>
                <Progress value={metrics.average_completion || 0} className="mt-2" />
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Progreso Promedio:</p>
              <p className="text-sm">Porcentaje promedio de avance de todos los proyectos activos en el sistema.</p>
              <div className="text-sm space-y-1">
                <p>• <strong>Cálculo:</strong> Σ(progreso de cada proyecto activo) ÷ número de proyectos activos</p>
                <p>• <strong>Rango:</strong> 0% - 100%</p>
                <p>• <strong>Solo incluye:</strong> Proyectos con estado "activo"</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Este indicador muestra el avance general de la cartera de proyectos activos.
              </p>
            </div>
          </TooltipContent>
        </UITooltip>
      </TooltipProvider>
    </div>

    {/* Métricas Financieras Avanzadas */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eficiencia de Costos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (metrics.cost_efficiency || 0) <= 70 ? 'text-green-600' : 
                  (metrics.cost_efficiency || 0) <= 85 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(metrics.cost_efficiency || 0).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Gastos vs ingresos
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Eficiencia de Costos:</p>
              <p className="text-sm">Porcentaje que representan los gastos totales respecto a los ingresos totales.</p>
              <div className="text-sm space-y-1">
                <p>• <strong>Cálculo:</strong> (Gastos Totales ÷ Ingresos Totales) × 100</p>
                <p>• <strong>Gastos Totales:</strong> ₡{(totalSpent / 1000000).toFixed(2)}M</p>
                <p>• <strong>Ingresos Totales:</strong> ₡{(totalRevenue / 1000000).toFixed(2)}M</p>
                <p>• <strong>Interpretación:</strong></p>
                <p className="ml-2">- Verde (≤70%): Excelente eficiencia</p>
                <p className="ml-2">- Amarillo (71-85%): Eficiencia aceptable</p>
                <p className="ml-2">- Rojo (&gt;85%): Requiere optimización</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Un porcentaje menor indica mejor eficiencia en el control de costos.
              </p>
            </div>
          </TooltipContent>
        </UITooltip>
      </TooltipProvider>

      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganancia por Proyecto</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.profit_per_project || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Promedio de proyectos completados
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Ganancia por Proyecto:</p>
              <p className="text-sm">Ganancia neta promedio obtenida por cada proyecto completado.</p>
              <div className="text-sm space-y-1">
                <p>• <strong>Cálculo:</strong> (Ingresos totales - Gastos totales) ÷ número de proyectos completados</p>
                <p>• <strong>Solo incluye:</strong> Proyectos con estado "completado"</p>
                <p>• <strong>Moneda:</strong> Colones costarricenses (₡)</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Indicador clave de rentabilidad por proyecto individual.
              </p>
            </div>
          </TooltipContent>
        </UITooltip>
      </TooltipProvider>

      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.active_clients}</div>
                <p className="text-xs text-muted-foreground">
                  Clientes con proyectos activos
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Clientes Activos:</p>
              <p className="text-sm">Número de clientes únicos que tienen al menos un proyecto en estado activo.</p>
              <div className="text-sm space-y-1">
                <p>• <strong>Cálculo:</strong> COUNT(DISTINCT cliente_id) WHERE proyecto.estado = 'activo'</p>
                <p>• <strong>Criterio:</strong> Al menos un proyecto activo por cliente</p>
                <p>• <strong>Actualización:</strong> En tiempo real</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Indicador de la base de clientes actualmente atendida.
              </p>
            </div>
          </TooltipContent>
        </UITooltip>
      </TooltipProvider>
    </div>

    {/* Métricas Operacionales */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos por Proyecto</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.revenue_per_project || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Promedio de todos los proyectos
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Ingresos por Proyecto:</p>
              <p className="text-sm">Ingreso promedio generado por cada proyecto en el sistema.</p>
              <div className="text-sm space-y-1">
                <p>• <strong>Cálculo:</strong> Σ(ingresos totales) ÷ número total de proyectos</p>
                <p>• <strong>Incluye:</strong> Todos los proyectos registrados</p>
                <p>• <strong>Moneda:</strong> Colones costarricenses (₡)</p>
                <p>• <strong>Conversión:</strong> USD a CRC (tasa: 520)</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Métrica de rendimiento financiero por proyecto.
              </p>
            </div>
          </TooltipContent>
        </UITooltip>
      </TooltipProvider>

      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos Atrasados</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  metrics.overdue_projects === 0 ? 'text-green-600' : 
                  (metrics.overdue_projects || 0) <= 2 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.overdue_projects}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requieren atención
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Proyectos Atrasados:</p>
              <p className="text-sm">Número de proyectos activos que han superado su fecha de entrega planificada.</p>
              <div className="text-sm space-y-1">
                <p>• <strong>Criterio:</strong> Fecha actual &gt; fecha de entrega programada</p>
                <p>• <strong>Solo incluye:</strong> Proyectos con estado "activo"</p>
                <p>• <strong>Indicadores de color:</strong></p>
                <p className="ml-2 text-green-600">• Verde: 0 proyectos atrasados</p>
                <p className="ml-2 text-yellow-600">• Amarillo: 1-2 proyectos atrasados</p>
                <p className="ml-2 text-red-600">• Rojo: 3+ proyectos atrasados</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Indicador crítico de gestión de tiempos y planificación.
              </p>
            </div>
          </TooltipContent>
        </UITooltip>
      </TooltipProvider>
    </div>

    {/* Gráficos y Análisis */}
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Resumen</TabsTrigger>
        <TabsTrigger value="financial">Financiero</TabsTrigger>
        <TabsTrigger value="projects">Proyectos</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Financieras</CardTitle>
              <CardDescription>Ingresos, costos y ganancias por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <LazyAreaChart data={financialTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8"
                    name="Ingresos"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="costs" 
                    stackId="2"
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    name="Costos"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#ffc658" 
                    strokeWidth={3}
                    name="Ganancia"
                  />
                </LazyAreaChart>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Estados</CardTitle>
              <CardDescription>Estado actual de todos los proyectos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <LazyPieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ status, percentage }: { status: string; percentage: number }) => `${status} ${percentage.toFixed(0)}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </LazyPieChart>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="financial" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Ingresos Totales</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.total_revenue || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Costos Totales</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(metrics.total_spent || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Ganancia Neta</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency((metrics.total_revenue || 0) - (metrics.total_spent || 0))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Análisis de Rentabilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <LazyAreaChart data={financialTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    domain={[0, 'dataMax']} 
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} 
                  />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                  <Bar dataKey="profit" fill="#8884d8" name="Ganancia">
                    <LabelList 
                      dataKey="profit" 
                      position="center" 
                      fill="white" 
                      fontSize={12}
                      formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                  </Bar>
                </LazyAreaChart>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="projects" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Proyectos Recientes</CardTitle>
              <CardDescription>Estado y progreso de los proyectos principales</CardDescription>
            </div>
            <Link href="/projects">
              <Button variant="outline">Ver Todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h4 className="font-semibold truncate">{project.name}</h4>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Manager: {project.manager || 'Sin asignar'}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                      <span className="whitespace-nowrap">Progreso: {project.progress}%</span>
                      <span className="break-all sm:break-normal">Presupuesto: {formatCurrency(project.budget)}</span>
                      <span className={`break-all sm:break-normal ${project.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Varianza: {formatCurrency(project.variance)}
                      </span>
                    </div>
                    <Progress value={project.progress} className="mt-2 w-full" />
                  </div>
                  <div className="lg:ml-4 flex-shrink-0">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm" className="w-full lg:w-auto">
                        Ver Detalles
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);
}