import { LucideIcon } from "lucide-react";

// Tipos para el sistema de gestión de proyectos de construcción

// Enums de la base de datos
export enum UserRole {
  GERENCIA = 'gerencia',
  ADMINISTRATIVO = 'administrativo',
  CLIENTE = 'cliente'
}

export type UserRoleType = 'gerencia' | 'administrativo' | 'cliente';
// Tipos alineados con el esquema SQL de la base de datos
export type ProjectStatus = 'planificacion' | 'en_progreso' | 'pausado' | 'completado' | 'cancelado';

export enum ProjectStatusEnum {
  PLANIFICACION = 'planificacion',
  EN_PROGRESO = 'en_progreso',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado'
}
export type ChangeType = 'material' | 'diseno' | 'cronograma' | 'presupuesto';
export type ChangeStatus = 'pendiente' | 'aprobado' | 'rechazado';
export type BudgetCategory = 'costos_directos' | 'costos_indirectos' | 'administracion' | 'mano_obra' | 'imprevistos' | 'utilidad';
export type EquipmentStatus = 'disponible' | 'en_uso' | 'mantenimiento' | 'fuera_servicio';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Interfaces principales
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  company?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  bio?: string;
  address?: string;
  department?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  manager_id?: string;
  status: ProjectStatus;
  start_date?: string;
  estimated_end_date?: string;
  actual_end_date?: string;
  location?: string;
  area?: number;
  budget: number;
  total_expenses?: number;
  actualExpenses?: number;
  progress?: number;
  // Nuevos campos para desglose por porcentajes
  exchange_rate_usd?: number;
  total_area?: number;
  // Campos de presupuesto
  presupuesto_inicial?: number;
  presupuesto_original?: number;
  presupuesto_final?: number;
  // Campos de desglose presupuestario
  costos_directos?: number;
  costos_indirectos?: number;
  mano_obra?: number;
  administracion?: number;
  imprevistos?: number;
  utilidad?: number;
  // Campos de porcentajes
  costos_directos_porcentaje?: number;
  costos_indirectos_porcentaje?: number;
  mano_obra_porcentaje?: number;
  administracion_porcentaje?: number;
  imprevistos_porcentaje?: number;
  utilidad_porcentaje?: number;
  // Fechas detalladas
  estimated_start_date?: string;
  actual_start_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  client?: Client | string;
  created_by_user?: UserProfile;
}

export interface ProjectBudget {
  id: string;
  project_id: string;
  category: BudgetCategory;
  subcategory?: string;
  description?: string;
  estimated_amount: number;
  actual_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  project_id: string;
  category: string;
  subcategory?: string;
  description: string;
  estimated_cost: number;
  actual_cost?: number;
  unit?: string;
  quantity?: number;
  unit_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScopeChange {
  id: string;
  project_id: string;
  change_type: ChangeType;
  title: string;
  description: string;
  cost_impact: number;
  schedule_impact_days: number;
  status: ChangeStatus;
  requested_by: string;
  approved_by?: string;
  client_approved: boolean;
  client_approved_at?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  requested_by_user?: UserProfile;
  approved_by_user?: UserProfile;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}



export interface Equipment {
  id: string;
  name: string;
  code: string;
  type: string;
  model?: string;
  brand?: string;
  serial_number?: string;
  description?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_location?: string;
  status: EquipmentStatus;
  project_id?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_notes?: string;
  specifications?: string;
  warranty_expiry?: string;
  supplier?: string;
  operating_hours?: number;
  fuel_type?: string;
  capacity?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  project?: Project;
}

export interface ProjectEquipment {
  id: string;
  project_id: string;
  equipment_id: string;
  start_date: string;
  end_date?: string;
  monthly_cost: number;
  total_cost?: number;
  is_active: boolean;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  project?: Project;
  equipment?: Equipment;
}

export interface ProjectPayment {
  id: string;
  project_id: string;
  amount: number;
  payment_date: string;
  description?: string;
  payment_method?: string;
  reference_number?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  project?: Project;
  created_by_user?: UserProfile;
}

export interface PaymentSchedule {
  id: string;
  project_id: string;
  milestone: string;
  expected_date: string;
  expected_amount: number;
  actual_payment_id?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  project?: Project;
  actual_payment?: ProjectPayment;
}

export interface ProjectProgress {
  id: string;
  project_id: string;
  month_year: string;
  physical_progress: number;
  financial_progress: number;
  planned_value: number; // PV en EVM
  earned_value: number;  // EV en EVM
  actual_cost: number;   // AC en EVM
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  project?: Project;
  created_by_user?: UserProfile;
}

export interface Report {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  report_type: string;
  type?: string;
  content: Record<string, any>;
  status: string;
  generated_by: string;
  approved_by?: string;
  is_approved: boolean;
  is_client_visible: boolean;
  generated_at: string;
  approved_at?: string;
  file_url?: string;
  file_size?: number;
  parameters?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  project?: Project;
  generated_by_user?: UserProfile;
  approved_by_user?: UserProfile;
}

export interface SystemAlert {
  id: string;
  project_id?: string;
  user_id?: string;
  type?: string;
  alert_type: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  is_read: boolean;
  is_resolved?: boolean;
  assigned_to?: string;
  created_at: string;
  updated_at?: string;
  read_at?: string;
  metadata?: string;
  // Relaciones
  project?: Project;
  assigned_to_user?: UserProfile;
}

export interface AlertSettings {
  id: string;
  user_id: string;
  alert_type: string;
  is_enabled: boolean;
  threshold_value?: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications?: boolean;
  budget_threshold?: number;
  deadline_warning_days?: number;
  quality_alerts?: boolean;
  payment_alerts?: boolean;
  resource_alerts?: boolean;
  daily_summary?: boolean;
  weekly_report?: boolean;
  created_at: string;
  updated_at: string;
}

// KPIs calculados
export interface ProjectKPIs {
  id?: string;
  project_id: string;
  project_name?: string;
  status?: ProjectStatus;
  budget?: number;
  total_expenses?: number;
  total_payments?: number;
  remaining_budget?: number;
  budget_utilization_percentage?: number;
  days_overdue?: number;
  latest_physical_progress?: number;
  latest_financial_progress?: number;
  // Métricas EVM calculadas
  cost_variance?: number;     // CV = EV - AC
  schedule_variance?: number; // SV = EV - PV
  cost_performance_index?: number;     // CPI = EV / AC
  schedule_performance_index?: number; // SPI = EV / PV
  estimate_at_completion?: number;     // EAC = BAC / CPI
  estimate_to_complete?: number;       // ETC = EAC - AC
  // Propiedades adicionales para KPIs
  budget_variance?: number;
  earned_value?: number;
  planned_value?: number;
  actual_cost?: number;
  budget_at_completion?: number;
  variance_at_completion?: number;
  completion_percentage?: number;
  quality_score?: number;
  safety_incidents?: number;
  productivity_index?: number;
  resource_utilization?: number;
  created_at?: string;
  updated_at?: string;
}

// Tipos para formularios y DTOs
export interface CreateProjectDTO {
  name: string;
  description?: string;
  client_id?: string;
  manager_id?: string;
  status?: ProjectStatus;
  location?: string;
  
  // Campos de área y tipo de cambio
  total_area?: number;
  exchange_rate_usd?: number;
  
  // Campos de presupuesto principal
  presupuesto_inicial?: number;
  presupuesto_original?: number;
  presupuesto_final?: number;
  budget?: number;
  
  // Campos de desglose presupuestario por montos
  costos_directos?: number;
  costos_indirectos?: number;
  mano_obra?: number;
  administracion?: number;
  imprevistos?: number;
  utilidad?: number;
  // Campos de porcentajes
  costos_directos_porcentaje?: number;
  costos_indirectos_porcentaje?: number;
  mano_obra_porcentaje?: number;
  administracion_porcentaje?: number;
  imprevistos_porcentaje?: number;
  utilidad_porcentaje?: number;
  
  // Fechas detalladas
  estimated_start_date?: string;
  estimated_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  
  // Campos legacy para compatibilidad
  start_date?: string;
  area?: number;
}

export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {
  status?: ProjectStatus;
  budget?: number;
  presupuesto_inicial?: number;
  presupuesto_original?: number;
  presupuesto_final?: number;
}

export interface CreateScopeChangeDTO {
  project_id: string;
  change_type: ChangeType;
  title: string;
  description: string;
  cost_impact: number;
  schedule_impact_days: number;
}

export interface CreateInvoiceDTO {
  project_id: string;
  supplier_id: string;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  budget_category: BudgetCategory;
  description?: string;
}

// Tipos para dashboards y análisis
export interface DashboardMetrics {
  total_projects: number;
  active_projects: number;
  completed_projects?: number;
  total_budget: number;
  total_expenses?: number;
  total_spent?: number;
  budget_variance?: number;
  average_budget_utilization?: number;
  average_completion?: number;
  average_progress?: number;
  projects_over_budget?: number;
  projects_behind_schedule?: number;
  overdue_projects?: number;
  monthly_revenue?: number;
  monthly_expenses?: number;
  total_revenue?: number;
  profit_margin: number;
  roi?: number; // Return on Investment
  cost_efficiency?: number; // Eficiencia de costos (gastos/ingresos * 100)
  profit_per_project?: number; // Ganancia promedio por proyecto
  revenue_per_project?: number; // Ingresos promedio por proyecto
  budget_utilization_rate?: number; // Tasa de utilización del presupuesto
  active_clients?: number;
  team_utilization?: number;
  quality_score?: number;
  safety_incidents?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectFinancialSummary {
  project: Project;
  budget_breakdown: ProjectBudget[];
  total_budget: number;
  total_expenses: number;
  total_payments: number;
  remaining_budget: number;
  profit_margin: number;
  latest_progress: ProjectProgress;
  pending_changes: ScopeChange[];
  active_equipment: ProjectEquipment[];
}

// Tipos heredados del sistema anterior (para compatibilidad)
export interface LegacyProject {
  id: string;
  title: string;
  description: string;
  image: string;
  gallery: string[];
  category: string;
  location: string;
  area: string;
  year: string;
  client: string;
  duration: string;
  features: string[];
}

export type Services = {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  image?: string;
};

// Tipos para filtros y búsquedas
export interface ProjectFilters {
  status?: ProjectStatus[];
  client_id?: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  date_range?: {
    start: string;
    end: string;
  };
  budget_range?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Income and Expense types
export interface Income {
  id: string;
  project_id: string;
  project?: Project;
  client_id: string;
  client?: Client;
  description: string;
  amount: number;
  currency: string;
  received_date: string;
  payment_method?: string;
  reference?: string;
  category: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIncomeData {
  project_id: string;
  client_id: string;
  description: string;
  amount: number;
  currency: string;
  received_date: string;
  payment_method?: string;
  reference?: string;
  category: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'pendiente' | 'confirmado' | 'cancelado';
  notes?: string;
  receipt_url?: string;
}

export interface UpdateIncomeData {
  description?: string;
  amount?: number;
  currency?: string;
  received_date?: string;
  payment_method?: string;
  reference?: string;
  category?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'pendiente' | 'confirmado' | 'cancelado';
  notes?: string;
  receipt_url?: string;
}

export interface ProjectIncomesSummary {
  project_id: string;
  project_name: string;
  project_status: string;
  client_name?: string;
  total_incomes: number;
  total_confirmed_amount: number;
  total_pending_amount: number;
  total_confirmed_usd: number;
  total_confirmed_crc: number;
  total_amount: number;
  confirmed_amount: number;
  first_received_date?: string;
  last_received_date?: string;
}

export interface IncomeFilters {
  status?: string[];
  project_id?: string;
  client_id?: string;
  received_date_from?: string;
  received_date_to?: string;
  amount_min?: number;
  amount_max?: number;
  payment_method?: string;
  category?: string;
  currency?: string;
  date_from?: string;
  date_to?: string;
}

// Re-export expense types from dedicated module
export type {
  Expense,
  CreateExpenseData,
  UpdateExpenseData,
  ExpenseForm as ExpenseFormType,
  ExpenseSummary,
  ProjectExpenseSummary,
  ExpenseFilters,
  ExpenseCategory,
  DirectCostSubcategory,
  IndirectCostSubcategory,
  PaymentStatus,
  Currency
} from './types/expense';

export interface MonthlyIncomeReport {
  id: string;
  amount: number;
  currency: 'CRC' | 'USD';
  exchange_rate_usd?: number;
  received_date: string;
  description?: string;
  reference?: string;
  notes?: string;
  project: {
    id: string;
    name: string;
  } | null;
  client: {
    id: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}