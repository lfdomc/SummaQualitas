import { createClient } from '@/lib/supabase/client';
import { Project, SystemAlert, Expense, Income } from '@/lib/types';

export interface AlertGenerationOptions {
  budgetThreshold?: number; // Porcentaje de sobrecosto para generar alerta (default: 10%)
  deadlineWarningDays?: number; // Días antes de la fecha límite para alertar (default: 7)
  checkPaymentOverdue?: boolean; // Verificar pagos vencidos (default: true)
}

export class AlertService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Genera alertas automáticas basadas en datos reales de proyectos
   */
  async generateProjectAlerts(options: AlertGenerationOptions = {}): Promise<SystemAlert[]> {
    const {
      budgetThreshold = 10,
      deadlineWarningDays = 7,
      checkPaymentOverdue = true
    } = options;

    const alerts: SystemAlert[] = [];

    try {
      // Obtener todos los proyectos activos
      const { data: projects, error: projectsError } = await this.supabase
        .from('projects')
        .select(`
          *,
          client:clients(*)
        `)
        .in('status', ['active', 'en_progreso', 'planning']);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        return alerts;
      }

      if (!projects || projects.length === 0) {
        return alerts;
      }

      // Obtener gastos de todos los proyectos
      const { data: expenses, error: expensesError } = await this.supabase
        .from('expenses')
        .select('*')
        .in('project_id', projects.map(p => p.id));

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
      }

      // Obtener ingresos de todos los proyectos
      const { data: incomes, error: incomesError } = await this.supabase
        .from('incomes')
        .select('*')
        .in('project_id', projects.map(p => p.id));

      if (incomesError) {
        console.error('Error fetching incomes:', incomesError);
      }

      // Generar alertas para cada proyecto
      for (const project of projects) {
        // 1. Verificar sobrecostos
        const budgetAlerts = await this.checkBudgetOverrun(
          project,
          expenses?.filter(e => e.project_id === project.id) || [],
          budgetThreshold
        );
        alerts.push(...budgetAlerts);

        // 2. Verificar fechas límite próximas
        const deadlineAlerts = await this.checkDeadlineApproaching(
          project,
          deadlineWarningDays
        );
        alerts.push(...deadlineAlerts);

        // 3. Verificar pagos vencidos (si está habilitado)
        if (checkPaymentOverdue) {
          const paymentAlerts = await this.checkPaymentOverdue(
            project,
            incomes?.filter(i => i.project_id === project.id) || []
          );
          alerts.push(...paymentAlerts);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error generating project alerts:', error);
      return alerts;
    }
  }

  /**
   * Verifica sobrecostos en un proyecto
   */
  private async checkBudgetOverrun(
    project: Project,
    expenses: Expense[],
    threshold: number
  ): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    try {
      const totalExpenses = expenses.reduce((sum, expense) => {
        return sum + (expense.amount || 0);
      }, 0);

      const budget = project.budget || 0;
      
      if (budget > 0 && totalExpenses > 0) {
        const overrunPercentage = ((totalExpenses - budget) / budget) * 100;
        
        if (overrunPercentage > threshold) {
          const alert: SystemAlert = {
            id: `budget_overrun_${project.id}_${Date.now()}`,
            type: 'budget_overrun',
            alert_type: 'budget_overrun',
            severity: overrunPercentage > 20 ? 'high' : 'medium',
            title: `Sobrecosto en ${project.name}`,
            message: `El proyecto ha excedido el ${overrunPercentage.toFixed(1)}% del presupuesto planificado. Revisión requerida.`,
            project_id: project.id,
            user_id: project.created_by || '',
            is_read: false,
            is_resolved: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: JSON.stringify({
              budget_planned: budget,
              budget_actual: totalExpenses,
              percentage_over: overrunPercentage,
              threshold_used: threshold
            })
          };
          alerts.push(alert);
        }
      }
    } catch (error) {
      console.error('Error checking budget overrun:', error);
    }

    return alerts;
  }

  /**
   * Verifica fechas límite próximas
   */
  private async checkDeadlineApproaching(
    project: Project,
    warningDays: number
  ): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    try {
      if (!project.estimated_end_date && !project.actual_end_date) {
        return alerts;
      }

      const endDate = new Date(project.actual_end_date || project.estimated_end_date!);
      const today = new Date();
      const timeDiff = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysRemaining <= warningDays && daysRemaining > 0) {
        const severity: SystemAlert['severity'] = 
          daysRemaining <= 3 ? 'high' : 
          daysRemaining <= 7 ? 'medium' : 'low';

        const alert: SystemAlert = {
          id: `deadline_approaching_${project.id}_${Date.now()}`,
          type: 'deadline_approaching',
          alert_type: 'deadline_approaching',
          severity,
          title: `Fecha límite próxima - ${project.name}`,
          message: `El proyecto tiene fecha de entrega en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}. Verificar estado de avance.`,
          project_id: project.id,
          user_id: project.created_by || '',
          is_read: false,
          is_resolved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: JSON.stringify({
            deadline: endDate.toISOString(),
            days_remaining: daysRemaining,
            warning_threshold: warningDays
          })
        };
        alerts.push(alert);
      } else if (daysRemaining < 0) {
        // Proyecto vencido
        const alert: SystemAlert = {
          id: `deadline_overdue_${project.id}_${Date.now()}`,
          type: 'deadline_approaching',
          alert_type: 'deadline_approaching',
          severity: 'high',
          title: `Proyecto vencido - ${project.name}`,
          message: `El proyecto está vencido hace ${Math.abs(daysRemaining)} día${Math.abs(daysRemaining) !== 1 ? 's' : ''}. Acción inmediata requerida.`,
          project_id: project.id,
          user_id: project.created_by || '',
          is_read: false,
          is_resolved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: JSON.stringify({
            deadline: endDate.toISOString(),
            days_overdue: Math.abs(daysRemaining)
          })
        };
        alerts.push(alert);
      }
    } catch (error) {
      console.error('Error checking deadline approaching:', error);
    }

    return alerts;
  }

  /**
   * Verifica pagos vencidos
   */
  private async checkPaymentOverdue(
    project: Project,
    incomes: Income[]
  ): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    try {
      const today = new Date();
      
      // Buscar ingresos pendientes (no hay fechas de vencimiento en el tipo Income actual)
      const overdueIncomes = incomes.filter(income => {
        // Solo considerar ingresos pendientes como "vencidos" si han pasado más de 30 días
        const incomeDate = new Date(income.income_date);
        const daysSinceIncome = Math.ceil((today.getTime() - incomeDate.getTime()) / (1000 * 3600 * 24));
        return income.status === 'pending' && daysSinceIncome > 30;
      });

      for (const income of overdueIncomes) {
        const incomeDate = new Date(income.income_date);
        const timeDiff = today.getTime() - incomeDate.getTime();
        const daysOverdue = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const severity: SystemAlert['severity'] = 
          daysOverdue > 30 ? 'high' : 
          daysOverdue > 7 ? 'medium' : 'low';

        const alert: SystemAlert = {
          id: `payment_overdue_${income.id}_${Date.now()}`,
          type: 'payment_overdue',
          alert_type: 'payment_overdue',
          severity,
          title: `Pago vencido - ${project.name}`,
          message: `Pago vencido hace ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''}. Gestionar cobro inmediato.`,
          project_id: project.id,
          user_id: project.created_by || '',
          is_read: false,
          is_resolved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: JSON.stringify({
            income_id: income.id,
            amount: income.amount,
            income_date: incomeDate.toISOString(),
            days_overdue: daysOverdue,
            description: income.description
          })
        };
        alerts.push(alert);
      }
    } catch (error) {
      console.error('Error checking payment overdue:', error);
    }

    return alerts;
  }

  /**
   * Obtiene alertas existentes de la base de datos
   */
  async getExistingAlerts(): Promise<SystemAlert[]> {
    try {
      const { data, error } = await this.supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching existing alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getExistingAlerts:', error);
      return [];
    }
  }

  /**
   * Marca una alerta como leída
   */
  async markAsRead(alertId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('alerts')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  }

  /**
   * Resuelve una alerta
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('alerts')
        .update({ 
          is_resolved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Elimina una alerta
   */
  async deleteAlert(alertId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const alertService = new AlertService();