import { createClient as createBrowserClient } from './client';
import type {
  Project,
  ProjectBudget,
  BudgetItem,
  ScopeChange,
  ProjectEquipment,
  ProjectPayment,
  ProjectProgress,
  UserProfile,
  Client,
  Supplier,
  Equipment,
  SystemAlert,
  ProjectKPIs,
  CreateProjectDTO,
  UpdateProjectDTO,
  CreateScopeChangeDTO,
  CreateInvoiceDTO,
  ProjectFilters,
  PaginationParams,
  PaginatedResponse,
  DashboardMetrics,
  ProjectFinancialSummary
} from '../types';

// Funciones para gestión de proyectos
export class ProjectService {
  private supabase;

  constructor(isServer = true) {
    this.supabase = createBrowserClient();
  }

  // Obtener todos los proyectos con filtros y paginación
  async getProjects(
    filters?: ProjectFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Project>> {
    let query = this.supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        created_by_user:user_profiles!projects_created_by_fkey(*)
      `);

    // Aplicar filtros
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.date_range) {
      query = query
        .gte('start_date', filters.date_range.start)
        .lte('start_date', filters.date_range.end);
    }
    if (filters?.budget_range) {
      query = query
        .gte('budget', filters.budget_range.min)
        .lte('budget', filters.budget_range.max);
    }

    // Aplicar paginación y ordenamiento
    if (pagination) {
      const { page, limit, sort_by = 'created_at', sort_order = 'desc' } = pagination;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
      total_pages: Math.ceil((count || 0) / (pagination?.limit || 10))
    };
  }

  // Obtener todos los proyectos sin paginación
  async getAllProjects(): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        created_by_user:user_profiles!projects_created_by_fkey(*)
      `);

    if (error) throw error;
    return data || [];
  }

  // Obtener un proyecto por ID
  async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        created_by_user:user_profiles!projects_created_by_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Obtener todos los clientes
  async getClients(): Promise<Client[]> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('company_name');

    if (error) throw error;
    return data || [];
  }

  // Obtener usuarios que pueden ser managers (gerencia y administrativo)
  async getManagers(): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .in('role', ['management', 'administrative'])
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    return data || [];
  }

  // Crear un nuevo proyecto
  async createProject(projectData: CreateProjectDTO): Promise<Project> {
    // Obtener el usuario actual
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');
    
    // Iniciar transacción
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .insert({
        ...projectData,
        budget: projectData.budget,
        created_by: user.id
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Nota: El desglose presupuestario se maneja a través de los campos individuales del proyecto

    return project;
  }

  // Actualizar un proyecto
  async updateProject(id: string, updates: UpdateProjectDTO): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar un proyecto
  async deleteProject(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Obtener resumen financiero de un proyecto
  async getProjectFinancialSummary(projectId: string): Promise<ProjectFinancialSummary> {
    const supabase = await this.supabase;
    
    // Obtener proyecto
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    // Obtener presupuesto desglosado
    const { data: budgetBreakdown, error: budgetError } = await supabase
      .from('project_budgets')
      .select('*')
      .eq('project_id', projectId);
    if (budgetError) throw budgetError;

    // Obtener gastos totales
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('project_id', projectId);
    if (expensesError) throw expensesError;

    // Obtener pagos totales
    const { data: payments, error: paymentsError } = await supabase
      .from('project_payments')
      .select('amount')
      .eq('project_id', projectId);
    if (paymentsError) throw paymentsError;

    // Obtener último progreso
    const { data: latestProgress, error: progressError } = await supabase
      .from('project_progress')
      .select('*')
      .eq('project_id', projectId)
      .order('month_year', { ascending: false })
      .limit(1)
      .single();
    if (progressError && progressError.code !== 'PGRST116') throw progressError;

    // Obtener cambios pendientes
    const { data: pendingChanges, error: changesError } = await supabase
      .from('scope_changes')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'pendiente');
    if (changesError) throw changesError;

    // Obtener equipos activos
    const { data: activeEquipment, error: equipmentError } = await supabase
      .from('project_equipment')
      .select(`
        *,
        equipment:equipment(*)
      `)
      .eq('project_id', projectId)
      .eq('is_active', true);
    if (equipmentError) throw equipmentError;

    const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const totalPayments = payments?.reduce((sum, pay) => sum + pay.amount, 0) || 0;
    const remainingBudget = project.budget - totalExpenses;
    const profitMargin = totalPayments > 0 ? ((totalPayments - totalExpenses) / totalPayments) * 100 : 0;

    return {
      project,
      budget_breakdown: budgetBreakdown || [],
      total_budget: project.budget,
      total_expenses: totalExpenses,
      total_payments: totalPayments,
      remaining_budget: remainingBudget,
      profit_margin: profitMargin,
      latest_progress: latestProgress || {} as ProjectProgress,
      pending_changes: pendingChanges || [],
      active_equipment: activeEquipment || []
    };
  }

  // Obtener partidas presupuestarias de un proyecto
  async getBudgetItems(projectId: string): Promise<BudgetItem[]> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('project_budgets')
      .select('*')
      .eq('project_id', projectId)
      .order('category');

    if (error) throw error;
    return data || [];
  }

  // Crear una nueva partida presupuestaria
  async createBudgetItem(projectId: string, budgetData: Omit<BudgetItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<BudgetItem> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('project_budgets')
      .insert({
        ...budgetData,
        project_id: projectId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar una partida presupuestaria
  async updateBudgetItem(itemId: string, updates: Partial<Omit<BudgetItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<BudgetItem> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('project_budgets')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar una partida presupuestaria
  async deleteBudgetItem(itemId: string): Promise<void> {
    const supabase = await this.supabase;
    const { error } = await supabase
      .from('project_budgets')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }
}



// Funciones para gestión de cambios de alcance
export class ScopeChangeService {
  private supabase;

  constructor(isServer = true) {
    this.supabase = createBrowserClient();
  }

  async createScopeChange(changeData: CreateScopeChangeDTO, userId: string): Promise<ScopeChange> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('scope_changes')
      .insert({
        ...changeData,
        requested_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async approveScopeChange(id: string, userId: string): Promise<ScopeChange> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('scope_changes')
      .update({
        status: 'aprobado',
        approved_by: userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProjectScopeChanges(projectId: string): Promise<ScopeChange[]> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('scope_changes')
      .select(`
        *,
        requested_by_user:user_profiles!scope_changes_requested_by_fkey(*),
        approved_by_user:user_profiles!scope_changes_approved_by_fkey(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Funciones para KPIs y análisis
export class AlertService {
  private supabase;

  constructor(isServer = true) {
    this.supabase = createBrowserClient();
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const supabase = await this.supabase;
    
    // Obtener métricas básicas
    const { data: projectStats, error: projectError } = await supabase
      .from('projects')
      .select('status, budget')
      .neq('status', 'cancelado');
    if (projectError) throw projectError;

    // Obtener gastos del mes actual
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: monthlyExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-32`);
    if (expensesError) throw expensesError;

    // Obtener ingresos del mes actual
    const { data: monthlyRevenue, error: revenueError } = await supabase
      .from('project_payments')
      .select('amount')
      .gte('payment_date', `${currentMonth}-01`)
      .lt('payment_date', `${currentMonth}-32`);
    if (revenueError) throw revenueError;

    const totalProjects = projectStats?.length || 0;
    const activeProjects = projectStats?.filter(p => p.status === 'en_progreso').length || 0;
    const totalBudget = projectStats?.reduce((sum, p) => sum + p.budget, 0) || 0;
    const monthlyExpensesTotal = monthlyExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const monthlyRevenueTotal = monthlyRevenue?.reduce((sum, r) => sum + r.amount, 0) || 0;
    const profitMargin = monthlyRevenueTotal > 0 ? 
      ((monthlyRevenueTotal - monthlyExpensesTotal) / monthlyRevenueTotal) * 100 : 0;

    return {
      total_projects: totalProjects,
      active_projects: activeProjects,
      total_budget: totalBudget,
      total_expenses: monthlyExpensesTotal,
      average_budget_utilization: 0, // Calcular después
      projects_over_budget: 0, // Calcular después
      projects_behind_schedule: 0, // Calcular después
      monthly_revenue: monthlyRevenueTotal,
      monthly_expenses: monthlyExpensesTotal,
      profit_margin: profitMargin
    };
  }

  async getProjectKPIs(projectId?: string): Promise<ProjectKPIs[]> {
    let query = this.supabase.from('project_kpis').select('*');
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async refreshProjectKPIs(): Promise<void> {
    const supabase = await this.supabase;
    const { error } = await supabase.rpc('refresh_project_kpis');
    if (error) throw error;
  }

  // Obtener partidas presupuestarias de un proyecto
  async getBudgetItems(projectId: string): Promise<BudgetItem[]> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('project_budgets')
      .select('*')
      .eq('project_id', projectId)
      .order('category');

    if (error) throw error;
    return data || [];
  }

  // Crear una nueva partida presupuestaria
  async createBudgetItem(projectId: string, budgetData: Omit<BudgetItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<BudgetItem> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('project_budgets')
      .insert({
        ...budgetData,
        project_id: projectId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar una partida presupuestaria
  async updateBudgetItem(itemId: string, updates: Partial<Omit<BudgetItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<BudgetItem> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('project_budgets')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar una partida presupuestaria
  async deleteBudgetItem(itemId: string): Promise<void> {
    const supabase = await this.supabase;
    const { error } = await supabase
      .from('project_budgets')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }
}

// Funciones para gestión de usuarios y perfiles
export class UserService {
  private supabase;

  constructor(isServer = true) {
    this.supabase = createBrowserClient();
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Usar limit(1) para evitar el error de múltiples registros
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile, denying access:', error.message);
        return null;
      }

      if (!data) {
        // No se encontró el perfil, intentar crearlo automáticamente
        console.log('Profile not found for user:', userId, 'attempting to create...');
        return await this.createUserProfileIfNotExists(userId);
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in getUserProfile:', error);
      return null;
    }
  }

  private async createUserProfileIfNotExists(userId: string): Promise<UserProfile | null> {
    try {
      // Obtener información del usuario de auth
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError || !user || user.id !== userId) {
        console.warn('Cannot create profile: user not authenticated or ID mismatch');
        return null;
      }

      // Crear perfil básico
      const newProfile = {
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
        role: 'gerencia' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error.message);
        return null;
      }

      console.log('Successfully created user profile for:', userId);
      return data;
    } catch (error) {
      console.error('Unexpected error creating user profile:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    return data || [];
  }
}

// Funciones para gestión de alertas
export class EquipmentService {
  private supabase;

  constructor(isServer = true) {
    this.supabase = createBrowserClient();
  }

  async getUserAlerts(userId: string): Promise<SystemAlert[]> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('system_alerts')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('assigned_to', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    const supabase = await this.supabase;
    const { error } = await supabase
      .from('system_alerts')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  async createAlert(
    alertType: string,
    title: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    projectId?: string,
    assignedTo?: string
  ): Promise<SystemAlert> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('system_alerts')
      .insert({
        alert_type: alertType,
        title,
        message,
        severity,
        project_id: projectId,
        assigned_to: assignedTo
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Budget Items Management
  async getBudgetItems(projectId: string): Promise<BudgetItem[]> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .eq('project_id', projectId)
      .order('category', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createBudgetItem(projectId: string, budgetItem: Omit<BudgetItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<BudgetItem> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('budget_items')
      .insert({
        project_id: projectId,
        ...budgetItem
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateBudgetItem(itemId: string, updates: Partial<Omit<BudgetItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<BudgetItem> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('budget_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBudgetItem(itemId: string): Promise<void> {
    const supabase = await this.supabase;
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  // Supplier methods
  async getSuppliers(): Promise<Supplier[]> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Equipment methods
  async getAllEquipment(): Promise<Equipment[]> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        project:projects(*)
      `)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getProjectEquipment(projectId: string): Promise<Equipment[]> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('project_id', projectId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async createEquipment(equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>): Promise<Equipment> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('equipment')
      .insert(equipment)
      .select(`
        *,
        project:projects(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateEquipment(equipmentId: string, updates: Partial<Omit<Equipment, 'id' | 'created_at' | 'updated_at'>>): Promise<Equipment> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('equipment')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', equipmentId)
      .select(`
        *,
        project:projects(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateEquipmentStatus(equipmentId: string, status: string): Promise<Equipment> {
    const supabase = await this.supabase;
    const { data, error } = await supabase
      .from('equipment')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', equipmentId)
      .select(`
        *,
        project:projects(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteEquipment(equipmentId: string): Promise<void> {
    const supabase = await this.supabase;
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', equipmentId);

    if (error) throw error;
  }
}

// Instancias exportadas para compatibilidad
export const projectService = new ProjectService();
export const userService = new UserService();
export const equipmentService = new EquipmentService();