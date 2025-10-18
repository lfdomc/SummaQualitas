'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Building, Users } from 'lucide-react';
import { useDashboardKPIs, useProjectsWithSummary, useCacheStats } from '@/hooks/useOptimizedData';

/**
 * Componente de dashboard optimizado que utiliza caché para mejorar el rendimiento
 */
export default function OptimizedDashboard() {
  const { 
    data: kpis, 
    loading: kpisLoading, 
    error: kpisError, 
    refetch: refetchKPIs 
  } = useDashboardKPIs();

  const { 
    data: projects, 
    loading: projectsLoading, 
    error: projectsError, 
    refetch: refetchProjects 
  } = useProjectsWithSummary(5, 0);

  const cacheStats = useCacheStats();

  const handleRefresh = async () => {
    await Promise.all([refetchKPIs(), refetchProjects()]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calcular métricas derivadas cuando haya datos de KPIs
  const netProfit = (kpis?.total_incomes || 0) - (kpis?.total_expenses || 0);
  const profitMargin = (kpis && kpis.total_incomes > 0)
    ? (netProfit / kpis.total_incomes) * 100
    : 0;

  if (kpisError || projectsError) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              <span>Error al cargar los datos: {kpisError || projectsError}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-8 pt-6">
      {/* Header con estadísticas de caché */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Optimizado</h1>
          <p className="text-gray-600 mt-1">Vista general con caché inteligente</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            <Badge variant="outline" className="mr-2">
              Caché: {formatPercentage(cacheStats.hitRate)} aciertos
            </Badge>
            <Badge variant="secondary">
              {cacheStats.size} elementos
            </Badge>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={kpisLoading || projectsLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(kpisLoading || projectsLoading) ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Proyectos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis?.total_projects || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {kpis?.active_projects || 0} activos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total de Ingresos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(kpis?.total_incomes || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Último mes: {formatCurrency(kpis?.monthly_incomes || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total de Gastos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(kpis?.total_expenses || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Último mes: {formatCurrency(kpis?.monthly_expenses || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ganancia Neta */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${
                  netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Margen: {formatPercentage(profitMargin)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Proyectos Recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Proyectos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between items-center p-4 border rounded">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="flex justify-between items-center p-4 border rounded hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <div className="flex items-center mt-2 space-x-4">
                      <Badge variant={project.status === 'en_progreso' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Ingresos: {formatCurrency(project.total_incomes || 0)} · Gastos: {formatCurrency(project.total_expenses || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={"text-sm text-muted-foreground"}>
                      Presupuesto: {formatCurrency(project.total_budget || 0)}
                    </div>
                    <div className={`text-sm font-medium ${
                      ((project.total_incomes || 0) - (project.total_expenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Balance: {formatCurrency((project.total_incomes || 0) - (project.total_expenses || 0))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay proyectos disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de Rendimiento */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Información de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Elementos en Caché:</span>
              <div className="text-lg font-bold text-blue-800">{cacheStats.size}</div>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Tasa de Aciertos:</span>
              <div className="text-lg font-bold text-blue-800">{formatPercentage(cacheStats.hitRate)}</div>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Total Solicitudes:</span>
              <div className="text-lg font-bold text-blue-800">{cacheStats.totalRequests}</div>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Aciertos/Fallos:</span>
              <div className="text-lg font-bold text-blue-800">{cacheStats.hits}/{cacheStats.misses}</div>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-4">
            💡 El caché mejora significativamente el rendimiento al evitar consultas repetidas a la base de datos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}