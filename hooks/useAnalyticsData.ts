'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Project, ProjectKPIs as ProjectKPIsType } from '@/lib/types';

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

export function useAnalyticsData(project: Project | null, options?: { from?: string; to?: string; usdRate?: number }): UseAnalyticsDataReturn {
  const [kpis, setKpis] = useState<ProjectKPIsType | null>(null);
  const [evmData, setEvmData] = useState<EVMData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utilidad: convertir valores a número de forma robusta
  const toNumber = (value: any): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const digits = value.replace(/[^0-9.\-]/g, '');
      const num = Number(digits);
      return Number.isFinite(num) ? num : 0;
    }
    return 0;
  };

  // Memoizar los valores clave del proyecto para evitar re-renders innecesarios
  const projectKey = useMemo(() => {
    if (!project) return null;
    return {
      id: project.id,
      presupuesto_final: project.presupuesto_final,
      presupuesto_inicial: project.presupuesto_inicial,
      budget: project.budget,
      progress_percentage: (project as any).progress_percentage,
      progress: (project as any).progress,
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
      const params = new URLSearchParams({ projectId: project.id });
      if (options?.from) params.set('from', options.from);
      if (options?.to) params.set('to', options.to);
      if (options?.usdRate) params.set('usdRate', String(options.usdRate));

      const res = await fetch(`/api/analytics?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Error al obtener datos de analytics');
      }

      const summary = json?.data?.summary || {};
      const series = json?.data?.series || [];

      const budgetAtCompletion = toNumber(summary?.budgetAtCompletion) || 0;
      const completionPercentage = toNumber(summary?.completionPercentage) || 0;
      const totalPV = toNumber(summary?.totalPV) || 0;
      const totalEV = toNumber(summary?.totalEV) || 0;
      const totalActualCost = toNumber(summary?.totalActualCost) || 0;
      const cpi = toNumber(summary?.cpi) || 0;
      const spi = toNumber(summary?.spi) || 0;
      const eac = toNumber(summary?.eac) || budgetAtCompletion;
      const vac = toNumber(summary?.vac) || (budgetAtCompletion - eac);

      const calculatedKPIs: ProjectKPIsType = {
        id: `calc-${project.id}`,
        project_id: project.id,
        planned_value: totalPV,
        earned_value: totalEV,
        actual_cost: totalActualCost,
        cost_performance_index: cpi,
        schedule_performance_index: spi,
        budget_at_completion: budgetAtCompletion,
        estimate_at_completion: eac,
        cost_variance: totalEV - totalActualCost,
        schedule_variance: totalEV - totalPV,
        estimate_to_complete: eac - totalActualCost,
        variance_at_completion: vac,
        completion_percentage: completionPercentage,
        quality_score: 8.5,
        safety_incidents: 0,
        productivity_index: totalActualCost > 0 ? totalEV / totalActualCost : 1.0,
        resource_utilization: budgetAtCompletion > 0 ? Math.min(100, (totalActualCost / budgetAtCompletion) * 100) : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setKpis(calculatedKPIs);

      const evm: EVMData = {
        plannedValue: totalPV,
        earnedValue: totalEV,
        actualCost: totalActualCost,
        budgetAtCompletion,
        estimateAtCompletion: eac,
        costVariance: totalEV - totalActualCost,
        scheduleVariance: totalEV - totalPV,
        costPerformanceIndex: cpi,
        schedulePerformanceIndex: spi,
        estimateToComplete: eac - totalActualCost,
        varianceAtCompletion: vac
      };

      setEvmData(evm);

      const formatMonthKey = (key: string): string => {
        const parts = String(key).split('-');
        const y = parts[0];
        const m = parts[1];
        const monthIndex = Number(m) - 1;
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) return String(key);
        return `${months[monthIndex]} ${y}`;
      };

      const monthlyData: ChartData[] = (series as any[]).map((item) => ({
        month: formatMonthKey(String(item?.month || '')),
        planned: toNumber(item?.planned) || 0,
        earned: toNumber(item?.earned) || 0,
        actual: toNumber(item?.actual) || 0
      }));

      setChartData(monthlyData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Error al cargar los datos de analytics');
      toast.error('Error al cargar los KPIs del proyecto');
    } finally {
      setLoading(false);
    }
  }, [project, projectKey, options]);

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