// =====================================================
// TIPOS PARA EL SISTEMA COMPLETO DE GESTIÓN
// =====================================================

// =====================================================
// 1. USUARIOS Y ROLES
// =====================================================

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: string;
  role?: UserRole;
  is_active: boolean;
  is_master: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role_id?: string;
  is_active?: boolean;
}

// =====================================================
// 2. CLIENTES
// =====================================================

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  notes?: string;
  is_active?: boolean;
}

// =====================================================
// 3. PROVEEDORES
// =====================================================

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  category?: string; // materiales, equipos, servicios, etc.
  payment_terms?: number; // días de crédito
  notes?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  category?: string;
  payment_terms?: number;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateSupplierData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  category?: string;
  payment_terms?: number;
  notes?: string;
  is_active?: boolean;
}

// =====================================================
// 4. PROYECTOS (ACTUALIZADO)
// =====================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  client?: Client;
  manager_id?: string;
  manager?: User;
  status: 'active' | 'completed' | 'cancelled';
  location?: string;
  
  // Fechas
  estimated_start_date?: string;
  estimated_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  
  // Campos para cálculos
  exchange_rate_usd?: number; // Tipo de cambio USD/CRC al momento del contrato
  total_area?: number; // Área total del proyecto en m²
  
  // Presupuesto detallado
  presupuesto_inicial: number;
  presupuesto_original: number;
  presupuesto_final: number;
  costos_directos_materiales: number;
  costos_directos_equipos: number;
  costos_indirectos: number;
  gastos_administrativos: number;
  mano_obra_quincenal: number;
  imprevistos: number;
  utilidad_esperada: number;
  
  // Totales calculados
  budget?: number;
  start_date?: string;
  end_date?: string;
  progress_percentage?: number;
  
  // Metadatos
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  client_id: string;
  status?: 'active' | 'completed' | 'cancelled';
  location?: string;
  
  // Fechas
  estimated_start_date?: string;
  estimated_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  
  // Campos para cálculos
  exchange_rate_usd?: number; // Tipo de cambio USD/CRC al momento del contrato
  total_area?: number; // Área total del proyecto en m²
  
  // Presupuesto detallado
  presupuesto_inicial?: number;
  presupuesto_original?: number;
  presupuesto_final?: number;
  costos_directos_materiales?: number;
  costos_directos_equipos?: number;
  costos_indirectos?: number;
  gastos_administrativos?: number;
  mano_obra_quincenal?: number;
  imprevistos?: number;
  utilidad_esperada?: number;
  
  // Metadatos
  created_by?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  client_id?: string;
  manager_id?: string;
  status?: 'active' | 'completed' | 'cancelled';
  location?: string;
  
  // Fechas
  estimated_start_date?: string;
  estimated_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  
  // Campos para cálculos
  exchange_rate_usd?: number; // Tipo de cambio USD/CRC al momento del contrato
  total_area?: number; // Área total del proyecto en m²
  
  // Presupuesto detallado
  presupuesto_inicial?: number;
  presupuesto_original?: number;
  presupuesto_final?: number;
  costos_directos_materiales?: number;
  costos_directos_equipos?: number;
  costos_indirectos?: number;
  gastos_administrativos?: number;
  mano_obra_quincenal?: number;
  imprevistos?: number;
  utilidad_esperada?: number;
  
  // Control financiero
  budget?: number;
}

// =====================================================
// 5. EQUIPOS
// =====================================================

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  category?: string; // excavadoras, grúas, herramientas, etc.
  brand?: string;
  model?: string;
  serial_number?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  daily_rental_rate: number;
  weekly_rental_rate?: number;
  monthly_rental_rate?: number;
  status: string; // available, rented, maintenance, retired
  condition: string; // excellent, good, fair, poor
  location?: string;
  notes?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipmentData {
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  daily_rental_rate: number;
  weekly_rental_rate?: number;
  monthly_rental_rate?: number;
  status?: string;
  condition?: string;
  location?: string;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateEquipmentData {
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  daily_rental_rate?: number;
  weekly_rental_rate?: number;
  monthly_rental_rate?: number;
  status?: string;
  condition?: string;
  location?: string;
  notes?: string;
  is_active?: boolean;
}

// =====================================================
// 6. ALQUILER DE EQUIPOS
// =====================================================

export interface EquipmentRental {
  id: string;
  equipment_id: string;
  equipment?: Equipment;
  project_id: string;
  project?: Project;
  start_date: string;
  end_date?: string;
  planned_end_date?: string;
  daily_rate: number;
  total_days?: number;
  total_cost?: number;
  status: string; // active, completed, cancelled
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipmentRentalData {
  equipment_id: string;
  project_id: string;
  start_date: string;
  planned_end_date?: string;
  daily_rate: number;
  notes?: string;
}

export interface UpdateEquipmentRentalData {
  end_date?: string;
  planned_end_date?: string;
  daily_rate?: number;
  total_days?: number;
  total_cost?: number;
  status?: string;
  notes?: string;
}



// =====================================================
// 8. PAGOS DE CLIENTES
// =====================================================

export interface ClientPayment {
  id: string;
  project_id?: string;
  project?: Project;
  client_id?: string;
  client?: Client;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  status: string; // pending, confirmed, cancelled
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientPaymentData {
  project_id?: string;
  client_id?: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  status?: string;
}

export interface UpdateClientPaymentData {
  payment_date?: string;
  amount?: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  status?: string;
}

// =====================================================
// 9. PAGOS A PROVEEDORES
// =====================================================

export interface SupplierPayment {
  id: string;
  project_id?: string;
  project?: Project;
  supplier_id?: string;
  supplier?: Supplier;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  description?: string;
  category?: string; // materiales, servicios, equipos
  notes?: string;
  status: string; // pending, confirmed, cancelled
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierPaymentData {
  project_id?: string;
  supplier_id?: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  description?: string;
  category?: string;
  notes?: string;
  status?: string;
}

export interface UpdateSupplierPaymentData {
  payment_date?: string;
  amount?: number;
  payment_method?: string;
  reference_number?: string;
  description?: string;
  category?: string;
  notes?: string;
  status?: string;
}

// =====================================================
// 10. RELACIONES ADICIONALES
// =====================================================

// Relación Proyecto-Proveedor
export interface ProjectSupplier {
  id: string;
  project_id: string;
  supplier_id: string;
  category?: string; // materiales, servicios, equipos
  contract_amount?: number;
  paid_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  project?: Project;
  supplier?: Supplier;
}

export interface CreateProjectSupplierData {
  project_id: string;
  supplier_id: string;
  category?: string;
  contract_amount?: number;
  notes?: string;
}

export interface UpdateProjectSupplierData {
  category?: string;
  contract_amount?: number;
  paid_amount?: number;
  status?: string;
  notes?: string;
}

// Relación Proyecto-Equipo
export interface ProjectEquipment {
  id: string;
  project_id: string;
  equipment_id: string;
  rental_id?: string;
  assigned_date: string;
  removed_date?: string;
  is_active: boolean;
  created_at: string;
  // Relaciones
  project?: Project;
  equipment?: Equipment;
  rental?: EquipmentRental;
}

export interface CreateProjectEquipmentData {
  project_id: string;
  equipment_id: string;
  rental_id?: string;
  assigned_date?: string;
}

export interface UpdateProjectEquipmentData {
  rental_id?: string;
  removed_date?: string;
  is_active?: boolean;
}

// Detalles de Pagos (para trazabilidad)
export interface PaymentDetail {
  id: string;
  payment_id: string; // puede ser client_payment_id o supplier_payment_id
  payment_type: string; // 'client' o 'supplier'
  concept?: string;
  amount: number;
  notes?: string;
  created_at: string;
}

export interface CreatePaymentDetailData {
  payment_id: string;
  payment_type: string;
  concept?: string;
  amount: number;
  notes?: string;
}

// =====================================================
// 11. VISTAS Y REPORTES
// =====================================================

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  client_name?: string;
  manager_name?: string;
  total_budget: number;
  total_invoiced: number;
  total_paid: number;
  total_expenses: number;
  estimated_profit: number;
  actual_profit: number;
  payment_percentage: number;
  estimated_start_date?: string;
  estimated_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
}

export interface EquipmentRentalSummary {
  id: string;
  equipment_name: string;
  category?: string;
  project_name: string;
  start_date: string;
  end_date?: string;
  daily_rate: number;
  total_days?: number;
  total_cost?: number;
  status: string;
}

export interface ProjectFinancialStatus {
  project_id: string;
  project_name: string;
  total_budget: number;
  total_invoiced: number;
  total_received: number;
  total_expenses: number;
  estimated_profit: number;
  actual_profit: number;
}

// =====================================================
// 12. TIPOS AUXILIARES
// =====================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================
// 13. FILTROS Y BÚSQUEDAS
// =====================================================

export interface ProjectFilters {
  status?: string[];
  client_id?: string;
  manager_id?: string;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  budget_min?: number;
  budget_max?: number;
}

export interface InvoiceFilters {
  status?: string[];
  project_id?: string;
  client_id?: string;
  issue_date_from?: string;
  issue_date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  amount_min?: number;
  amount_max?: number;
}

export interface EquipmentFilters {
  status?: string[];
  category?: string;
  condition?: string[];
  available_from?: string;
  available_to?: string;
}

export interface PaymentFilters {
  status?: string[];
  project_id?: string;
  payment_date_from?: string;
  payment_date_to?: string;
  amount_min?: number;
  amount_max?: number;
  payment_method?: string;
}

// =====================================================
// 8. GASTOS/EXPENSES
// =====================================================

export interface Expense {
  id: string;
  project_id: string;
  project?: Project;
  category: 'costos_directos' | 'costos_indirectos' | 'gastos_administrativos' | 'mano_obra' | 'imprevistos';
  subcategory?: string;
  description: string;
  amount: number;
  amount_usd?: number;
  currency: 'CRC' | 'USD';
  exchange_rate?: number;
  date: string;
  supplier_id?: string;
  supplier?: Supplier;

  reference?: string;
  details?: string;
  notes?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseData {
  project_id: string;
  category: 'costos_directos' | 'costos_indirectos' | 'gastos_administrativos' | 'mano_obra' | 'imprevistos';
  subcategory?: string;
  description: string;
  amount: number;
  amount_usd?: number;
  currency: 'CRC' | 'USD';
  exchange_rate?: number;
  date: string;
  supplier_id?: string;

  reference?: string;
  details?: string;
  notes?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
}

export interface UpdateExpenseData {
  category?: 'costos_directos' | 'costos_indirectos' | 'gastos_administrativos' | 'mano_obra' | 'imprevistos';
  subcategory?: string;
  description?: string;
  amount?: number;
  amount_usd?: number;
  currency?: 'CRC' | 'USD';
  exchange_rate?: number;
  date?: string;
  supplier_id?: string;

  reference?: string;
  details?: string;
  notes?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
}

// =====================================================
// 9. INGRESOS/INCOMES
// =====================================================

export interface Income {
  id: string;
  project_id: string;
  project?: Project;
  client_id: string;
  client?: Client;
  description: string;
  amount: number;
  currency: string;
  income_date: string;
  payment_method?: string;
  reference?: string;
  category: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateIncomeData {
  project_id: string;
  client_id: string;
  description: string;
  amount: number;
  currency: string;
  income_date: string;
  payment_method?: string;
  reference?: string;
  category: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
}

export interface UpdateIncomeData {
  description?: string;
  amount?: number;
  currency?: string;
  income_date?: string;
  payment_method?: string;
  reference?: string;
  category?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
}

export interface ProjectIncomesSummary {
  project_id: string;
  project_name: string;
  project_status: string;
  client_name?: string;
  total_incomes: number;
  total_amount: number;
  confirmed_amount: number;
  total_confirmed_amount: number;
  total_pending_amount: number;
  total_confirmed_usd: number;
  total_confirmed_crc: number;
  first_income_date?: string;
  last_income_date?: string;
}

export interface IncomeFilters {
  status?: string[];
  project_id?: string;
  client_id?: string;
  income_date_from?: string;
  income_date_to?: string;
  amount_min?: number;
  amount_max?: number;
  payment_method?: string;
  category?: string;
  currency?: string;
}

// =====================================================
// 10. CONSTANTES Y ENUMS
// =====================================================

export const EXPENSE_CATEGORIES = [
  { value: 'costos_directos', label: 'Direct Costs' },
  { value: 'costos_indirectos', label: 'Indirect Costs' },
  { value: 'gastos_administrativos', label: 'Administrative Expenses' },
  { value: 'mano_obra', label: 'Labor Costs' },
  { value: 'imprevistos', label: 'Contingencies' }
] as const;

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const;

export const EQUIPMENT_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'rented', label: 'Rented' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' }
] as const;

export const EQUIPMENT_CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
] as const;

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' }
] as const;

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const;

export const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Cash' },
  { value: 'transferencia', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Check' },
  { value: 'tarjeta', label: 'Credit/Debit Card' },
  { value: 'deposito', label: 'Bank Deposit' }
] as const;

export const USER_ROLES = [
  { value: 'master', label: 'Master User' },
  { value: 'admin', label: 'Administrator' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'operator', label: 'Operator' }
] as const;

export const SUPPLIER_CATEGORIES = [
  { value: 'materiales', label: 'Materials' },
  { value: 'equipos', label: 'Equipment' },
  { value: 'servicios', label: 'Services' },
  { value: 'transporte', label: 'Transportation' },
  { value: 'subcontratistas', label: 'Subcontractors' }
] as const;

export const EQUIPMENT_CATEGORIES = [
  { value: 'excavadoras', label: 'Excavators' },
  { value: 'gruas', label: 'Cranes' },
  { value: 'herramientas', label: 'Tools' },
  { value: 'vehiculos', label: 'Vehicles' },
  { value: 'maquinaria_pesada', label: 'Heavy Machinery' },
  { value: 'equipos_seguridad', label: 'Safety Equipment' }
] as const;

export const RENTAL_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const;

export const INCOME_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const;

export const INCOME_CATEGORIES = [
  { value: 'payment', label: 'Project Payment' },
  { value: 'advance', label: 'Advance Payment' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'refund', label: 'Refund' },
  { value: 'other', label: 'Other' }
] as const;

export const INCOME_SUBCATEGORIES = [
  { value: 'anticipo', label: 'Advance Payment' },
  { value: 'pago_parcial', label: 'Partial Payment' },
  { value: 'pago_final', label: 'Final Payment' },
  { value: 'pago_completo', label: 'Full Payment' },
  { value: 'pago_extraordinario', label: 'Extraordinary Payment' }
] as const;

// =====================================================
// 12. ÓRDENES DE CAMBIO
// =====================================================

export interface ChangeOrder {
  id: string;
  project_id: string;
  project?: Project;
  document_number: string;
  
  // Información básica
  title: string;
  description: string;
  designer?: string;
  
  // Tipo y clasificación
  change_type: 'accion_correctiva' | 'accion_preventiva' | 'extras';
  impact_type: 'positivo' | 'negativo';
  
  // Impacto financiero
  cost_impact: number;
  currency: 'CRC' | 'USD';
  exchange_rate?: number; // Tipo de cambio USD a CRC
  cost_impact_crc?: number; // Monto calculado en colones
  
  // Impacto en cronograma (días)
  schedule_impact_days: number;
  
  // Características de la orden de cambio
  cost_impact_level?: 'bajo' | 'medio' | 'alto';
  quality_impact_level?: 'bajo' | 'medio' | 'alto';
  schedule_impact_level?: 'bajo' | 'medio' | 'alto';
  risk_impact_level?: 'bajo' | 'medio' | 'alto';
  
  // Comentarios y observaciones
  cost_comments?: string;
  quality_comments?: string;
  schedule_comments?: string;
  risk_comments?: string;
  general_comments?: string;
  
  // Estado y aprobación
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'implemented';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  
  // Fechas importantes
  requested_date: string;
  implementation_date?: string;
  
  // Metadatos
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChangeOrderData {
  project_id: string;
  title: string;
  description: string;
  designer?: string;
  change_type: 'accion_correctiva' | 'accion_preventiva' | 'extras';
  impact_type: 'positivo' | 'negativo';
  cost_impact: number;
  currency: 'CRC' | 'USD';
  exchange_rate?: number; // Tipo de cambio USD a CRC
  cost_impact_crc?: number; // Monto calculado en colones
  schedule_impact_days?: number;
  
  // Campos de detalles adicionales
  cost_impact_details?: string;
  quality_impact?: string;
  schedule_details?: string;
  risk_assessment?: string;
  additional_comments?: string;
  
  // Campos de niveles de impacto
  cost_impact_level?: 'bajo' | 'medio' | 'alto';
  quality_impact_level?: 'bajo' | 'medio' | 'alto';
  schedule_impact_level?: 'bajo' | 'medio' | 'alto';
  risk_impact_level?: 'bajo' | 'medio' | 'alto';
  
  // Campos de comentarios
  cost_comments?: string;
  quality_comments?: string;
  schedule_comments?: string;
  risk_comments?: string;
  general_comments?: string;
  
  // Fechas
  requested_date?: string;
  implementation_date?: string;
}

export interface UpdateChangeOrderData {
  title?: string;
  description?: string;
  designer?: string;
  change_type?: 'accion_correctiva' | 'accion_preventiva' | 'extras';
  impact_type?: 'positivo' | 'negativo';
  cost_impact?: number;
  currency?: 'CRC' | 'USD';
  exchange_rate?: number; // Tipo de cambio USD a CRC
  cost_impact_crc?: number; // Monto calculado en colones
  schedule_impact_days?: number;
  cost_impact_level?: 'bajo' | 'medio' | 'alto';
  quality_impact_level?: 'bajo' | 'medio' | 'alto';
  schedule_impact_level?: 'bajo' | 'medio' | 'alto';
  risk_impact_level?: 'bajo' | 'medio' | 'alto';
  cost_comments?: string;
  quality_comments?: string;
  schedule_comments?: string;
  risk_comments?: string;
  general_comments?: string;
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'implemented';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  requested_date?: string;
  implementation_date?: string;
}

export interface ProjectChangeOrdersSummary {
  project_id: string;
  project_name: string;
  presupuesto_original: number;
  presupuesto_final: number;
  total_change_impact: number;
  total_change_orders: number;
  approved_change_orders: number;
  pending_change_orders: number;
  positive_changes: number;
  negative_changes: number;
  total_positive_impact: number;
  total_negative_impact: number;
  total_schedule_impact_days: number;
}

export interface ChangeOrderFilters {
  status?: string[];
  project_id?: string;
  change_type?: string[];
  impact_type?: string[];
  requested_date_from?: string;
  requested_date_to?: string;
  cost_impact_min?: number;
  cost_impact_max?: number;
}

// Constantes para órdenes de cambio
export const CHANGE_ORDER_TYPES = [
  { value: 'accion_correctiva', label: 'Acción Correctiva' },
  { value: 'accion_preventiva', label: 'Acción Preventiva' },
  { value: 'extras', label: 'Extras' }
] as const;

export const CHANGE_ORDER_IMPACT_TYPES = [
  { value: 'positivo', label: 'Positivo (Aumenta Presupuesto)' },
  { value: 'negativo', label: 'Negativo (Disminuye Presupuesto)' }
] as const;

export const CHANGE_ORDER_STATUSES = [
  { value: 'draft', label: 'Borrador' },
  { value: 'pending_approval', label: 'Pendiente de Aprobación' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'implemented', label: 'Implementada' }
] as const;

export const IMPACT_LEVELS = [
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' }
] as const;