'use client';

import { useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LabelList, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnalyticsLoader } from './AnalyticsLoader';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import type { Project } from '@/types/database';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface ProjectKPIsProps {
  project: Project | null;
}

export default function ProjectKPIs({ project }: ProjectKPIsProps) {
  const { kpis, evmData, chartData, loading, error } = useAnalyticsData(project);

  const getPerformanceStatus = useCallback((value: number, threshold: number = 1) => {
    if (value >= threshold) return { status: 'good', color: 'text-green-600', icon: TrendingUp };
    if (value >= threshold * 0.9) return { status: 'warning', color: 'text-yellow-600', icon: Clock };
    return { status: 'poor', color: 'text-red-600', icon: TrendingDown };
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  // Memoizar los estados de rendimiento para evitar recálculos innecesarios
  const cpiStatus = useMemo(() => 
    evmData ? getPerformanceStatus(evmData.costPerformanceIndex) : { status: 'poor', color: 'text-gray-400', icon: Clock }
  , [evmData, getPerformanceStatus]);

  const spiStatus = useMemo(() => 
    evmData ? getPerformanceStatus(evmData.schedulePerformanceIndex) : { status: 'poor', color: 'text-gray-400', icon: Clock }
  , [evmData, getPerformanceStatus]);

  if (loading) {
    return <AnalyticsLoader />;
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
                      <YAxis 
                        domain={[0, 'dataMax']} 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} 
                      />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                      <Bar dataKey="actual" fill="#8884d8" name="Costo Real">
                        <LabelList 
                          dataKey="actual" 
                          position="center" 
                          fill="white" 
                          fontSize={12}
                          formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
                        />
                      </Bar>
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

export { ProjectKPIs };