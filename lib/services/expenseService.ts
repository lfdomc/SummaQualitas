// =====================================================
// SERVICIO OPTIMIZADO PARA GASTOS
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { 
  Expense, 
  CreateExpenseData, 
  UpdateExpenseData, 
  ExpenseFilters,
  ExpenseSummary,
  ProjectExpenseSummary 
} from '@/lib/types/expense';
import { PaginatedResponse, PaginationParams } from '@/lib/types';

export class ExpenseService {
  private supabase = createClient();

  /**
   * Obtiene todos los gastos con paginación y filtros optimizados
   */
  async getExpenses(
    filters?: ExpenseFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Expense>> {
    try {
      let query = this.supabase
        .from('expenses')
        .select(`
          *,
          project:projects(id, name, status),
          supplier:suppliers(id, name, email, phone, status)
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters) {
        if (filters.project_id) {
          query = query.eq('project_id', filters.project_id);
        }
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.subcategory) {
          query = query.or(`subcategory_direct.eq.${filters.subcategory},subcategory_indirect.eq.${filters.subcategory}`);
        }
        if (filters.supplier_id) {
          query = query.eq('supplier_id', filters.supplier_id);
        }
        if (filters.payment_status) {
          query = query.eq('payment_status', filters.payment_status);
        }
        if (filters.currency) {
          query = query.eq('currency', filters.currency);
        }
        if (filters.date_from) {
          query = query.gte('expense_date', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('expense_date', filters.date_to);
        }
        if (filters.amount_min) {
          query = query.gte('amount', filters.amount_min);
        }
        if (filters.amount_max) {
          query = query.lte('amount', filters.amount_max);
        }
        if (filters.search) {
          query = query.or(`description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
        }
      }

      // Aplicar paginación y ordenamiento
      if (pagination) {
        const { page, limit, sort_by = 'expense_date', sort_order = 'desc' } = pagination;
        const offset = (page - 1) * limit;
        
        query = query
          .order(sort_by, { ascending: sort_order === 'asc' })
          .range(offset, offset + limit - 1);
      } else {
        query = query.order('expense_date', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching expenses:', error);
        throw new Error(`Error al obtener gastos: ${error.message}`);
      }

      const total = count || 0;
      const currentPage = pagination?.page || 1;
      const pageSize = pagination?.limit || data?.length || 0;
      const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

      return {
        data: data as Expense[] || [],
        total,
        page: currentPage,
        limit: pageSize,
        total_pages: totalPages,
        pagination: {
          page: currentPage,
          limit: pageSize,
          total,
          total_pages: totalPages
        }
      };
    } catch (error) {
      console.error('Error in getExpenses:', error);
      throw error;
    }
  }

  /**
   * Obtiene un gasto por ID con información relacionada
   */
  async getExpenseById(id: string): Promise<Expense | null> {
    try {
      const { data, error } = await this.supabase
        .from('expenses')
        .select(`
          *,
          project:projects(id, name, status, client:clients(id, name)),
          supplier:suppliers(id, name, email, phone, status)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        console.error('Error fetching expense by ID:', error);
        throw new Error(`Error al obtener gasto: ${error.message}`);
      }

      return data as Expense;
    } catch (error) {
      console.error('Error in getExpenseById:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo gasto
   */
  async createExpense(expenseData: CreateExpenseData): Promise<Expense> {
    try {
      // Validar datos requeridos
      if (!expenseData.project_id || !expenseData.description || !expenseData.amount) {
        throw new Error('Faltan campos requeridos: project_id, description, amount');
      }

      const { data, error } = await this.supabase
        .from('expenses')
        .insert([expenseData])
        .select(`
          *,
          project:projects(id, name, status),
          supplier:suppliers(id, name, email, phone, status)
        `)
        .single();

      if (error) {
        console.error('Error creating expense:', error);
        throw new Error(`Error al crear gasto: ${error.message}`);
      }

      return data as Expense;
    } catch (error) {
      console.error('Error in createExpense:', error);
      throw error;
    }
  }

  /**
   * Actualiza un gasto existente
   */
  async updateExpense(id: string, updateData: UpdateExpenseData): Promise<Expense> {
    try {
      const { data, error } = await this.supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          project:projects(id, name, status),
          supplier:suppliers(id, name, email, phone, status)
        `)
        .single();

      if (error) {
        console.error('Error updating expense:', error);
        throw new Error(`Error al actualizar gasto: ${error.message}`);
      }

      return data as Expense;
    } catch (error) {
      console.error('Error in updateExpense:', error);
      throw error;
    }
  }

  /**
   * Elimina un gasto
   */
  async deleteExpense(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting expense:', error);
        throw new Error(`Error al eliminar gasto: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteExpense:', error);
      throw error;
    }
  }

  /**
   * Obtiene resumen de gastos por categoría
   */
  async getExpensesSummaryByCategory(projectId?: string): Promise<ExpenseSummary[]> {
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
        throw new Error(`Error al obtener resumen de gastos: ${error.message}`);
      }

      // Procesar datos para crear resumen
      const summaryMap = new Map<string, { total: number; totalUSD: number; count: number }>();
      let grandTotal = 0;
      let grandTotalUSD = 0;

      data?.forEach(expense => {
        const category = expense.category;
        const amount = expense.amount || 0;
        const exchangeRate = expense.exchange_rate_usd || 1;
        
        let amountUSD = amount;
        if (expense.currency === 'CRC') {
          amountUSD = amount / exchangeRate;
        }

        grandTotal += amount;
        grandTotalUSD += amountUSD;

        if (!summaryMap.has(category)) {
          summaryMap.set(category, { total: 0, totalUSD: 0, count: 0 });
        }

        const summary = summaryMap.get(category)!;
        summary.total += amount;
        summary.totalUSD += amountUSD;
        summary.count += 1;
      });

      // Convertir a array con porcentajes
      const result: ExpenseSummary[] = Array.from(summaryMap.entries()).map(([category, summary]) => ({
        category: category as any,
        total: summary.total,
        totalUSD: summary.totalUSD,
        count: summary.count,
        percentage: grandTotalUSD > 0 ? (summary.totalUSD / grandTotalUSD) * 100 : 0
      }));

      return result;
    } catch (error) {
      console.error('Error in getExpensesSummaryByCategory:', error);
      throw error;
    }
  }

  /**
   * Obtiene resumen de gastos por proyecto
   */
  async getExpensesSummaryByProject(): Promise<ProjectExpenseSummary[]> {
    try {
      const { data, error } = await this.supabase
        .from('expenses')
        .select(`
          project_id,
          amount,
          currency,
          exchange_rate_usd,
          project:projects(name)
        `);

      if (error) {
        console.error('Error fetching project expenses summary:', error);
        throw new Error(`Error al obtener resumen por proyecto: ${error.message}`);
      }

      // Procesar datos para crear resumen por proyecto
      const summaryMap = new Map<string, { 
        project_name: string; 
        total: number; 
        totalUSD: number; 
        count: number 
      }>();
      let grandTotalUSD = 0;

      data?.forEach(expense => {
        const projectId = expense.project_id;
        const projectName = expense.project?.name || 'Proyecto sin nombre';
        const amount = expense.amount || 0;
        const exchangeRate = expense.exchange_rate_usd || 1;
        
        let amountUSD = amount;
        if (expense.currency === 'CRC') {
          amountUSD = amount / exchangeRate;
        }

        grandTotalUSD += amountUSD;

        if (!summaryMap.has(projectId)) {
          summaryMap.set(projectId, { 
            project_name: projectName, 
            total: 0, 
            totalUSD: 0, 
            count: 0 
          });
        }

        const summary = summaryMap.get(projectId)!;
        summary.total += amount;
        summary.totalUSD += amountUSD;
        summary.count += 1;
      });

      // Convertir a array con porcentajes
      const result: ProjectExpenseSummary[] = Array.from(summaryMap.entries()).map(([projectId, summary]) => ({
        project_id: projectId,
        project_name: summary.project_name,
        total: summary.total,
        totalUSD: summary.totalUSD,
        count: summary.count,
        percentage: grandTotalUSD > 0 ? (summary.totalUSD / grandTotalUSD) * 100 : 0
      }));

      return result.sort((a, b) => b.totalUSD - a.totalUSD);
    } catch (error) {
      console.error('Error in getExpensesSummaryByProject:', error);
      throw error;
    }
  }

  /**
   * Obtiene gastos de un proyecto específico
   */
  async getExpensesByProject(
    projectId: string, 
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Expense>> {
    return this.getExpenses({ project_id: projectId }, pagination);
  }

  /**
   * Busca gastos por texto
   */
  async searchExpenses(
    searchTerm: string, 
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Expense>> {
    return this.getExpenses({ search: searchTerm }, pagination);
  }
}