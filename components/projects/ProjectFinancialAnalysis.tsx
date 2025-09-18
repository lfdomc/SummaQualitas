'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import { incomeService } from '@/lib/supabase/database';
import type { ProjectIncomesSummary } from '@/types/database';

interface ProjectFinancialAnalysisProps {
  projectId: string;
  projectBudget?: number;
  projectExpenses?: {
    total: number;
    byCategory: {
      costos_directos: number;
      costos_indirectos: number;
      gastos_administrativos: number;
      mano_obra: number;
    };
  };
}

interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  budgetUtilization: number;
  roi: number;
}

interface CategoryComparison {
  category: string;
  income: number;
  expenses: number;
  difference: number;
  percentage: number;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function ProjectFinancialAnalysis({ 
  projectId, 
  projectBudget = 0, 
  projectExpenses 
}: ProjectFinancialAnalysisProps) {
  const [incomesSummary, setIncomesSummary] = useState<ProjectIncomesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [categoryComparison, setCategoryComparison] = useState<CategoryComparison[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, [projectId]);

  useEffect(() => {
    if (incomesSummary && projectExpenses) {
      calculateMetrics();
      calculateCategoryComparison();
    }
  }, [incomesSummary, projectExpenses, projectBudget]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const summary = await incomeService.getProjectIncomesSummary(projectId);
      setIncomesSummary(summary);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (!incomesSummary || !projectExpenses) return;

    const totalIncome = incomesSummary.confirmed_amount || 0;
    const totalExpenses = projectExpenses.total || 0;
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const budgetUtilization = projectBudget > 0 ? (totalExpenses / projectBudget) * 100 : 0;
    const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

    setMetrics({
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      budgetUtilization,
      roi
    });
  };

  const calculateCategoryComparison = () => {
    if (!incomesSummary || !projectExpenses) return;

    const totalIncome = incomesSummary.confirmed_amount || 0;
    const categories = [
      {
        category: 'Costos Directos',
        income: totalIncome * 0.6, // Asumiendo distribución proporcional
        expenses: projectExpenses.byCategory.costos_directos || 0
      },
      {
        category: 'Costos Indirectos',
        income: totalIncome * 0.2,
        expenses: projectExpenses.byCategory.costos_indirectos || 0
      },
      {
        category: 'Gastos Administrativos',
        income: totalIncome * 0.1,
        expenses: projectExpenses.byCategory.gastos_administrativos || 0
      },
      {
        category: 'Mano de Obra',
        income: totalIncome * 0.1,
        expenses: projectExpenses.byCategory.mano_obra || 0
      }
    ];

    const comparison = categories.map(cat => ({
      ...cat,
      difference: cat.income - cat.expenses,
      percentage: cat.income > 0 ? ((cat.income - cat.expenses) / cat.income) * 100 : 0
    }));

    setCategoryComparison(comparison);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (value: number, threshold: number = 0) => {
    if (value > threshold) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (value === threshold) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (value: number, threshold: number = 0) => {
    if (value > threshold) return 'text-green-600';
    if (value === threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-lg">Cargando análisis financiero...</div>
      </div>
    );
  }

  if (!incomesSummary || !projectExpenses || !metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Datos insuficientes</h3>
            <p className="text-gray-600">Se necesitan datos de ingresos y gastos para generar el análisis financiero</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = categoryComparison.map(cat => ({
    category: cat.category,
    ingresos: cat.income,
    gastos: cat.expenses,
    diferencia: cat.difference
  }));

  const pieData = [
    { name: 'Ingresos Confirmados', value: metrics.totalIncome, color: '#10B981' },
    { name: 'Gastos Totales', value: metrics.totalExpenses, color: '#EF4444' },
    { name: 'Ganancia Neta', value: Math.max(0, metrics.netProfit), color: '#06B6D4' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Análisis Financiero del Proyecto</h2>
        <p className="text-gray-600">Comparación de ingresos vs gastos y métricas de rentabilidad</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            {getStatusIcon(metrics.netProfit)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.netProfit)}`}>
              {formatCurrency(metrics.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos - Gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen de Ganancia</CardTitle>
            {getStatusIcon(metrics.profitMargin, 10)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.profitMargin, 10)}`}>
              {metrics.profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Ganancia / Ingresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            {getStatusIcon(metrics.roi, 15)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.roi, 15)}`}>
              {metrics.roi.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Retorno sobre inversión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso del Presupuesto</CardTitle>
            {getStatusIcon(100 - metrics.budgetUtilization, 10)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(100 - metrics.budgetUtilization, 10)}`}>
              {metrics.budgetUtilization.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Gastos / Presupuesto
            </p>
            <Progress value={metrics.budgetUtilization} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Comparación por Categoría</TabsTrigger>
          <TabsTrigger value="distribution">Distribución</TabsTrigger>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos vs Gastos por Categoría</CardTitle>
              <CardDescription>
                Comparación detallada de ingresos estimados vs gastos reales por categoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#10B981" name="Ingresos Estimados" />
                  <Bar dataKey="gastos" fill="#EF4444" name="Gastos Reales" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryComparison.map((cat, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{cat.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ingresos Estimados:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(cat.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gastos Reales:</span>
                      <span className="font-semibold text-red-600">{formatCurrency(cat.expenses)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Diferencia:</span>
                      <span className={`font-bold ${getStatusColor(cat.difference)}`}>
                        {formatCurrency(cat.difference)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Variación:</span>
                      <Badge variant={cat.percentage >= 0 ? 'default' : 'destructive'}>
                        {cat.percentage >= 0 ? '+' : ''}{cat.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribución Financiera</CardTitle>
              <CardDescription>
                Visualización de la distribución de ingresos, gastos y ganancias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Presupuesto Total:</span>
                  <span className="font-semibold">{formatCurrency(projectBudget)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ingresos Confirmados:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(metrics.totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Gastos Totales:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(metrics.totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="font-medium">Ganancia Neta:</span>
                  <span className={`font-bold text-lg ${getStatusColor(metrics.netProfit)}`}>
                    {formatCurrency(metrics.netProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores Clave</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Margen de Ganancia:</span>
                    <Badge variant={metrics.profitMargin >= 10 ? 'default' : 'destructive'}>
                      {metrics.profitMargin.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={Math.max(0, metrics.profitMargin)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ROI:</span>
                    <Badge variant={metrics.roi >= 15 ? 'default' : 'destructive'}>
                      {metrics.roi.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={Math.max(0, metrics.roi)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uso del Presupuesto:</span>
                    <Badge variant={metrics.budgetUtilization <= 90 ? 'default' : 'destructive'}>
                      {metrics.budgetUtilization.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={metrics.budgetUtilization} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}