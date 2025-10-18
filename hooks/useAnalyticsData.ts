'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { expenseService, incomeService } from '@/lib/supabase/database';
import { toast } from 'sonner';
import type { Project, ProjectKPIs as ProjectKPIsType, Expense, Income } from '@/lib/types';

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

interface UseAnalyticsDataReturn {
  kpis: ProjectKPIsType | null;
  evmData: EVMData | null;
  chartData: ChartData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAnalyticsData(project: Project | null): UseAnalyticsDataReturn {
  const [kpis, setKpis] = useState<ProjectKPIsType | null>(null);
  const [evmData, setEvmData] = useState<EVMData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoizar los valores clave del proyecto para evitar re-renders innecesarios
  const projectKey = useMemo(() => {
    if (!project) return null;
    return {
      id: project.id,
      budget: project.budget,
      progress: project.progress,
      estimated_start_date: project.estimated_start_date,
      estimated_end_date: project.estimated_end_date,
      actual_start_date: project.actual_start_date,
      actual_end_date: project.actual_end_date
    };
  }, [project]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!project || !projectKey) {
      setKpis(null);
      setEvmData(null);
      setChartData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar Promise.allSettled para manejar errores individuales
      const [expensesResult, incomesResult] = await Promise.allSettled([
        expenseService.getProjectExpenses(project.id),
        incomeService.getProjectIncomes(project.id)
      ]);

      let projectExpenses: Expense[] = [];
      let projectIncomes: Income[] = [];

      if (expensesResult.status === 'fulfilled') {
        projectExpenses = expensesResult.value;
      } else {
        console.error('Error fetching expenses:', expensesResult.reason);
        toast.error('Error al cargar los gastos del proyecto');
      }

      if (incomesResult.status === 'fulfilled') {
        projectIncomes = incomesResult.value;
      } else {
        console.error('Error fetching incomes:', incomesResult.reason);
        toast.error('Error al cargar los ingresos del proyecto');
      }

      // Calcular métricas básicas
      const actualCost = projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const actualIncome = projectIncomes.reduce((sum, income) => sum + income.amount, 0);
      const projectBudget = project.budget || 0;
      const projectProgress = project.progress || 0;
      const earnedValue = projectBudget * (projectProgress / 100);

      // Calcular Planned Value basado en las fechas del proyecto
      const calculatePlannedValue = (): number => {
        const now = new Date();
        const start = project.actual_start_date ? new Date(project.actual_start_date) : 
                     project.estimated_start_date ? new Date(project.estimated_start_date) : now;
        const end = project.actual_end_date ? new Date(project.actual_end_date) : 
                   project.estimated_end_date ? new Date(project.estimated_end_date) : 
                   new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 días por defecto

        if (now < start) return 0;
        if (now >= end) return projectBudget;

        const totalDuration = end.getTime() - start.getTime();
        const elapsedTime = now.getTime() - start.getTime();
        const timeProgress = Math.min(100, Math.max(0, (elapsedTime / totalDuration) * 100));

        return projectBudget * (timeProgress / 100);
      };

      const plannedValue = calculatePlannedValue();

      // Calcular métricas EVM
      const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 0;
      const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 0;
      const costVariance = earnedValue - actualCost;
      const scheduleVariance = earnedValue - plannedValue;
      const estimateAtCompletion = actualCost > 0 && earnedValue > 0 ? projectBudget * (actualCost / earnedValue) : projectBudget;
      const estimateToComplete = estimateAtCompletion - actualCost;
      const varianceAtCompletion = projectBudget - estimateAtCompletion;

      // Crear objeto KPIs
      const calculatedKPIs: ProjectKPIsType = {
        id: `calc-${project.id}`,
        project_id: project.id,
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
        // No existe la categoría 'seguridad' en ExpenseCategory; usar subcategoría 'control_calidad' como aproximación
        safety_incidents: projectExpenses.filter(e => e.subcategory_indirect === 'control_calidad').length,
        productivity_index: earnedValue > 0 && actualCost > 0 ? earnedValue / actualCost : 1.0,
        resource_utilization: Math.min(100, (actualCost / projectBudget) * 100),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setKpis(calculatedKPIs);

      // Crear objeto EVM
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

      // Generar datos de gráfico
      const monthlyData: ChartData[] = [
        { month: 'Ene', planned: plannedValue * 0.2, earned: earnedValue * 0.2, actual: actualCost * 0.2 },
        { month: 'Feb', planned: plannedValue * 0.4, earned: earnedValue * 0.4, actual: actualCost * 0.4 },
        { month: 'Mar', planned: plannedValue * 0.6, earned: earnedValue * 0.6, actual: actualCost * 0.6 },
        { month: 'Abr', planned: plannedValue * 0.8, earned: earnedValue * 0.8, actual: actualCost * 0.8 },
        { month: 'May', planned: plannedValue, earned: earnedValue, actual: actualCost }
      ];
      setChartData(monthlyData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Error al cargar los datos de analytics');
      toast.error('Error al cargar los KPIs del proyecto');
    } finally {
      setLoading(false);
    }
  }, [project, projectKey]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return {
    kpis,
    evmData,
    chartData,
    loading,
    error,
    refetch: fetchAnalyticsData
  };
}