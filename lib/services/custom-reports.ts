// =====================================================
// SERVICIO PARA REPORTES PERSONALIZADOS
// =====================================================

import { supabase } from '@/lib/supabase/client';
import {
  CustomReportType,
  CustomReportFilters,
  DirectExpensesByProjectMonth,
  ProjectTotalIncome,
  SupplierExpensesByYear,
  MonthlyExpensesByCategory,
  ProjectProfitabilityAnalysis,
  SupplierPaymentAnalysis,
  QuarterlyFinancialSummary,
  ProjectCostBreakdown,
  AnnualRevenueAnalysis,
  ExpenseTrendAnalysis
} from '@/lib/types/custom-reports';

export class CustomReportsService {
  
  // Obtener gastos directos por proyecto y mes
  static async getDirectExpensesByProjectMonth(
    projectIds: string[],
    month: number,
    year: number,
    filters?: CustomReportFilters
  ): Promise<DirectExpensesByProjectMonth[]> {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          project:projects(id, name, client:clients(name)),
          supplier:suppliers(name)
        `)
        .eq('category', 'costos_directos')
        .gte('expense_date', `${year}-${month.toString().padStart(2, '0')}-01`)
        .lt('expense_date', `${year}-${(month + 1).toString().padStart(2, '0')}-01`);

      if (projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      }

      if (filters?.supplierIds && filters.supplierIds.length > 0) {
        query = query.in('supplier_id', filters.supplierIds);
      }

      if (filters?.currency && filters.currency !== 'both') {
        query = query.eq('currency', filters.currency);
      }

      const { data: expenses, error } = await query;

      if (error) throw error;

      // Agrupar por proyecto
      const projectGroups = expenses?.reduce((acc, expense) => {
        const projectId = expense.project_id;
        if (!acc[projectId]) {
          acc[projectId] = {
            project: expense.project,
            expenses: []
          };
        }
        acc[projectId].expenses.push(expense);
        return acc;
      }, {} as any) || {};

      // Procesar datos por proyecto
      const result: DirectExpensesByProjectMonth[] = Object.values(projectGroups).map((group: any) => {
        const directExpenses = {
          subcontratos: 0,
          materiales: 0,
          otros: 0,
          total: 0
        };

        let totalInCRC = 0;
        let totalInUSD = 0;
        let exchangeRate = 1;

        group.expenses.forEach((expense: any) => {
          const amount = expense.amount;
          const subcategory = expense.subcategory_direct || 'otros';
          
          directExpenses[subcategory as keyof typeof directExpenses] += amount;
          directExpenses.total += amount;

          if (expense.currency === 'CRC') {
            totalInCRC += amount;
            if (expense.exchange_rate_usd) {
              totalInUSD += amount / expense.exchange_rate_usd;
              exchangeRate = expense.exchange_rate_usd;
            }
          } else {
            totalInUSD += amount;
            if (expense.exchange_rate_usd) {
              totalInCRC += amount * expense.exchange_rate_usd;
              exchangeRate = expense.exchange_rate_usd;
            }
          }
        });

        return {
          project: {
            id: group.project.id,
            name: group.project.name,
            client: group.project.client?.name || 'Sin cliente'
          },
          month: new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long' }),
          year,
          directExpenses,
          totalInCRC,
          totalInUSD,
          exchangeRate,
          expenseCount: group.expenses.length
        };
      });

      return result;
    } catch (error) {
      console.error('Error fetching direct expenses by project month:', error);
      throw error;
    }
  }

  // Obtener ingresos totales por proyecto
  static async getProjectTotalIncome(
    projectIds: string[],
    dateFrom?: string,
    dateTo?: string,
    filters?: CustomReportFilters
  ): Promise<ProjectTotalIncome[]> {
    try {
      let query = supabase
        .from('incomes')
        .select(`
          *,
          project:projects(id, name, status, estimated_start_date, estimated_end_date),
          client:clients(name)
        `);

      if (projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      }

      if (dateFrom) {
        query = query.gte('received_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('received_date', dateTo);
      }

      if (filters?.currency && filters.currency !== 'both') {
        query = query.eq('currency', filters.currency);
      }

      const { data: incomes, error } = await query;

      if (error) throw error;

      // Agrupar por proyecto
      const projectGroups = incomes?.reduce((acc, income) => {
        const projectId = income.project_id;
        if (!acc[projectId]) {
          acc[projectId] = {
            project: income.project,
            client: income.client,
            incomes: []
          };
        }
        acc[projectId].incomes.push(income);
        return acc;
      }, {} as any) || {};

      // Procesar datos por proyecto
      const result: ProjectTotalIncome[] = Object.values(projectGroups).map((group: any) => {
        let totalIncome = 0;
        let totalIncomeCRC = 0;
        let totalIncomeUSD = 0;
        let confirmedIncome = 0;
        let pendingIncome = 0;
        let firstIncomeDate: string | undefined;
        let lastIncomeDate: string | undefined;

        group.incomes.forEach((income: any) => {
          const amount = income.amount;
          totalIncome += amount;

          if (income.currency === 'CRC') {
            totalIncomeCRC += amount;
            if (income.exchange_rate_usd) {
              totalIncomeUSD += amount / income.exchange_rate_usd;
            }
          } else {
            totalIncomeUSD += amount;
            if (income.exchange_rate_usd) {
              totalIncomeCRC += amount * income.exchange_rate_usd;
            }
          }

          if (income.status === 'confirmed' || income.status === 'confirmado') {
            confirmedIncome += amount;
          } else {
            pendingIncome += amount;
          }

          const incomeDate = income.received_date;
          if (!firstIncomeDate || incomeDate < firstIncomeDate) {
            firstIncomeDate = incomeDate;
          }
          if (!lastIncomeDate || incomeDate > lastIncomeDate) {
            lastIncomeDate = incomeDate;
          }
        });

        // Calcular promedio mensual
        let averageIncomePerMonth = 0;
        if (firstIncomeDate && lastIncomeDate) {
          const startDate = new Date(firstIncomeDate);
          const endDate = new Date(lastIncomeDate);
          const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (endDate.getMonth() - startDate.getMonth()) + 1;
          averageIncomePerMonth = totalIncome / Math.max(monthsDiff, 1);
        }

        return {
          project: {
            id: group.project.id,
            name: group.project.name,
            client: group.client?.name || 'Sin cliente',
            status: group.project.status,
            startDate: group.project.estimated_start_date,
            endDate: group.project.estimated_end_date
          },
          totalIncome,
          totalIncomeCRC,
          totalIncomeUSD,
          confirmedIncome,
          pendingIncome,
          incomeCount: group.incomes.length,
          firstIncomeDate,
          lastIncomeDate,
          averageIncomePerMonth
        };
      });

      return result;
    } catch (error) {
      console.error('Error fetching project total income:', error);
      throw error;
    }
  }

  // Obtener gastos por proveedor durante el año
  static async getSupplierExpensesByYear(
    year: number,
    supplierIds?: string[],
    filters?: CustomReportFilters
  ): Promise<SupplierExpensesByYear[]> {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          supplier:suppliers(id, name, contact_name, email),
          project:projects(id, name)
        `)
        .gte('expense_date', `${year}-01-01`)
        .lt('expense_date', `${year + 1}-01-01`);

      if (supplierIds && supplierIds.length > 0) {
        query = query.in('supplier_id', supplierIds);
      }

      if (filters?.projectIds && filters.projectIds.length > 0) {
        query = query.in('project_id', filters.projectIds);
      }

      if (filters?.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      const { data: expenses, error } = await query;

      if (error) throw error;

      // Agrupar por proveedor
      const supplierGroups = expenses?.reduce((acc, expense) => {
        const supplierId = expense.supplier_id;
        if (!supplierId || !expense.supplier) return acc;

        if (!acc[supplierId]) {
          acc[supplierId] = {
            supplier: expense.supplier,
            expenses: []
          };
        }
        acc[supplierId].expenses.push(expense);
        return acc;
      }, {} as any) || {};

      // Procesar datos por proveedor
      const result: SupplierExpensesByYear[] = Object.values(supplierGroups).map((group: any) => {
        let totalExpenses = 0;
        let totalExpensesCRC = 0;
        let totalExpensesUSD = 0;

        const categoriesMap = new Map();
        const monthlyMap = new Map();
        const projectsMap = new Map();

        group.expenses.forEach((expense: any) => {
          const amount = expense.amount;
          totalExpenses += amount;

          if (expense.currency === 'CRC') {
            totalExpensesCRC += amount;
            if (expense.exchange_rate_usd) {
              totalExpensesUSD += amount / expense.exchange_rate_usd;
            }
          } else {
            totalExpensesUSD += amount;
            if (expense.exchange_rate_usd) {
              totalExpensesCRC += amount * expense.exchange_rate_usd;
            }
          }

          // Agrupar por categoría
          const category = expense.category;
          if (!categoriesMap.has(category)) {
            categoriesMap.set(category, { amount: 0, count: 0 });
          }
          const catData = categoriesMap.get(category);
          catData.amount += amount;
          catData.count += 1;

          // Agrupar por mes
          const expenseDate = new Date(expense.expense_date);
          const monthKey = expenseDate.toLocaleDateString('es-ES', { month: 'long' });
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { amount: 0, count: 0 });
          }
          const monthData = monthlyMap.get(monthKey);
          monthData.amount += amount;
          monthData.count += 1;

          // Agrupar por proyecto
          if (expense.project) {
            const projectId = expense.project.id;
            if (!projectsMap.has(projectId)) {
              projectsMap.set(projectId, {
                projectName: expense.project.name,
                amount: 0,
                count: 0
              });
            }
            const projectData = projectsMap.get(projectId);
            projectData.amount += amount;
            projectData.count += 1;
          }
        });

        return {
          supplier: {
            id: group.supplier.id,
            name: group.supplier.name,
            contactName: group.supplier.contact_name,
            email: group.supplier.email
          },
          year,
          totalExpenses,
          totalExpensesCRC,
          totalExpensesUSD,
          expenseCount: group.expenses.length,
          categories: Array.from(categoriesMap.entries()).map(([category, data]) => ({
            category,
            amount: data.amount,
            count: data.count
          })),
          monthlyBreakdown: Array.from(monthlyMap.entries()).map(([month, data]) => ({
            month,
            amount: data.amount,
            count: data.count
          })),
          projects: Array.from(projectsMap.entries()).map(([projectId, data]) => ({
            projectId,
            projectName: data.projectName,
            amount: data.amount,
            count: data.count
          }))
        };
      });

      return result;
    } catch (error) {
      console.error('Error fetching supplier expenses by year:', error);
      throw error;
    }
  }

  // Obtener gastos mensuales por categoría
  static async getMonthlyExpensesByCategory(
    month: number,
    year: number,
    filters?: CustomReportFilters
  ): Promise<MonthlyExpensesByCategory[]> {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', `${year}-${month.toString().padStart(2, '0')}-01`)
        .lt('expense_date', `${year}-${(month + 1).toString().padStart(2, '0')}-01`);

      if (filters?.projectIds && filters.projectIds.length > 0) {
        query = query.in('project_id', filters.projectIds);
      }

      if (filters?.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      if (filters?.supplierIds && filters.supplierIds.length > 0) {
        query = query.in('supplier_id', filters.supplierIds);
      }

      const { data: expenses, error } = await query;

      if (error) throw error;

      // Agrupar por categoría y subcategoría
      const categoryMap = new Map();
      let totalAmount = 0;
      let totalAmountCRC = 0;
      let totalAmountUSD = 0;
      let totalCount = 0;

      expenses?.forEach((expense) => {
        const amount = expense.amount;
        const category = expense.category;
        const subcategory = expense.subcategory_direct || expense.subcategory_indirect || 'general';
        
        const key = `${category}-${subcategory}`;
        
        if (!categoryMap.has(key)) {
          categoryMap.set(key, {
            category,
            subcategory,
            amount: 0,
            amountCRC: 0,
            amountUSD: 0,
            count: 0
          });
        }

        const catData = categoryMap.get(key);
        catData.amount += amount;
        catData.count += 1;

        if (expense.currency === 'CRC') {
          catData.amountCRC += amount;
          totalAmountCRC += amount;
          if (expense.exchange_rate_usd) {
            catData.amountUSD += amount / expense.exchange_rate_usd;
            totalAmountUSD += amount / expense.exchange_rate_usd;
          }
        } else {
          catData.amountUSD += amount;
          totalAmountUSD += amount;
          if (expense.exchange_rate_usd) {
            catData.amountCRC += amount * expense.exchange_rate_usd;
            totalAmountCRC += amount * expense.exchange_rate_usd;
          }
        }

        totalAmount += amount;
        totalCount += 1;
      });

      // Calcular porcentajes y crear resultado
      const categories = Array.from(categoryMap.values()).map((catData) => ({
        ...catData,
        percentage: totalAmount > 0 ? (catData.amount / totalAmount) * 100 : 0
      }));

      return [{
        month: new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long' }),
        year,
        categories,
        totalAmount,
        totalAmountCRC,
        totalAmountUSD,
        totalCount
      }];
    } catch (error) {
      console.error('Error fetching monthly expenses by category:', error);
      throw error;
    }
  }

  // Análisis de rentabilidad por proyecto
  static async getProjectProfitabilityAnalysis(
    projectIds: string[],
    dateFrom?: string,
    dateTo?: string
  ): Promise<ProjectProfitabilityAnalysis[]> {
    try {
      // Obtener datos de proyectos
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, name, budget, status,
          client:clients(name)
        `)
        .in('id', projectIds);

      if (projectsError) throw projectsError;

      const result: ProjectProfitabilityAnalysis[] = [];

      for (const project of projects || []) {
        // Obtener ingresos del proyecto
        let incomeQuery = supabase
          .from('incomes')
          .select('*')
          .eq('project_id', project.id);

        if (dateFrom) incomeQuery = incomeQuery.gte('received_date', dateFrom);
        if (dateTo) incomeQuery = incomeQuery.lte('received_date', dateTo);

        const { data: incomes } = await incomeQuery;

        // Obtener gastos del proyecto
        let expenseQuery = supabase
          .from('expenses')
          .select('*')
          .eq('project_id', project.id);

        if (dateFrom) expenseQuery = expenseQuery.gte('expense_date', dateFrom);
        if (dateTo) expenseQuery = expenseQuery.lte('expense_date', dateTo);

        const { data: expenses } = await expenseQuery;

        // Calcular totales
        const totalIncome = incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
        const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
        const grossProfit = totalIncome - totalExpenses;
        const profitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
        const roi = project.budget > 0 ? (grossProfit / project.budget) * 100 : 0;
        const budgetUtilization = project.budget > 0 ? (totalExpenses / project.budget) * 100 : 0;

        // Desglose de gastos por categoría
        const expenseBreakdown = expenses?.reduce((acc, expense) => {
          const category = expense.category;
          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category] += expense.amount;
          return acc;
        }, {} as any) || {};

        const expenseBreakdownArray = Object.entries(expenseBreakdown).map(([category, amount]) => ({
          category,
          amount: amount as number,
          percentage: totalExpenses > 0 ? ((amount as number) / totalExpenses) * 100 : 0
        }));

        // Desglose mensual de ingresos y gastos
        const incomeBreakdown = this.getMonthlyBreakdown(incomes || [], 'received_date');
        const expenseBreakdown_monthly = this.getMonthlyBreakdown(expenses || [], 'expense_date');

        result.push({
          project: {
            id: project.id,
            name: project.name,
            client: project.client?.name || 'Sin cliente',
            status: project.status,
            budget: project.budget || 0
          },
          totalIncome,
          totalExpenses,
          grossProfit,
          profitMargin,
          roi,
          budgetUtilization,
          expenseBreakdown: expenseBreakdownArray,
          incomeBreakdown,
          expenseBreakdown_monthly
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching project profitability analysis:', error);
      throw error;
    }
  }

  // Método auxiliar para desglose mensual
  private static getMonthlyBreakdown(data: any[], dateField: string) {
    const monthlyMap = new Map();
    
    data.forEach((item) => {
      const date = new Date(item[dateField]);
      const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, 0);
      }
      monthlyMap.set(monthKey, monthlyMap.get(monthKey) + item.amount);
    });

    return Array.from(monthlyMap.entries()).map(([month, amount]) => ({
      month,
      amount
    }));
  }

  // Análisis de pagos a proveedores
  static async getSupplierPaymentAnalysis(
    supplierIds: string[],
    dateFrom?: string,
    dateTo?: string
  ): Promise<SupplierPaymentAnalysis[]> {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          supplier:suppliers(id, name, contact_name),
          project:projects(id, name)
        `)
        .in('supplier_id', supplierIds);

      if (dateFrom) query = query.gte('expense_date', dateFrom);
      if (dateTo) query = query.lte('expense_date', dateTo);

      const { data: expenses, error } = await query;

      if (error) throw error;

      // Agrupar por proveedor
      const supplierGroups = expenses?.reduce((acc, expense) => {
        const supplierId = expense.supplier_id;
        if (!supplierId) return acc;

        if (!acc[supplierId]) {
          acc[supplierId] = {
            supplier: expense.supplier,
            expenses: []
          };
        }
        acc[supplierId].expenses.push(expense);
        return acc;
      }, {} as any) || {};

      const result: SupplierPaymentAnalysis[] = Object.values(supplierGroups).map((group: any) => {
        let totalAmount = 0;
        let paidAmount = 0;
        let pendingAmount = 0;
        let cancelledAmount = 0;
        let totalPaymentDays = 0;
        let paidInvoicesCount = 0;

        const projectsMap = new Map();
        const monthlyMap = new Map();

        group.expenses.forEach((expense: any) => {
          const amount = expense.amount;
          totalAmount += amount;

          switch (expense.payment_status) {
            case 'pagado':
              paidAmount += amount;
              if (expense.payment_date && expense.expense_date) {
                const expenseDate = new Date(expense.expense_date);
                const paymentDate = new Date(expense.payment_date);
                const daysDiff = Math.ceil((paymentDate.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
                totalPaymentDays += daysDiff;
                paidInvoicesCount += 1;
              }
              break;
            case 'pendiente':
              pendingAmount += amount;
              break;
            case 'cancelado':
              cancelledAmount += amount;
              break;
          }

          // Agrupar por proyecto
          if (expense.project) {
            const projectId = expense.project.id;
            if (!projectsMap.has(projectId)) {
              projectsMap.set(projectId, {
                projectName: expense.project.name,
                amount: 0,
                paidAmount: 0,
                pendingAmount: 0
              });
            }
            const projectData = projectsMap.get(projectId);
            projectData.amount += amount;
            if (expense.payment_status === 'pagado') {
              projectData.paidAmount += amount;
            } else if (expense.payment_status === 'pendiente') {
              projectData.pendingAmount += amount;
            }
          }

          // Agrupar por mes
          const expenseDate = new Date(expense.expense_date);
          const monthKey = expenseDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { amount: 0, invoiceCount: 0 });
          }
          const monthData = monthlyMap.get(monthKey);
          monthData.amount += amount;
          monthData.invoiceCount += 1;
        });

        const paymentRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
        const averagePaymentTime = paidInvoicesCount > 0 ? totalPaymentDays / paidInvoicesCount : 0;

        return {
          supplier: {
            id: group.supplier.id,
            name: group.supplier.name,
            contactName: group.supplier.contact_name
          },
          totalAmount,
          paidAmount,
          pendingAmount,
          cancelledAmount,
          paymentRate,
          averagePaymentTime,
          invoiceCount: group.expenses.length,
          projects: Array.from(projectsMap.entries()).map(([projectId, data]) => ({
            projectId,
            projectName: data.projectName,
            amount: data.amount,
            paidAmount: data.paidAmount,
            pendingAmount: data.pendingAmount
          })),
          paymentHistory: Array.from(monthlyMap.entries()).map(([month, data]) => ({
            month,
            amount: data.amount,
            invoiceCount: data.invoiceCount
          }))
        };
      });

      return result;
    } catch (error) {
      console.error('Error fetching supplier payment analysis:', error);
      throw error;
    }
  }
}

export default CustomReportsService;