// =====================================================
// SERVICIO OPTIMIZADO PARA CONSULTAS AGREGADAS
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { Project, Income, Expense, ChangeOrder } from '@/types/database';

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

// Typed result for project report data
export interface ProjectReportData {
  project: Project | null;
  incomes: Income[];
  expenses: Expense[];
  changeOrders: ChangeOrder[];
  error?: string;
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
            client:clients(name)
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
        client_name: (project as any)?.client?.name || '',
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
  async getProjectReportData(projectId: string): Promise<ProjectReportData> {
    try {
      console.log('🔍 Iniciando getProjectReportData para proyecto:', projectId);
      
      // Validar que el projectId sea válido
      if (!projectId || typeof projectId !== 'string') {
        throw new Error(`ID de proyecto inválido: ${projectId}`);
      }

      // Consultas paralelas optimizadas con selects específicos y límites
      const [projectData, incomesData, expensesData, changeOrdersData] = await Promise.all([
        this.supabase
          .from('projects')
          .select(`
            id,
            name,
            status,
            presupuesto_original,
            presupuesto_inicial,
            presupuesto_final,
            budget,
            costos_directos,
            costos_indirectos,
            administracion,
            mano_obra,
            imprevistos,
            utilidad,
            estimated_start_date,
            created_at,
            updated_at,
            client_id,
            client:clients(id, name, email)
          `)
          .eq('id', projectId)
          .single(),

        this.supabase
          .from('incomes')
          .select(`
            *,
            client:clients(id, name)
          `)
          .eq('project_id', projectId)
          .order('received_date', { ascending: false })
          .limit(100), // Limitar a los 100 ingresos más recientes

        this.supabase
          .from('expenses')
          .select(`
            id,
            project_id,
            category,
            subcategory_direct,
            subcategory_indirect,
            description,
            amount,
            currency,
            exchange_rate_usd,
            expense_date,
            supplier_id,
            invoice_number,
            payment_status,
            payment_date,
            notes,
            receipt_url,
            reference,
            reference_attachment_url,
            reference_attachment_name,
            reference_attachment_type,
            reference_attachment_size,
            details,
            created_by,
            created_at,
            updated_at
          `)
          .eq('project_id', projectId)
          .order('expense_date', { ascending: false })
          .limit(200), // Limitar a los 200 gastos más recientes

        this.supabase
          .from('change_orders')
          // Selección flexible para evitar errores de columna inexistente en esquemas antiguos
          // Usamos * y luego normalizamos en memoria a la estructura esperada
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(50) // Limitar a las 50 órdenes de cambio más recientes
      ]);

      // Logging detallado de errores con manejo específico para autenticación
      if (projectData.error) {
        console.error('❌ Error en consulta de proyecto:', projectData.error);
        if (projectData.error.code === 'PGRST301' || projectData.error.message?.includes('JWT')) {
          return { project: null, incomes: [], expenses: [], changeOrders: [], error: 'Usuario no autenticado. Por favor, inicia sesión para acceder a los datos del proyecto.' };
        }
        if (projectData.error.code === 'PGRST116' || projectData.error.message?.includes('RLS')) {
          return { project: null, incomes: [], expenses: [], changeOrders: [], error: 'No tienes permisos para acceder a este proyecto. Verifica tu autenticación.' };
        }
      }
      if (incomesData.error) {
        console.error('❌ Error en consulta de ingresos:', incomesData.error);
        if (incomesData.error.code === 'PGRST301' || incomesData.error.message?.includes('JWT')) {
          return { project: null, incomes: [], expenses: [], changeOrders: [], error: 'Usuario no autenticado. Por favor, inicia sesión para acceder a los ingresos.' };
        }
      }
      if (expensesData.error) {
        console.error('❌ Error en consulta de gastos:', expensesData.error);
        if (expensesData.error.code === 'PGRST301' || expensesData.error.message?.includes('JWT')) {
          return { project: null, incomes: [], expenses: [], changeOrders: [], error: 'Usuario no autenticado. Por favor, inicia sesión para acceder a los gastos.' };
        }
      }
      if (changeOrdersData.error) {
        console.error('❌ Error en consulta de órdenes de cambio:', changeOrdersData.error);
        if (changeOrdersData.error.code === 'PGRST301' || changeOrdersData.error.message?.includes('JWT')) {
          return { project: null, incomes: [], expenses: [], changeOrders: [], error: 'Usuario no autenticado. Por favor, inicia sesión para acceder a las órdenes de cambio.' };
        }
      }

      // Logging de datos obtenidos
      console.log('📊 Datos obtenidos:', {
        project: projectData.data ? 'OK' : 'NULL',
        incomes: incomesData.data?.length || 0,
        expenses: expensesData.data?.length || 0,
        changeOrders: changeOrdersData.data?.length || 0
      });

      const hasErrors = projectData.error || incomesData.error || expensesData.error || changeOrdersData.error;
      
      if (hasErrors) {
        // Construir mensaje de error descriptivo con detalles de cada consulta que falló
        const errorMessages: string[] = [];
        if (projectData.error) errorMessages.push(`Proyecto: ${projectData.error.message}`);
        if (incomesData.error) errorMessages.push(`Ingresos: ${incomesData.error.message}`);
        if (expensesData.error) errorMessages.push(`Gastos: ${expensesData.error.message}`);
        if (changeOrdersData.error) errorMessages.push(`Órdenes de cambio: ${changeOrdersData.error.message}`);
        const aggregatedMessage = `Se encontraron errores en las consultas: ${errorMessages.join(' | ')}`;
        console.error('❌', aggregatedMessage);
        return { project: null, incomes: [], expenses: [], changeOrders: [], error: aggregatedMessage };
      } else {
        console.log('✅ Todas las consultas completadas exitosamente');
      }

      // Normalización de órdenes de cambio para tolerar diferencias de esquema
      const rawChangeOrders = changeOrdersData.data || [];
      const normalizedChangeOrders = rawChangeOrders.map((co: any) => {
        const currency: 'CRC' | 'USD' = (co.currency === 'USD' ? 'USD' : 'CRC');
        // Usar exchange_rate si existe, sino intentar exchange_rate_usd, sino 600 por defecto
        const exchangeRate: number = co.exchange_rate ?? co.exchange_rate_usd ?? 600;
        const baseAmount: number = co.cost_impact ?? co.amount ?? 0;
        const costImpactCRC: number = co.cost_impact_crc ?? (currency === 'USD' ? baseAmount * exchangeRate : baseAmount);

        return {
          id: co.id,
          project_id: co.project_id || projectId,
          project: undefined,
          document_number: co.document_number ?? co.doc_number ?? co.reference_number ?? '',
          title: co.title ?? co.description ?? 'Orden de cambio',
          change_type: (co.change_type ?? co.type ?? 'extras') as 'accion_correctiva' | 'accion_preventiva' | 'extras',
          impact_type: (co.impact_type ?? 'positivo') as 'positivo' | 'negativo',
          description: co.description ?? '',
          cost_impact: typeof baseAmount === 'number' ? baseAmount : Number(baseAmount) || 0,
          currency,
          exchange_rate: typeof exchangeRate === 'number' ? exchangeRate : Number(exchangeRate) || 600,
          cost_impact_crc: costImpactCRC,
          status: (co.status ?? 'pendiente') as 'pendiente' | 'aprobado' | 'rechazado' | 'implementado',
          schedule_impact_days: co.schedule_impact_days ?? 0,
          requested_date: co.requested_date ?? co.request_date ?? co.created_at ?? new Date().toISOString(),
          implementation_date: co.implementation_date ?? undefined,
          created_by: co.created_by ?? undefined,
          created_at: co.created_at ?? new Date().toISOString(),
          updated_at: co.updated_at ?? new Date().toISOString(),
          // Opcionales adicionales no requeridos por el tipo
          cost_impact_level: co.cost_impact_level ?? undefined,
          quality_impact_level: co.quality_impact_level ?? undefined,
          schedule_impact_level: co.schedule_impact_level ?? undefined,
          risk_impact_level: co.risk_impact_level ?? undefined,
          cost_comments: co.cost_comments ?? undefined,
          quality_comments: co.quality_comments ?? undefined,
          schedule_comments: co.schedule_comments ?? undefined,
          risk_comments: co.risk_comments ?? undefined,
          general_comments: co.general_comments ?? undefined,
          approved_by: co.approved_by ?? undefined,
          approved_at: co.approved_at ?? undefined,
          rejection_reason: co.rejection_reason ?? undefined
        };
      });

      // Normalización de ingresos para tolerar diferencias de esquema (reference vs reference_number)
      const rawIncomes = incomesData.data || [];
      const normalizedIncomes = rawIncomes.map((inc: any) => ({
        ...inc,
        // Preferir 'reference', con fallback a variantes antiguas
        reference: inc.reference ?? inc.reference_number ?? inc.reference_no ?? inc.referenceNumber ?? null
      }));

      // Normalización de gastos para cumplir con el tipo Expense esperado por el frontend
      const rawExpenses = expensesData.data || [];
      const normalizedExpenses = rawExpenses.map((exp: any) => {
        const expenseDate: string = exp.expense_date || exp.date || new Date().toISOString().split('T')[0];
        return {
          id: exp.id,
          project_id: exp.project_id || projectId,
          project: undefined,
          category: exp.category || 'costos_directos',
          subcategory_direct: exp.subcategory_direct || undefined,
          subcategory_indirect: exp.subcategory_indirect || undefined,
          description: exp.description || '',
          amount: typeof exp.amount === 'number' ? exp.amount : Number(exp.amount) || 0,
          currency: (exp.currency === 'USD' ? 'USD' : 'CRC') as 'CRC' | 'USD',
          exchange_rate_usd: exp.exchange_rate_usd || undefined,
          expense_date: expenseDate,
          date: exp.date || undefined,
          supplier_id: exp.supplier_id || undefined,
          supplier: undefined, // Evitar discrepancias de tipado con Supplier parcial
          invoice_number: exp.invoice_number || undefined,
          payment_status: exp.payment_status || undefined,
          payment_date: exp.payment_date || undefined,
          notes: exp.notes || undefined,
          receipt_url: exp.receipt_url || undefined,
          reference: exp.reference || undefined,
          reference_attachment_url: exp.reference_attachment_url || undefined,
          reference_attachment_name: exp.reference_attachment_name || undefined,
          reference_attachment_type: exp.reference_attachment_type || undefined,
          reference_attachment_size: exp.reference_attachment_size || undefined,
          details: exp.details || undefined,
          created_by: exp.created_by || undefined,
          created_at: exp.created_at || new Date().toISOString(),
          updated_at: exp.updated_at || new Date().toISOString(),
        };
      });

      const rawProject = projectData.data as any;
      const normalizedProject = rawProject
        ? { ...rawProject, client: Array.isArray(rawProject?.client) ? rawProject.client[0] : rawProject.client }
        : null;

      return {
        project: normalizedProject as Project,
        incomes: normalizedIncomes as Income[],
        expenses: normalizedExpenses as Expense[],
        changeOrders: normalizedChangeOrders as ChangeOrder[]
      };
    } catch (error) {
      console.error('💥 Error crítico en getProjectReportData:', error);
      return {
        project: null,
        incomes: [],
        expenses: [],
        changeOrders: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

// Exportar instancia singleton
export const aggregatedQueryService = new AggregatedQueryService();