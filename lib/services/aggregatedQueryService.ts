// =====================================================
// SERVICIO OPTIMIZADO PARA CONSULTAS AGREGADAS
// =====================================================

import { createClient } from '@/lib/supabase/client';

export interface ProjectSummaryData {
  project_id: string;
  project_name: string;
  project_status: string;
  client_name?: string;
  total_incomes: number;
  total_expenses: number;
  total_change_orders: number;
  confirmed_incomes: number;
  pending_incomes: number;
  total_incomes_usd: number;
  total_expenses_usd: number;
  profit_margin: number;
  budget_utilization: number;
  last_activity_date?: string;
}

export interface ExpenseSummaryByCategory {
  category: string;
  total_amount: number;
  total_amount_usd: number;
  count: number;
  percentage: number;
  avg_amount: number;
}

export interface IncomeSummaryByStatus {
  status: string;
  total_amount: number;
  count: number;
  percentage: number;
}

export class AggregatedQueryService {
  private supabase = createClient();

  /**
   * Obtiene resumen completo de un proyecto con una sola consulta optimizada
   */
  async getProjectSummary(projectId: string): Promise<ProjectSummaryData | null> {
    try {
      // Consulta optimizada que obtiene todos los datos necesarios en una sola llamada
      const { data, error } = await this.supabase.rpc('get_project_summary_optimized', {
        p_project_id: projectId
      });

      if (error) {
        console.error('Error in getProjectSummary:', error);
        // Fallback a consultas separadas si la función RPC no existe
        return this.getProjectSummaryFallback(projectId);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getProjectSummary:', error);
      return this.getProjectSummaryFallback(projectId);
    }
  }

  /**
   * Fallback para obtener resumen del proyecto con consultas separadas pero optimizadas
   */
  private async getProjectSummaryFallback(projectId: string): Promise<ProjectSummaryData | null> {
    try {
      // Consultas paralelas optimizadas
      const [projectData, incomesData, expensesData] = await Promise.all([
        // Proyecto con cliente
        this.supabase
          .from('projects')
          .select(`
            id,
            name,
            status,
            presupuesto_original,
            clients(name)
          `)
          .eq('id', projectId)
          .single(),

        // Resumen de ingresos
        this.supabase
          .from('incomes')
          .select('amount, status, currency')
          .eq('project_id', projectId),

        // Resumen de gastos
        this.supabase
          .from('expenses')
          .select('amount, currency, exchange_rate_usd')
          .eq('project_id', projectId)
      ]);

      if (projectData.error) {
        console.error('Error fetching project:', projectData.error);
        return null;
      }

      const project = projectData.data;
      const incomes = incomesData.data || [];
      const expenses = expensesData.data || [];

      // Cálculos optimizados
      const totalIncomes = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
      const confirmedIncomes = incomes
        .filter(income => income.status === 'confirmed' || income.status === 'confirmado')
        .reduce((sum, income) => sum + (income.amount || 0), 0);
      const pendingIncomes = incomes
        .filter(income => income.status === 'pending' || income.status === 'pendiente')
        .reduce((sum, income) => sum + (income.amount || 0), 0);

      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

      // Conversión a USD optimizada
      const totalIncomesUSD = incomes.reduce((sum, income) => {
        const amount = income.amount || 0;
        return sum + (income.currency === 'USD' ? amount : amount / 600); // Tipo de cambio aproximado
      }, 0);

      const totalExpensesUSD = expenses.reduce((sum, expense) => {
        const amount = expense.amount || 0;
        const exchangeRate = expense.exchange_rate_usd || 600;
        return sum + (expense.currency === 'USD' ? amount : amount / exchangeRate);
      }, 0);

      const profitMargin = totalIncomesUSD > 0 ? ((totalIncomesUSD - totalExpensesUSD) / totalIncomesUSD) * 100 : 0;
      const budget = project.presupuesto_original || 0;
      const budgetUtilization = budget > 0 ? (totalExpensesUSD / budget) * 100 : 0;

      return {
        project_id: projectId,
        project_name: project.name || '',
        project_status: project.status || '',
        client_name: project.clients?.name,
        total_incomes: totalIncomes,
        total_expenses: totalExpenses,
        total_change_orders: 0, // Se puede agregar después
        confirmed_incomes: confirmedIncomes,
        pending_incomes: pendingIncomes,
        total_incomes_usd: totalIncomesUSD,
        total_expenses_usd: totalExpensesUSD,
        profit_margin: profitMargin,
        budget_utilization: budgetUtilization
      };
    } catch (error) {
      console.error('Error in getProjectSummaryFallback:', error);
      return null;
    }
  }

  /**
   * Obtiene resumen de gastos por categoría con cálculos en la base de datos
   */
  async getExpensesSummaryByCategory(projectId?: string): Promise<ExpenseSummaryByCategory[]> {
    try {
      let query = this.supabase
        .from('expenses')
        .select('category, amount, currency, exchange_rate_usd');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching expenses summary:', error);
        return [];
      }

      // Procesamiento optimizado en memoria
      const categoryMap = new Map<string, {
        total: number;
        totalUSD: number;
        count: number;
      }>();

      let grandTotalUSD = 0;

      data?.forEach(expense => {
        const category = expense.category;
        const amount = expense.amount || 0;
        const exchangeRate = expense.exchange_rate_usd || 600;
        
        const amountUSD = expense.currency === 'USD' ? amount : amount / exchangeRate;
        grandTotalUSD += amountUSD;

        if (!categoryMap.has(category)) {
          categoryMap.set(category, { total: 0, totalUSD: 0, count: 0 });
        }

        const summary = categoryMap.get(category)!;
        summary.total += amount;
        summary.totalUSD += amountUSD;
        summary.count += 1;
      });

      return Array.from(categoryMap.entries()).map(([category, summary]) => ({
        category,
        total_amount: summary.total,
        total_amount_usd: summary.totalUSD,
        count: summary.count,
        percentage: grandTotalUSD > 0 ? (summary.totalUSD / grandTotalUSD) * 100 : 0,
        avg_amount: summary.count > 0 ? summary.totalUSD / summary.count : 0
      }));
    } catch (error) {
      console.error('Error in getExpensesSummaryByCategory:', error);
      return [];
    }
  }

  /**
   * Obtiene resumen de ingresos por estado
   */
  async getIncomesSummaryByStatus(projectId?: string): Promise<IncomeSummaryByStatus[]> {
    try {
      let query = this.supabase
        .from('incomes')
        .select('status, amount');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching incomes summary:', error);
        return [];
      }

      const statusMap = new Map<string, { total: number; count: number }>();
      let grandTotal = 0;

      data?.forEach(income => {
        const status = income.status;
        const amount = income.amount || 0;
        grandTotal += amount;

        if (!statusMap.has(status)) {
          statusMap.set(status, { total: 0, count: 0 });
        }

        const summary = statusMap.get(status)!;
        summary.total += amount;
        summary.count += 1;
      });

      return Array.from(statusMap.entries()).map(([status, summary]) => ({
        status,
        total_amount: summary.total,
        count: summary.count,
        percentage: grandTotal > 0 ? (summary.total / grandTotal) * 100 : 0
      }));
    } catch (error) {
      console.error('Error in getIncomesSummaryByStatus:', error);
      return [];
    }
  }

  /**
   * Obtiene datos completos para reportes con una sola consulta optimizada
   */
  async getProjectReportData(projectId: string) {
    try {
      // Consultas paralelas optimizadas con selects específicos
      const [projectData, incomesData, expensesData, changeOrdersData] = await Promise.all([
        this.supabase
          .from('projects')
          .select(`
            id,
            name,
            status,
            presupuesto_original,
            clients(id, name, email)
          `)
          .eq('id', projectId)
          .single(),

        this.supabase
          .from('incomes')
          .select(`
            id,
            amount,
            description,
            category,
            status,
            received_date,
            currency,
            payment_method,
            reference
          `)
          .eq('project_id', projectId)
          .order('received_date', { ascending: false }),

        this.supabase
          .from('expenses')
          .select(`
            id,
            category,
            subcategory_direct,
            subcategory_indirect,
            description,
            amount,
            currency,
            exchange_rate_usd,
            expense_date,
            supplier:suppliers(name),
            payment_status
          `)
          .eq('project_id', projectId)
          .order('expense_date', { ascending: false }),

        this.supabase
          .from('change_orders')
          .select(`
            id,
            type,
            description,
            amount,
            status,
            created_at
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
      ]);

      return {
        project: projectData.data,
        incomes: incomesData.data || [],
        expenses: expensesData.data || [],
        changeOrders: changeOrdersData.data || [],
        error: projectData.error || incomesData.error || expensesData.error || changeOrdersData.error
      };
    } catch (error) {
      console.error('Error in getProjectReportData:', error);
      return {
        project: null,
        incomes: [],
        expenses: [],
        changeOrders: [],
        error
      };
    }
  }
}

// Exportar instancia singleton
export const aggregatedQueryService = new AggregatedQueryService();