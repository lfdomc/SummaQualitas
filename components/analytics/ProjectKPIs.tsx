'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectKPIs as ProjectKPIsType, Project } from '@/lib/types';
import { projectService, expenseService, incomeService } from '@/lib/supabase/database';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectKPIsProps {
  projectId: string;
  project?: Project;
}

interface EVMData {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  costVariance: number;
  scheduleVariance: number;
  costPerformanceIndex: number;
  schedulePerformanceIndex: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
}

interface ChartData {
  month: string;
  planned: number;
  earned: number;
  actual: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ProjectKPIs({ projectId, project }: ProjectKPIsProps) {
  const [kpis, setKpis] = useState<ProjectKPIsType | null>(null);
  const [evmData, setEvmData] = useState<EVMData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        
        if (projectId === 'default' || !project) {
          // Mostrar mensaje para seleccionar un proyecto
          setKpis(null);
          setEvmData(null);
          setChartData([]);
          setLoading(false);
          return;
        }
        
        // Obtener datos financieros reales del proyecto
        const [projectExpenses, projectIncomes] = await Promise.all([
          expenseService.getProjectExpenses(projectId),
          incomeService.getProjectIncomes(projectId)
        ]);
        
        // Calcular datos reales del proyecto
        const projectBudget = project.budget || 0;
        const actualCost = projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalIncomes = projectIncomes.reduce((sum, income) => sum + income.amount, 0);
        const projectProgress = project.progress || 0;
        const earnedValue = projectBudget * (projectProgress / 100);
        const plannedValue = projectBudget * 0.5; // Estimación basada en cronograma esperado
        
        // Calcular métricas EVM específicas del proyecto
        const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 0;
        const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 0;
        const costVariance = earnedValue - actualCost;
        const scheduleVariance = earnedValue - plannedValue;
        const estimateAtCompletion = actualCost > 0 && earnedValue > 0 ? projectBudget * (actualCost / earnedValue) : projectBudget;
        const estimateToComplete = estimateAtCompletion - actualCost;
        const varianceAtCompletion = projectBudget - estimateAtCompletion;
        
        const calculatedKPIs: ProjectKPIsType = {
          id: `calc-${projectId}`,
          project_id: projectId,
          planned_value: plannedValue,
          earned_value: earnedValue,
          actual_cost: actualCost,
          cost_performance_index: costPerformanceIndex,
          schedule_performance_index: schedulePerformanceIndex,
          budget_at_completion: projectBudget,
          estimate_at_completion: estimateAtCompletion,
          cost_variance: costVariance,
          schedule_variance: scheduleVariance,
          estimate_to_complete: estimateToComplete,
          variance_at_completion: varianceAtCompletion,
          completion_percentage: projectProgress,
          quality_score: 8.5,
          safety_incidents: projectExpenses.filter(e => e.category === 'seguridad').length,
          productivity_index: earnedValue > 0 && actualCost > 0 ? earnedValue / actualCost : 1.0,
          resource_utilization: Math.min(100, (actualCost / projectBudget) * 100),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setKpis(calculatedKPIs);
        
        const evm: EVMData = {
          plannedValue: calculatedKPIs.planned_value || 0,
          earnedValue: calculatedKPIs.earned_value || 0,
          actualCost: calculatedKPIs.actual_cost || 0,
          budgetAtCompletion: calculatedKPIs.budget_at_completion || 0,
          estimateAtCompletion: calculatedKPIs.estimate_at_completion || 0,
          costVariance: calculatedKPIs.cost_variance || 0,
          scheduleVariance: calculatedKPIs.schedule_variance || 0,
          costPerformanceIndex: calculatedKPIs.cost_performance_index || 0,
          schedulePerformanceIndex: calculatedKPIs.schedule_performance_index || 0,
          estimateToComplete: calculatedKPIs.estimate_to_complete || 0,
          varianceAtCompletion: calculatedKPIs.variance_at_completion || 0
        };
        
        setEvmData(evm);
        
        // Generar datos de gráfico basados en el progreso del proyecto específico
        const monthlyData: ChartData[] = [
          { month: 'Ene', planned: (calculatedKPIs.planned_value || 0) * 0.2, earned: (calculatedKPIs.earned_value || 0) * 0.2, actual: (calculatedKPIs.actual_cost || 0) * 0.2 },
          { month: 'Feb', planned: (calculatedKPIs.planned_value || 0) * 0.4, earned: (calculatedKPIs.earned_value || 0) * 0.4, actual: (calculatedKPIs.actual_cost || 0) * 0.4 },
          { month: 'Mar', planned: (calculatedKPIs.planned_value || 0) * 0.6, earned: (calculatedKPIs.earned_value || 0) * 0.6, actual: (calculatedKPIs.actual_cost || 0) * 0.6 },
          { month: 'Abr', planned: (calculatedKPIs.planned_value || 0) * 0.8, earned: (calculatedKPIs.earned_value || 0) * 0.8, actual: (calculatedKPIs.actual_cost || 0) * 0.8 },
          { month: 'May', planned: calculatedKPIs.planned_value || 0, earned: calculatedKPIs.earned_value || 0, actual: calculatedKPIs.actual_cost || 0 }
        ];
        setChartData(monthlyData);
        
      } catch (error) {
        console.error('Error fetching KPIs:', error);
        toast.error('Error al cargar los KPIs del proyecto');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchKPIs();
    }
  }, [projectId, project]);

  const getPerformanceStatus = (value: number, threshold: number = 1) => {
    if (value >= threshold) return { status: 'good', color: 'text-green-600', icon: TrendingUp };
    if (value >= threshold * 0.9) return { status: 'warning', color: 'text-yellow-600', icon: Clock };
    return { status: 'poor', color: 'text-red-600', icon: TrendingDown };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
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

  if (!kpis || !evmData) {
    return (
      <div className="text-center py-8">
        <Target className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Selecciona un proyecto para ver sus KPIs
        </h3>
        <p className="text-gray-600">
          Utiliza el selector de proyecto arriba para ver el análisis detallado de rendimiento, costos y cronograma específico de cada proyecto.
        </p>
      </div>
    );
  }

  const cpiStatus = getPerformanceStatus(evmData.costPerformanceIndex);
  const spiStatus = getPerformanceStatus(evmData.schedulePerformanceIndex);

  return (
    <div className="space-y-6">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPI (Índice de Rendimiento de Costos)</CardTitle>
            <cpiStatus.icon className={`h-4 w-4 ${cpiStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evmData.costPerformanceIndex.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {evmData.costPerformanceIndex >= 1 ? 'Bajo presupuesto' : 'Sobre presupuesto'}
            </p>
          </CardContent>
        </Card>





        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progreso del Proyecto</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.completion_percentage}%</div>
                  <Progress value={kpis.completion_percentage} className="mt-2" />
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <p className="font-semibold">Progreso del Proyecto:</p>
                <p className="text-sm">Porcentaje de avance del proyecto basado en el progreso registrado en el sistema.</p>
                <div className="text-sm space-y-1">
                  <p>• <strong>Fuente:</strong> Campo 'progress' del proyecto en la base de datos</p>
                  <p>• <strong>Rango:</strong> 0% - 100%</p>
                  <p>• <strong>Actualización:</strong> Manual por el administrador del proyecto</p>
                  <p>• <strong>Interpretación:</strong> Refleja el estado actual de completitud del proyecto</p>
                </div>
              </div>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      {/* Métricas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimación al Completar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(evmData.estimateAtCompletion)}</div>
            <p className="text-xs text-muted-foreground">
              Costo proyectado final
            </p>
          </CardContent>
        </Card>





        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilización de Recursos</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(kpis.resource_utilization || 0).toFixed(2)}%</div>
                  <Progress value={kpis.resource_utilization || 0} className="mt-2" />
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <p className="font-semibold">Utilización de Recursos:</p>
                <p className="text-sm">Porcentaje de recursos utilizados en relación al presupuesto total del proyecto.</p>
                <div className="text-sm space-y-1">
                  <p>• <strong>Cálculo:</strong> (Costo Real / Presupuesto del Proyecto) × 100</p>
                  <p>• <strong>Costo Real:</strong> Suma de todos los gastos del proyecto</p>
                  <p>• <strong>Presupuesto:</strong> Presupuesto total asignado al proyecto</p>
                  <p>• <strong>Interpretación:</strong> Valores cercanos al 100% indican uso eficiente de recursos</p>
                </div>
              </div>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      {/* Gráficos y Análisis */}
      <Tabs defaultValue="evm" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evm">Análisis EVM</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="evm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Valor Ganado (EVM)</CardTitle>
              <CardDescription>
                Seguimiento del rendimiento del proyecto usando métricas de valor ganado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `Mes: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="planned" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Valor Planeado (PV)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="earned" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Valor Ganado (EV)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      name="Costo Real (AC)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Costos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                      <Bar dataKey="actual" fill="#8884d8" name="Costo Real" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución del Presupuesto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Gastado', value: evmData.actualCost },
                          { name: 'Restante', value: evmData.budgetAtCompletion - evmData.actualCost }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Gastado', value: evmData.actualCost },
                          { name: 'Restante', value: evmData.budgetAtCompletion - evmData.actualCost }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CPI</span>
                  <Badge variant={evmData.costPerformanceIndex >= 1 ? 'default' : 'destructive'}>
                    {evmData.costPerformanceIndex.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SPI</span>
                  <Badge variant={evmData.schedulePerformanceIndex >= 1 ? 'default' : 'destructive'}>
                    {evmData.schedulePerformanceIndex.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Productividad</span>
                  <Badge variant="outline">
                    {(kpis.productivity_index || 0).toFixed(2)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proyecciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">EAC (Estimación al Completar)</div>
                  <div className="text-lg font-bold">{formatCurrency(evmData.estimateAtCompletion)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">VAC (Varianza al Completar)</div>
                  <div className={`text-lg font-bold ${
                    evmData.varianceAtCompletion >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(evmData.varianceAtCompletion)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado del Proyecto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{kpis.completion_percentage || 0}%</div>
                  <div className="text-sm text-muted-foreground mb-4">Completado</div>
                  <Progress value={kpis.completion_percentage || 0} className="mb-4" />
                  <Badge 
                    variant={(kpis.completion_percentage || 0) >= 75 ? 'default' : 
                            (kpis.completion_percentage || 0) >= 50 ? 'secondary' : 'outline'}
                  >
                    {(kpis.completion_percentage || 0) >= 75 ? 'En etapa final' :
                     (kpis.completion_percentage || 0) >= 50 ? 'En progreso' : 'Etapa inicial'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}