/**
 * Servicio de base de datos optimizado con caché
 * Utiliza las funciones optimizadas de PostgreSQL con caché inteligente
 */

import { createClient } from '@/lib/supabase/client';
import { cacheService } from './cacheService';

const supabase = createClient();

export interface DashboardKPIs {
  total_projects: number;
  active_projects: number;
  completed_projects?: number;
  total_expenses: number;
  total_incomes: number;
  pending_payments: number;
  monthly_expenses: number;
  monthly_incomes: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  total_budget: number;
  total_expenses: number;
  total_incomes: number;
  net_balance: number;
  expense_count: number;
  income_count: number;
}

export interface IncomeWithProject {
  id: string;
  project_id: string;
  project_name: string;
  client_name: string;
  amount: number;
  currency: string;
  received_date: string;
  status: string;
  description: string;
}

export interface ExpenseSearchResult {
  id: string;
  project_id: string;
  supplier_name: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  payment_status: string;
}

export interface ExpensesByCategory {
  category: string;
  total_amount: number;
  expense_count: number;
  avg_amount: number;
}

class OptimizedDatabaseService {
  
  /**
   * Obtiene KPIs del dashboard con caché
   * TTL: 2 minutos (datos que cambian frecuentemente)
   */
  async getDashboardKPIs(): Promise<DashboardKPIs | null> {
    return cacheService.withCache(
      'get_dashboard_kpis',
      {},
      async () => {
        const response = await fetch('/api/dashboard/kpis');
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error fetching dashboard KPIs:', errorData);
          throw new Error(`Error al obtener KPIs: ${errorData.error}`);
        }
        
        const data = await response.json();

        return data || null;
      },
      2 * 60 * 1000 // 2 minutos
    );
  }

  /**
   * Obtiene proyectos con resumen financiero con caché
   * TTL: 5 minutos (datos que cambian moderadamente)
   */
  async getProjectsWithSummary(
    limit: number = 20,
    offset: number = 0
  ): Promise<ProjectSummary[]> {
    const params = { limit, offset };
    
    return cacheService.withCache(
      'get_projects_with_summary',
      params,
      async () => {
        const response = await fetch(`/api/projects/summary?limit=${limit}&offset=${offset}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error fetching projects with summary:', errorData);
          throw new Error(`Error al obtener proyectos: ${errorData.error}`);
        }

        const data = await response.json();
        return data || [];
      },
      5 * 60 * 1000 // 5 minutos
    );
  }

  /**
   * Obtiene ingresos con información del proyecto con caché
   * TTL: 3 minutos
   */
  async getIncomesWithProjectInfo(
    limit: number = 20,
    offset: number = 0,
    projectId?: string,
    status?: string
  ): Promise<IncomeWithProject[]> {
    const params = {
      p_limit: limit,
      p_offset: offset,
      p_project_id: projectId || null,
      p_status: status || null
    };
    
    return cacheService.withCache(
      'get_incomes_with_project_info',
      params,
      async () => {
        const { data, error } = await supabase.rpc('get_incomes_with_project_info', params);
        
        if (error) {
          console.error('Error fetching incomes with project info:', error);
          throw new Error(`Error al obtener ingresos: ${error.message}`);
        }

        return data || [];
      },
      3 * 60 * 1000 // 3 minutos
    );
  }

  /**
   * Busca gastos con texto completo con caché
   * TTL: 1 minuto (búsquedas pueden cambiar frecuentemente)
   */
  async searchExpensesFulltext(
    searchTerm: string,
    limit: number = 20,
    offset: number = 0,
    projectId?: string
  ): Promise<ExpenseSearchResult[]> {
    const params = {
      p_search_term: searchTerm,
      p_limit: limit,
      p_offset: offset,
      p_project_id: projectId || null
    };
    
    return cacheService.withCache(
      'search_expenses_fulltext',
      params,
      async () => {
        const { data, error } = await supabase.rpc('search_expenses_fulltext', params);
        
        if (error) {
          console.error('Error searching expenses:', error);
          throw new Error(`Error al buscar gastos: ${error.message}`);
        }

        return data || [];
      },
      1 * 60 * 1000 // 1 minuto
    );
  }

  /**
   * Obtiene gastos por categoría y período con caché
   * TTL: 10 minutos (análisis que no cambia frecuentemente)
   */
  async getExpensesByCategory(
    startDate: string,
    endDate: string,
    projectId?: string
  ): Promise<ExpensesByCategory[]> {
    const params = {
      p_start_date: startDate,
      p_end_date: endDate,
      p_project_id: projectId || null
    };
    
    return cacheService.withCache(
      'get_expenses_by_category_period',
      params,
      async () => {
        const { data, error } = await supabase.rpc('get_expenses_by_category_period', params);
        
        if (error) {
          console.error('Error fetching expenses by category:', error);
          throw new Error(`Error al obtener gastos por categoría: ${error.message}`);
        }

        return data || [];
      },
      10 * 60 * 1000 // 10 minutos
    );
  }

  /**
   * Invalida caché relacionado con un proyecto específico
   */
  invalidateProjectCache(projectId: string): void {
    cacheService.invalidateProject(projectId);
    // También invalidar KPIs ya que pueden verse afectados
    cacheService.invalidateFunction('get_dashboard_kpis');
  }

  /**
   * Invalida caché relacionado con gastos
   */
  invalidateExpensesCache(): void {
    cacheService.invalidateFunction('search_expenses_fulltext');
    cacheService.invalidateFunction('get_expenses_by_category_period');
    cacheService.invalidateFunction('get_dashboard_kpis');
  }

  /**
   * Invalida caché relacionado con ingresos
   */
  invalidateIncomesCache(): void {
    cacheService.invalidateFunction('get_incomes_with_project_info');
    cacheService.invalidateFunction('get_dashboard_kpis');
  }

  /**
   * Invalida todo el caché
   */
  invalidateAllCache(): void {
    cacheService.clear();
  }

  /**
   * Obtiene estadísticas del caché
   */
  getCacheStats() {
    return cacheService.getStats();
  }

  /**
   * Precarga datos frecuentemente utilizados
   */
  async preloadFrequentData(): Promise<void> {
    try {
      console.log('🔄 Precargando datos frecuentes...');
      
      // Precargar KPIs del dashboard
      await this.getDashboardKPIs();
      
      // Precargar primeros proyectos
      await this.getProjectsWithSummary(10, 0);
      
      // Precargar primeros ingresos
      await this.getIncomesWithProjectInfo(10, 0);
      
      console.log('✅ Datos frecuentes precargados');
    } catch (error) {
      console.error('❌ Error precargando datos:', error);
    }
  }
}

// Instancia singleton del servicio optimizado
export const optimizedDatabaseService = new OptimizedDatabaseService();

export default optimizedDatabaseService;