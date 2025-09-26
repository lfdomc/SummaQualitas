import { createClient as createBrowserClient, createAdminClient } from './client';
import { createServerClient } from '@supabase/ssr';
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
  ProjectFinancialSummary,
  Income,
  CreateIncomeData,
  UpdateIncomeData,
  ProjectIncomesSummary,
  IncomeFilters,
  MonthlyIncomeReport,
  Expense,
  CreateExpenseData,
  UpdateExpenseData
} from '../types';

// Funciones para gestión de proyectos
export class ProjectService {
  private supabase;

  constructor(isServer = false) {
    this.supabase = isServer ? createAdminClient() : createBrowserClient();
  }

  // Obtener todos los proyectos con filtros y paginación
  async getProjects(
    filters?: ProjectFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Project>> {
    try {
      // Usar una consulta optimizada que incluye gastos calculados
      let query = this.supabase
        .from('projects')
        .select(`
          *,
          client:clients(*),
          total_expenses:expenses(amount, currency)
        `, { count: 'exact' });
        
      // Ordenar por fecha de creación (más recientes primero)
      query = query.order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters?.managerId) {
      query = query.eq('manager_id', filters.managerId);
    }
    if (filters?.startDate) {
      query = query.gte('start_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('end_date', filters.endDate);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    // Aplicar paginación
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Obtener datos con conteo en una sola consulta
    const { data: projects, error, count } = await query;

    if (error) throw error;

    // Procesar proyectos para calcular gastos totales
    const processedProjects = (projects || []).map(project => {
      let totalExpenses = 0;
      
      if (project.total_expenses && Array.isArray(project.total_expenses)) {
        totalExpenses = project.total_expenses.reduce((sum: number, expense: any) => {
          let amountInCRC = expense.amount || 0;
          // Convertir USD a CRC si es necesario
          if (expense.currency === 'USD') {
            amountInCRC = amountInCRC * 500; // Tasa de cambio aproximada
          }
          return sum + amountInCRC;
        }, 0);
      }
      
      return {
        ...project,
        actualExpenses: totalExpenses
      };
    });

      return {
        data: processedProjects,
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        page: pagination?.page || 1,
        limit: pagination?.limit || 10,
        total_pages: 0
      };
    }
  }

  // Obtener todos los proyectos sin paginación
  async getAllProjects(): Promise<Project[]> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          client:clients(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Obtener un proyecto por ID
  async getProjectById(id: string): Promise<Project | null> {
    try {
      
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        
        // Si el proyecto no existe, retornar null en lugar de lanzar error
        if (error.code === 'PGRST116') {
          return null;
        }
        
        throw new Error(`Error al obtener proyecto: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los clientes
  async getClients(): Promise<Client[]> {
    try {
      
      const { data, error } = await this.supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(`Error al obtener clientes: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  // Crear un nuevo cliente
  async createClient(clientData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }): Promise<Client> {
    // Obtener el usuario actual
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('clients')
      .insert({
        ...clientData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtener usuarios que pueden ser managers (gerencia y administrativo)
  async getManagers(): Promise<UserProfile[]> {
    try {
      
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(`Error al obtener managers: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  // Crear un nuevo proyecto
  async createProject(projectData: CreateProjectDTO): Promise<Project> {
    // Obtener el usuario actual
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');
    
    // Calcular el presupuesto total basado en el desglose
    const totalBudget = (
      (projectData.costos_directos || 0) +
      (projectData.costos_indirectos || 0) +
      (projectData.administracion || 0) +
      (projectData.mano_obra || 0) +
      (projectData.imprevistos || 0) +
      (projectData.utilidad || 0)
    );

    // Determinar el presupuesto a usar (calculado, presupuesto_inicial o budget)
    const budgetValue = totalBudget > 0 ? totalBudget : (projectData.presupuesto_inicial || projectData.budget || 0);

    // Preparar datos del proyecto con presupuesto calculado y campos normalizados
    const projectToInsert = {
      ...projectData,
      created_by: user.id,
      budget: budgetValue,
      presupuesto_original: projectData.presupuesto_original || budgetValue,
      presupuesto_final: projectData.presupuesto_final || budgetValue
    };
    
    // Iniciar transacción
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .insert(projectToInsert)
      .select()
      .single();

    if (projectError) throw projectError;

    // Nota: El desglose presupuestario se maneja a través de los campos individuales del proyecto

    return project;
  }

  // Actualizar un proyecto
  async updateProject(id: string, updates: UpdateProjectDTO): Promise<Project> {
    console.log('🔄 ProjectService.updateProject called with:', { id, updates });
    
    // Calcular el presupuesto total si se están actualizando campos del desglose
    const hasbudgetFields = [
      'costos_directos',
      'costos_indirectos',
      'administracion',
      'mano_obra',
      'imprevistos',
      'utilidad'
    ].some(field => field in updates);

    console.log('📊 Has budget fields:', hasbudgetFields);

    let updatesToApply = { ...updates };

    if (hasbudgetFields) {
      // Obtener el proyecto actual para tener todos los valores
      const { data: currentProject, error: fetchError } = await this.supabase
        .from('projects')
        .select(`
          id,
          costos_directos,
          costos_indirectos,
          administracion,
          mano_obra,
          imprevistos,
          utilidad,
          presupuesto_inicial
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Combinar valores actuales con las actualizaciones
      const combinedData = { ...currentProject, ...updates };

      // Calcular el nuevo presupuesto total
      const totalBudget = (
        (combinedData.costos_directos || 0) +
        (combinedData.costos_indirectos || 0) +
        (combinedData.administracion || 0) +
        (combinedData.mano_obra || 0) +
        (combinedData.imprevistos || 0) +
        (combinedData.utilidad || 0)
      );

      // Actualizar el presupuesto si hay un total calculado
      if (totalBudget > 0) {
        updatesToApply.presupuesto_inicial = totalBudget;
      }
    }

    console.log('💾 Applying updates to database:', updatesToApply);

    const { data, error } = await this.supabase
      .from('projects')
      .update(updatesToApply)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Database update error:', error);
      throw error;
    }

    console.log('✅ Project updated successfully:', data);
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

  // Obtener partidas presupuestarias de un proyecto basadas en los campos de costos
  async getBudgetItems(projectId: string): Promise<BudgetItem[]> {
    try {
      const { data: project, error } = await this.supabase
        .from('projects')
        .select(`
          id,
          costos_directos,
          costos_indirectos,
          administracion,
          mano_obra,
          imprevistos,
          utilidad
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (!project) return [];

      // Convertir los campos de costos del proyecto en BudgetItems
      const budgetItems: BudgetItem[] = [
        {
          id: `${projectId}-costos-directos`,
          project_id: projectId,
          category: 'costos_directos',
          description: 'Costos Directos',
          estimated_cost: project.costos_directos || 0,
          actual_cost: project.costos_directos || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `${projectId}-costos-indirectos`,
          project_id: projectId,
          category: 'costos_indirectos',
          description: 'Costos Indirectos',
          estimated_cost: project.costos_indirectos || 0,
          actual_cost: project.costos_indirectos || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `${projectId}-administracion`,
          project_id: projectId,
          category: 'administracion',
          description: 'Administración',
          estimated_cost: project.administracion || 0,
          actual_cost: project.administracion || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `${projectId}-mano-obra`,
          project_id: projectId,
          category: 'mano_obra',
          description: 'Mano de Obra',
          estimated_cost: project.mano_obra || 0,
          actual_cost: project.mano_obra || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `${projectId}-imprevistos`,
          project_id: projectId,
          category: 'imprevistos',
          description: 'Imprevistos',
          estimated_cost: project.imprevistos || 0,
          actual_cost: project.imprevistos || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `${projectId}-utilidad`,
          project_id: projectId,
          category: 'utilidad',
          description: 'Utilidad',
          estimated_cost: project.utilidad || 0,
          actual_cost: project.utilidad || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ].filter(item => item.estimated_cost > 0); // Solo incluir items con costo > 0

      return budgetItems;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar costos del proyecto (reemplaza createBudgetItem y updateBudgetItem)
  async updateProjectCosts(projectId: string, costs: {
    costos_directos?: number;
    costos_indirectos?: number;
    administracion?: number;
    mano_obra?: number;
    imprevistos?: number;
    utilidad?: number;
  }): Promise<Project> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .update(costs)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Método legacy para compatibilidad - ahora actualiza los campos del proyecto
  async createBudgetItem(projectId: string, budgetData: Omit<BudgetItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<BudgetItem> {
    // Mapear la categoría del BudgetItem al campo correspondiente del proyecto
    const costField = budgetData.category as keyof typeof costMapping;
    const costMapping = {
      'costos_directos': 'costos_directos',
      'costos_indirectos': 'costos_indirectos',
      'administracion': 'administracion',
      'mano_obra': 'mano_obra',
      'imprevistos': 'imprevistos',
      'utilidad': 'utilidad'
    };

    if (costMapping[costField]) {
      await this.updateProjectCosts(projectId, {
        [costMapping[costField]]: budgetData.estimated_cost
      });
    }

    // Retornar el BudgetItem creado virtualmente
    return {
      id: `${projectId}-${budgetData.category}`,
      project_id: projectId,
      category: budgetData.category,
      description: budgetData.description,
      estimated_cost: budgetData.estimated_cost,
      actual_cost: budgetData.estimated_cost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Método legacy para compatibilidad - ahora actualiza los campos del proyecto
  async updateBudgetItem(itemId: string, updates: Partial<Omit<BudgetItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<BudgetItem> {
    // Extraer projectId del itemId (formato: projectId-category)
    const projectId = itemId.split('-').slice(0, -2).join('-');
    const category = itemId.split('-').slice(-2).join('_');

    const costMapping = {
      'costos_directos': 'costos_directos',
      'costos_indirectos': 'costos_indirectos',
      'administracion': 'administracion',
      'mano_obra': 'mano_obra',
      'imprevistos': 'imprevistos',
      'utilidad': 'utilidad'
    };

    if (updates.estimated_cost !== undefined && costMapping[category as keyof typeof costMapping]) {
      await this.updateProjectCosts(projectId, {
        [costMapping[category as keyof typeof costMapping]]: updates.estimated_cost
      });
    }

    // Retornar el BudgetItem actualizado virtualmente
    return {
      id: itemId,
      project_id: projectId,
      category: category,
      description: updates.description || '',
      estimated_cost: updates.estimated_cost || 0,
      actual_cost: updates.estimated_cost || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Método legacy para compatibilidad - ahora resetea el campo correspondiente del proyecto
  async deleteBudgetItem(itemId: string): Promise<void> {
    // Extraer projectId del itemId (formato: projectId-category)
    const projectId = itemId.split('-').slice(0, -2).join('-');
    const category = itemId.split('-').slice(-2).join('_');

    const costMapping = {
      'costos_directos': 'costos_directos',
      'costos_indirectos': 'costos_indirectos',
      'administracion': 'administracion',
      'mano_obra': 'mano_obra',
      'imprevistos': 'imprevistos',
      'utilidad': 'utilidad'
    };

    if (costMapping[category as keyof typeof costMapping]) {
      await this.updateProjectCosts(projectId, {
        [costMapping[category as keyof typeof costMapping]]: 0
      });
    }
  }

  async getProjectFinancialSummary(projectId: string): Promise<ProjectFinancialSummary | null> {
    try {
      
      // Obtener datos del proyecto
      const { data: projectData, error: projectError } = await this.supabase
        .from('projects')
        .select(`
          id,
          name,
          budget
        `)
        .eq('id', projectId)
        .single();

      if (projectError) {
        // Si el proyecto no existe, retornar null en lugar de lanzar error
        if (projectError.code === 'PGRST116') {
          return null;
        }
        
        throw new Error(`Error al obtener proyecto: ${projectError.message}`);
      }

      // Obtener gastos del proyecto
        const expenseService = new ExpenseService(false);
        const expenses = await expenseService.getProjectExpenses(projectId);
      
      // Calcular totales por categoría
      const expensesByCategory = expenses.reduce((acc: Record<string, number>, expense) => {
        const category = expense.category || 'Sin categoría';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {});
      
      // Calcular total de gastos
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Crear resumen financiero completo
      const financialSummary = {
        ...projectData,
        expenses: {
          total: totalExpenses,
          byCategory: expensesByCategory,
          items: expenses
        },
        remainingBudget: projectData.budget - totalExpenses,
        budgetUtilization: projectData.budget > 0 ? (totalExpenses / projectData.budget) * 100 : 0
      };

      return financialSummary;
    } catch (error) {
      throw error;
    }
  }
}

export class UserService {
  private supabase;

  constructor(isServer = true) {
    if (isServer && typeof window === 'undefined') {
      // Server-side: usar createServerClient
      this.supabase = createServerClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
         {
           cookies: {
             getAll() { return []; },
             setAll() { /* no-op */ }
           }
         }
       );
    } else {
      // Client-side: usar createBrowserClient
      this.supabase = createBrowserClient();
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Usar limit(1) para evitar el error de múltiples registros
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error.message);
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

      // Crear perfil básico con rol administrativo por defecto
      const newProfile = {
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
        role: 'administrativo' as const,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('users')
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
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }
}

// Funciones para gestión de cambios de alcance
export class ScopeChangeService {
  private supabase;

  constructor(isServer = true) {
    this.supabase = createBrowserClient();
  }

  async createScopeChange(changeData: CreateScopeChangeDTO, userId: string): Promise<ScopeChange> {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('scope_changes')
      .select(`
        *,
        requested_by_user:users!scope_changes_requested_by_fkey(*),
        approved_by_user:users!scope_changes_approved_by_fkey(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}



// Funciones para gestión de equipos
export class EquipmentService {
  private supabase;

  constructor(isServer = true) {
    this.supabase = createBrowserClient();
  }

  async getAllEquipment(): Promise<Equipment[]> {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('equipment')
      .insert(equipment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateEquipment(equipmentId: string, updates: Partial<Omit<Equipment, 'id' | 'created_at' | 'updated_at'>>): Promise<Equipment> {
    const { data, error } = await this.supabase
      .from('equipment')
      .update(updates)
      .eq('id', equipmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async deleteEquipment(equipmentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('equipment')
      .delete()
      .eq('id', equipmentId);

    if (error) throw error;
  }

  async updateEquipmentStatus(equipmentId: string, status: string): Promise<Equipment> {
    const { data, error } = await this.supabase
      .from('equipment')
      .update({ status })
      .eq('id', equipmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }


}

// Supplier methods
export class SupplierService {
  private supabase;

  constructor(isServer = true) {
    this.supabase = createBrowserClient();
  }

  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSupplier(id: string, updates: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>): Promise<Supplier> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSupplier(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }


}

export class IncomeService {
  private supabase;

  constructor(isServer = false) {
    this.supabase = isServer ? createAdminClient() : createBrowserClient();
  }

  async getIncomes(filters?: IncomeFilters): Promise<(Income & { project?: Project; client?: Client })[]> {
    let query = this.supabase
      .from('incomes')
      .select(`
        *,
        project:projects(id, name, status, client_id),
        client:clients(id, name, email)
      `)
      .order('received_date', { ascending: false });

    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.date_from) {
      query = query.gte('received_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('received_date', filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getIncomeById(id: string): Promise<Income | null> {
    const { data, error } = await this.supabase
      .from('incomes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async getProjectIncomes(projectId: string): Promise<Income[]> {
    const { data, error } = await this.supabase
      .from('incomes')
      .select('*')
      .eq('project_id', projectId)
      .order('received_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getProjectIncomesSummary(projectId: string): Promise<ProjectIncomesSummary> {
    const { data, error } = await this.supabase
      .from('project_incomes_summary')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          project_id: projectId,
          project_name: '',
          project_status: '',
          total_incomes: 0,
          total_amount: 0,
          confirmed_amount: 0,
          total_confirmed_amount: 0,
          total_pending_amount: 0,
          total_confirmed_usd: 0,
          total_confirmed_crc: 0
        };
      }
      throw error;
    }
    return data;
  }

  async createIncome(incomeData: CreateIncomeData): Promise<Income> {
    const { data, error } = await this.supabase
      .from('incomes')
      .insert({
        ...incomeData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async updateIncome(id: string, updates: UpdateIncomeData): Promise<Income> {
    const { data, error } = await this.supabase
      .from('incomes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteIncome(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('incomes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getIncomesByClient(clientId: string): Promise<Income[]> {
    const { data, error } = await this.supabase
      .from('incomes')
      .select('*')
      .eq('client_id', clientId)
      .order('received_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMonthlyIncomeReport(year: number, month: number): Promise<MonthlyIncomeReport[]> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('incomes')
      .select('*')
      .gte('received_date', startDate)
      .lte('received_date', endDate)
      .order('received_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Funciones para gestión de gastos
export class ExpenseService {
  private supabase;

  constructor(isServer = false) {
    this.supabase = isServer ? createAdminClient() : createBrowserClient();
  }

  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from('expenses')
      .select(`
        *,
        supplier:suppliers(id, name, email, phone)
      `)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    const { data, error } = await this.supabase
      .from('expenses')
      .select(`
        *,
        supplier:suppliers(id, name, email, phone)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getProjectExpenses(projectId: string): Promise<Expense[]> {
    // Obtener gastos incluyendo la información del proveedor
    const { data, error } = await this.supabase
      .from('expenses')
      .select(`
        *,
        supplier:suppliers(id, name, email, phone)
      `)
      .eq('project_id', projectId)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    
    // Usar un tipo de cambio por defecto hasta que se agregue la columna
    const exchangeRate = 520;
    
    // Convertir gastos en USD a CRC y limpiar la referencia del proyecto
    const expensesInCRC = (data || []).map(expense => {
      const cleanExpense = { ...expense };
      delete cleanExpense.project; // Remover la referencia del proyecto para mantener la estructura original
      
      if (expense.currency === 'USD') {
        const exchangeRateToUse = expense.exchange_rate || exchangeRate;
        return {
          ...cleanExpense,
          amount: expense.amount * exchangeRateToUse, // Convertir USD a CRC
          original_amount: expense.amount, // Guardar el monto original
          original_currency: expense.currency,
          currency: 'CRC' // Marcar como convertido a CRC
        };
      }
      return cleanExpense;
    });

    return expensesInCRC;
  }

  async createExpense(expenseData: CreateExpenseData): Promise<Expense> {
    const { data, error } = await this.supabase
      .from('expenses')
      .insert([expenseData])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async updateExpense(id: string, expenseData: UpdateExpenseData): Promise<Expense> {
    const { data, error } = await this.supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteExpense(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('category', category)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMonthlyExpenseReport(year: number, month: number): Promise<Expense[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTotalExpensesByProject(projectId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('amount, currency')
      .eq('project_id', projectId);

    if (error) throw error;
    
    // Calcular total convirtiendo USD a CRC
    const total = data?.reduce((sum, expense) => {
      const amount = expense.currency === 'USD' ? expense.amount * 520 : expense.amount;
      return sum + amount;
    }, 0) || 0;

    return total;
  }
}

// Exportar instancias de los servicios
export const projectService = new ProjectService();
export const userService = new UserService();
export const scopeChangeService = new ScopeChangeService();
export const equipmentService = new EquipmentService();
export const supplierService = new SupplierService();
export const incomeService = new IncomeService();
export const expenseService = new ExpenseService();