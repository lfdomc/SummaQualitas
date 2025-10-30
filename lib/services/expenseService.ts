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
  ProjectExpenseSummary,
  ExpenseCategory
} from '@/lib/types/expense';
import { PaginatedResponse, PaginationParams } from '@/lib/types';

export class ExpenseService {
  private supabase = createClient();

  // Normaliza texto de error proveniente de Supabase/PostgREST
  private getErrorText(err: any): string {
    if (!err) return '';
    const parts = [err.message, err.details, err.hint].filter(Boolean);
    return parts.join(' | ').toLowerCase();
  }

  // Extrae nombre de columna desconocida desde errores tipo "Could not find the 'xxx' column"
  private extractUnknownColumnFromError(err: any): string | null {
    const text = this.getErrorText(err);
    const match = text.match(/could not find the '([^']+)' column/i);
    return match?.[1] || null;
  }

  // Elimina claves con valor undefined para evitar que PostgREST las envíe como columnas inexistentes
  private sanitizePayload<T extends Record<string, any>>(payload: T): T {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      // Conservamos valores null para poder limpiar columnas en la base de datos.
      // Solo filtramos undefined (campos no enviados) y strings vacíos.
      if (v !== undefined && v !== '') {
        clean[k] = v;
      }
    }
    return clean as T;
  }

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
        // Seleccionamos solo la tabla principal y evitamos joins para mejorar el rendimiento.
        // También cambiamos el conteo a 'planned' para evitar el costo de COUNT(*) exacto.
        .select('*', { count: 'planned' });

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

      // Construir payload con compatibilidad de esquema
      const initialPayload: Record<string, any> = {
        project_id: expenseData.project_id,
        category: expenseData.category,
        subcategory_direct: expenseData.subcategory_direct,
        subcategory_indirect: expenseData.subcategory_indirect,
        description: expenseData.description,
        amount: expenseData.amount,
        currency: expenseData.currency,
        // Mapear exchange_rate -> exchange_rate_usd si viene definido
        exchange_rate_usd: expenseData.exchange_rate,
        expense_date: expenseData.expense_date,
        supplier_id: expenseData.supplier_id,
        invoice_number: expenseData.invoice_number,
        payment_status: expenseData.payment_status,
        payment_date: expenseData.payment_date,
        notes: expenseData.notes,
        receipt_url: expenseData.receipt_url,
        reference: expenseData.reference,
        reference_attachment_url: expenseData.reference_attachment_url,
        reference_attachment_name: expenseData.reference_attachment_name,
        reference_attachment_type: expenseData.reference_attachment_type,
        reference_attachment_size: expenseData.reference_attachment_size,
        details: (expenseData as any).details,
      };

      // Asegurar defaults razonables
      if (!initialPayload.payment_status) initialPayload.payment_status = 'pendiente';
      if (!initialPayload.currency) initialPayload.currency = 'CRC';

      // Limpiar undefined/null/''
      let payload = this.sanitizePayload(initialPayload);

      const tryInsert = async (p: Record<string, any>) => {
        return await this.supabase
          .from('expenses')
          .insert([p])
          .select(`
            *,
            project:projects(id, name, status),
            supplier:suppliers(id, name, email, phone, status)
          `)
          .single();
      };

      let { data, error } = await tryInsert(payload);

      if (error) {
        const unknownColumn = this.extractUnknownColumnFromError(error);

        // Fallbacks específicos
        // Subcategorías: si el esquema no las reconoce, quitarlas ambas para asegurar la inserción
        if (unknownColumn === 'subcategory_direct' || unknownColumn === 'subcategory_indirect') {
          delete (payload as any).subcategory_direct;
          delete (payload as any).subcategory_indirect;
          ({ data, error } = await tryInsert(this.sanitizePayload(payload)));
        } else 
        if (unknownColumn === 'exchange_rate') {
          // Usar exchange_rate_usd y quitar exchange_rate
          delete (payload as any).exchange_rate;
          if (!payload.exchange_rate_usd && expenseData.exchange_rate !== undefined) {
            payload.exchange_rate_usd = expenseData.exchange_rate;
          }
          ({ data, error } = await tryInsert(this.sanitizePayload(payload)));
        } else if (unknownColumn === 'receipt_url') {
          // Quitar receipt_url si no existe en el esquema
          delete payload.receipt_url;
          ({ data, error } = await tryInsert(this.sanitizePayload(payload)));
        } else if (
          unknownColumn === 'reference_attachment_url' ||
          unknownColumn === 'reference_attachment_name' ||
          unknownColumn === 'reference_attachment_type' ||
          unknownColumn === 'reference_attachment_size'
        ) {
          delete payload.reference_attachment_url;
          delete payload.reference_attachment_name;
          delete payload.reference_attachment_type;
          delete payload.reference_attachment_size;
          ({ data, error } = await tryInsert(this.sanitizePayload(payload)));
        } else if (unknownColumn === 'expense_date') {
          // Intentar alias 'date' si existe
          if ((expenseData as any).date) {
            (payload as any).date = (expenseData as any).date;
          }
          delete payload.expense_date;
          ({ data, error } = await tryInsert(this.sanitizePayload(payload)));
        } else if (unknownColumn) {
          // Fallback genérico: quitar la columna desconocida y reintentar
          delete (payload as any)[unknownColumn];
          // Caso adicional: si la columna desconocida se relaciona con subcategorías, aseguremos quitarlas
          if (String(unknownColumn).includes('subcategory')) {
            delete (payload as any).subcategory_direct;
            delete (payload as any).subcategory_indirect;
          }
          ({ data, error } = await tryInsert(this.sanitizePayload(payload)));
        }
      }

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
      // Preparar payload de actualización con compatibilidad
      let payload: Record<string, any> = this.sanitizePayload({
        category: updateData.category,
        subcategory_direct: updateData.subcategory_direct,
        subcategory_indirect: updateData.subcategory_indirect,
        description: updateData.description,
        amount: updateData.amount,
        currency: updateData.currency,
        exchange_rate_usd: updateData.exchange_rate_usd,
        expense_date: updateData.expense_date,
        supplier_id: updateData.supplier_id,
        invoice_number: updateData.invoice_number,
        payment_status: updateData.payment_status,
        payment_date: updateData.payment_date,
        notes: updateData.notes,
        receipt_url: updateData.receipt_url,
        reference: updateData.reference,
        reference_attachment_url: updateData.reference_attachment_url,
        reference_attachment_name: updateData.reference_attachment_name,
        reference_attachment_type: updateData.reference_attachment_type,
        reference_attachment_size: updateData.reference_attachment_size,
        details: (updateData as any).details,
      });

      const tryUpdate = async (p: Record<string, any>) => {
        return await this.supabase
          .from('expenses')
          .update(p)
          .eq('id', id)
          .select(`
            *,
            project:projects(id, name, status),
            supplier:suppliers(id, name, email, phone, status)
          `)
          .single();
      };

      let { data, error } = await tryUpdate(payload);

      if (error) {
        const unknownColumn = this.extractUnknownColumnFromError(error);
        if (unknownColumn === 'subcategory_direct' || unknownColumn === 'subcategory_indirect') {
          delete (payload as any).subcategory_direct;
          delete (payload as any).subcategory_indirect;
          ({ data, error } = await tryUpdate(this.sanitizePayload(payload)));
        } else if (unknownColumn === 'exchange_rate_usd') {
          // Intentar con exchange_rate si el esquema es antiguo
          (payload as any).exchange_rate = payload.exchange_rate_usd;
          delete payload.exchange_rate_usd;
          ({ data, error } = await tryUpdate(this.sanitizePayload(payload)));
        } else if (unknownColumn === 'receipt_url') {
          delete payload.receipt_url;
          ({ data, error } = await tryUpdate(this.sanitizePayload(payload)));
        } else if (
          unknownColumn === 'reference_attachment_url' ||
          unknownColumn === 'reference_attachment_name' ||
          unknownColumn === 'reference_attachment_type' ||
          unknownColumn === 'reference_attachment_size'
        ) {
          delete payload.reference_attachment_url;
          delete payload.reference_attachment_name;
          delete payload.reference_attachment_type;
          delete payload.reference_attachment_size;
          ({ data, error } = await tryUpdate(this.sanitizePayload(payload)));
        } else if (unknownColumn === 'expense_date') {
          if ((updateData as any).date) {
            (payload as any).date = (updateData as any).date;
          }
          delete payload.expense_date;
          ({ data, error } = await tryUpdate(this.sanitizePayload(payload)));
        } else if (unknownColumn) {
          delete (payload as any)[unknownColumn];
          if (String(unknownColumn).includes('subcategory')) {
            delete (payload as any).subcategory_direct;
            delete (payload as any).subcategory_indirect;
          }
          ({ data, error } = await tryUpdate(this.sanitizePayload(payload)));
        }
      }

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
   * Obtiene resumen de gastos por categoría usando consulta optimizada
   */
  async getExpensesSummaryByCategory(projectId?: string): Promise<ExpenseSummary[]> {
    try {
      // Intentar usar función RPC optimizada primero
      const { data: rpcData, error: rpcError } = await this.supabase.rpc('get_expenses_summary_by_category', {
        p_project_id: projectId
      });

      if (!rpcError && rpcData) {
        return rpcData;
      }

      // Fallback a consulta optimizada con agregación en la base de datos
      let baseQuery = (
        this.supabase
          .from('expenses')
          .select(`
            category,
            currency,
            sum(amount) as total_amount,
            count(*) as expense_count,
            avg(amount) as avg_amount
          `) as any
      ).group('category, currency');

      if (projectId) {
        baseQuery = baseQuery.eq('project_id', projectId);
      }

      const { data, error } = await baseQuery;

      if (error) {
        console.error('Error fetching expenses summary:', error);
        throw new Error(`Error al obtener resumen de gastos: ${error.message}`);
      }

      // Procesar datos agrupados para crear resumen final
      const categoryMap = new Map<string, { total: number; totalUSD: number; count: number }>();
      let grandTotalUSD = 0;

      data?.forEach((row: any) => {
        const category = row.category;
        const amount = parseFloat(row.total_amount) || 0;
        const count = parseInt(row.expense_count) || 0;
        
        // Conversión aproximada a USD (se puede mejorar con tipo de cambio real)
        const amountUSD = row.currency === 'USD' ? amount : amount / 500;
        grandTotalUSD += amountUSD;

        if (!categoryMap.has(category)) {
          categoryMap.set(category, { total: 0, totalUSD: 0, count: 0 });
        }

        const summary = categoryMap.get(category)!;
        summary.total += amount;
        summary.totalUSD += amountUSD;
        summary.count += count;
      });

      // Convertir a array con porcentajes
      const result: ExpenseSummary[] = Array.from(categoryMap.entries()).map(([category, summary]) => ({
        category: category as ExpenseCategory,
        total: summary.total,
        totalUSD: summary.totalUSD,
        count: summary.count,
        percentage: grandTotalUSD > 0 ? (summary.totalUSD / grandTotalUSD) * 100 : 0
      }));

      return result.sort((a, b) => b.totalUSD - a.totalUSD);
    } catch (error) {
      console.error('Error in getExpensesSummaryByCategory:', error);
      throw error;
    }
  }

  /**
   * Obtiene resumen de gastos por proyecto usando consulta optimizada
   */
  async getExpensesSummaryByProject(): Promise<ProjectExpenseSummary[]> {
    try {
      // Intentar usar función RPC optimizada primero
      const { data: rpcData, error: rpcError } = await this.supabase.rpc('get_expenses_summary_by_project');

      if (!rpcError && rpcData) {
        return rpcData;
      }

      // Fallback a consulta optimizada con agregación en la base de datos
      const { data, error } = await (
        this.supabase
          .from('expenses')
          .select(`
            project_id,
            currency,
            sum(amount) as total_amount,
            count(*) as expense_count,
            project:projects(name)
          `) as any
      ).group('project_id, currency');

      if (error) {
        console.error('Error fetching project expenses summary:', error);
        throw new Error(`Error al obtener resumen por proyecto: ${error.message}`);
      }

      // Procesar datos agrupados para crear resumen final
      const projectMap = new Map<string, { 
        project_name: string; 
        total: number; 
        totalUSD: number; 
        count: number 
      }>();
      let grandTotalUSD = 0;

      data?.forEach((row: any) => {
        const projectId = row.project_id;
        const projectName = row.project?.name || 'Proyecto sin nombre';
        const amount = parseFloat(row.total_amount) || 0;
        const count = parseInt(row.expense_count) || 0;
        
        // Conversión aproximada a USD (se puede mejorar con tipo de cambio real)
        const amountUSD = row.currency === 'USD' ? amount : amount / 500;
        grandTotalUSD += amountUSD;

        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, { 
            project_name: projectName, 
            total: 0, 
            totalUSD: 0, 
            count: 0 
          });
        }

        const summary = projectMap.get(projectId)!;
        summary.total += amount;
        summary.totalUSD += amountUSD;
        summary.count += count;
      });

      // Convertir a array con porcentajes
      const result: ProjectExpenseSummary[] = Array.from(projectMap.entries()).map(([projectId, summary]) => ({
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