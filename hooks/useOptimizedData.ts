/**
 * Hook personalizado para usar el servicio de base de datos optimizado
 * Proporciona datos con caché automático y gestión de estado
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  optimizedDatabaseService,
  DashboardKPIs,
  ProjectSummary,
  IncomeWithProject,
  ExpenseSearchResult,
  ExpensesByCategory
} from '@/lib/services/optimizedDatabaseService';

interface UseOptimizedDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener KPIs del dashboard
 */
export function useDashboardKPIs(): UseOptimizedDataState<DashboardKPIs> {
  const [state, setState] = useState<UseOptimizedDataState<DashboardKPIs>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await optimizedDatabaseService.getDashboardKPIs();
      setState(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false 
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData
  };
}

/**
 * Hook para obtener proyectos con resumen
 */
export function useProjectsWithSummary(
  limit: number = 20,
  offset: number = 0
): UseOptimizedDataState<ProjectSummary[]> {
  const [state, setState] = useState<UseOptimizedDataState<ProjectSummary[]>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await optimizedDatabaseService.getProjectsWithSummary(limit, offset);
      setState(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false 
      }));
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData
  };
}

/**
 * Hook para obtener ingresos con información del proyecto
 */
export function useIncomesWithProjectInfo(
  limit: number = 20,
  offset: number = 0,
  projectId?: string,
  status?: string
): UseOptimizedDataState<IncomeWithProject[]> {
  const [state, setState] = useState<UseOptimizedDataState<IncomeWithProject[]>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await optimizedDatabaseService.getIncomesWithProjectInfo(
        limit, 
        offset, 
        projectId, 
        status
      );
      setState(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false 
      }));
    }
  }, [limit, offset, projectId, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData
  };
}

/**
 * Hook para buscar gastos con texto completo
 */
export function useExpenseSearch(
  searchTerm: string,
  limit: number = 20,
  offset: number = 0,
  projectId?: string
): UseOptimizedDataState<ExpenseSearchResult[]> {
  const [state, setState] = useState<UseOptimizedDataState<ExpenseSearchResult[]>>({
    data: null,
    loading: false,
    error: null,
    refetch: async () => {}
  });

  const fetchData = useCallback(async () => {
    if (!searchTerm.trim()) {
      setState(prev => ({ ...prev, data: [], loading: false, error: null }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await optimizedDatabaseService.searchExpensesFulltext(
        searchTerm,
        limit,
        offset,
        projectId
      );
      setState(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false 
      }));
    }
  }, [searchTerm, limit, offset, projectId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData
  };
}

/**
 * Hook para obtener gastos por categoría
 */
export function useExpensesByCategory(
  startDate: string,
  endDate: string,
  projectId?: string
): UseOptimizedDataState<ExpensesByCategory[]> {
  const [state, setState] = useState<UseOptimizedDataState<ExpensesByCategory[]>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await optimizedDatabaseService.getExpensesByCategory(
        startDate,
        endDate,
        projectId
      );
      setState(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false 
      }));
    }
  }, [startDate, endDate, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData
  };
}

/**
 * Hook para obtener estadísticas del caché
 */
export function useCacheStats() {
  const [stats, setStats] = useState(optimizedDatabaseService.getCacheStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(optimizedDatabaseService.getCacheStats());
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  return stats;
}