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
  contact_person: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
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
  contact_person: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  supplier_type: 'MATERIALES' | 'SERVICIOS' | 'EQUIPOS' | 'SUBCONTRATISTA';
  status: 'ACTIVO' | 'INACTIVO';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  supplier_type: 'MATERIALES' | 'SERVICIOS' | 'EQUIPOS' | 'SUBCONTRATISTA';
  status?: 'ACTIVO' | 'INACTIVO';
  notes?: string;
}

export interface UpdateSupplierData {
  name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  supplier_type?: 'MATERIALES' | 'SERVICIOS' | 'EQUIPOS' | 'SUBCONTRATISTA';
  status?: 'ACTIVO' | 'INACTIVO';
  notes?: string;
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
  status: 'active' | 'completed' | 'cancelled' | 'planificacion' | 'en_progreso' | 'pausado' | 'completado' | 'cancelado';
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
  // Hacer opcional porque en la base de datos real puede llamarse 'budget'
  presupuesto_original?: number;
  presupuesto_final: number;
  costos_directos: number;
  costos_indirectos: number;
  administracion: number;
  mano_obra: number;
  imprevistos: number;
  utilidad: number;
  
  // Campos de porcentajes agregados para alinear con la BD (0-100)
  costos_directos_porcentaje?: number;
  costos_indirectos_porcentaje?: number;
  mano_obra_porcentaje?: number;
  administracion_porcentaje?: number;
  imprevistos_porcentaje?: number;
  utilidad_porcentaje?: number;
  
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
  manager_id?: string;
  status?: 'active' | 'completed' | 'cancelled' | 'planificacion' | 'en_progreso' | 'pausado' | 'completado' | 'cancelado';
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
  costos_directos?: number;
  costos_indirectos?: number;
  administracion?: number;
  mano_obra?: number;
  imprevistos?: number;
  utilidad?: number;
  
  // Porcentajes (0-100)
  costos_directos_porcentaje?: number;
  costos_indirectos_porcentaje?: number;
  mano_obra_porcentaje?: number;
  administracion_porcentaje?: number;
  imprevistos_porcentaje?: number;
  utilidad_porcentaje?: number;
  
  // Metadatos
  created_by?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  client_id?: string;
  manager_id?: string;
  status?: 'active' | 'completed' | 'cancelled' | 'planificacion' | 'en_progreso' | 'pausado' | 'completado' | 'cancelado';
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
  costos_directos?: number;
  costos_indirectos?: number;
  administracion?: number;
  mano_obra?: number;
  imprevistos?: number;
  utilidad?: number;
  
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
  category: 'costos_directos' | 'costos_indirectos' | 'mano_obra' | 'imprevistos' | 'administracion';
  subcategory_direct?: 'subcontratos' | 'materiales' | 'otros';
  subcategory_indirect?: 'cargas_sociales' | 'alquiler' | 'control_calidad' | 'servicios_basicos' | 'transporte' | 'polizas' | 'inspeccion_ingenieros' | 'viaticos' | 'garantias' | 'equipos' | 'otros';
  description: string;
  amount: number;
  currency: 'CRC' | 'USD';
  exchange_rate_usd?: number;
  expense_date: string;
  date?: string; // Alias para expense_date para compatibilidad
  supplier_id?: string;
  supplier?: Supplier;
  invoice_number?: string;
  payment_status?: 'pendiente' | 'pagado' | 'cancelado';
  payment_date?: string;
  notes?: string;
  receipt_url?: string; // Comprobante de factura
  reference?: string;
  reference_attachment_url?: string; // Comprobante de referencia
  reference_attachment_name?: string; // Nombre del archivo de referencia
  reference_attachment_type?: string; // Tipo MIME del archivo de referencia
  reference_attachment_size?: number; // Tamaño del archivo de referencia en bytes
  details?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseData {
  project_id: string;
  category: 'costos_directos' | 'costos_indirectos' | 'mano_obra' | 'imprevistos' | 'administracion';
  subcategory_direct?: 'subcontratos' | 'materiales' | 'otros';
  subcategory_indirect?: 'cargas_sociales' | 'alquiler' | 'control_calidad' | 'servicios_basicos' | 'transporte' | 'polizas' | 'inspeccion_ingenieros' | 'viaticos' | 'garantias' | 'equipos' | 'otros';
  description: string;
  amount: number;
  currency?: 'CRC' | 'USD';
  exchange_rate?: number;
  exchange_rate_usd?: number;
  expense_date?: string;
  supplier_id?: string;
  invoice_number?: string;
  payment_status?: 'pendiente' | 'pagado' | 'cancelado';
  payment_date?: string;
  notes?: string;
  receipt_url?: string; // Comprobante de factura
  reference?: string;
  reference_attachment_url?: string; // Comprobante de referencia
  reference_attachment_name?: string; // Nombre del archivo de referencia
  reference_attachment_type?: string; // Tipo MIME del archivo de referencia
  reference_attachment_size?: number; // Tamaño del archivo de referencia en bytes
}

export interface UpdateExpenseData {
  category?: 'costos_directos' | 'costos_indirectos' | 'mano_obra' | 'imprevistos' | 'administracion';
  subcategory_direct?: 'subcontratos' | 'materiales' | 'otros';
  subcategory_indirect?: 'cargas_sociales' | 'alquiler' | 'control_calidad' | 'servicios_basicos' | 'transporte' | 'polizas' | 'inspeccion_ingenieros' | 'viaticos' | 'garantias' | 'equipos' | 'otros';
  description?: string;
  amount?: number;
  currency?: 'CRC' | 'USD';
  exchange_rate?: number;
  exchange_rate_usd?: number;
  expense_date?: string;
  supplier_id?: string;
  invoice_number?: string;
  payment_status?: 'pendiente' | 'pagado' | 'cancelado';
  payment_date?: string;
  notes?: string;
  receipt_url?: string;
  reference?: string;
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

// Shared unions for income status values used across DTOs and helpers
export type IncomeStatus = 'pending' | 'confirmed' | 'cancelled' | 'pendiente' | 'confirmado' | 'cancelado';
export type IncomeEnglishStatus = 'pending' | 'confirmed' | 'cancelled';
export type IncomeSpanishStatus = 'pendiente' | 'confirmado' | 'cancelado';

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
}

// =====================================================
// 10. CONSTANTES Y ENUMS
// =====================================================

// Categorías principales de gastos
export const EXPENSE_CATEGORIES = [
  { value: 'costos_directos', label: 'Costos Directos' },
  { value: 'costos_indirectos', label: 'Costos Indirectos' },
  { value: 'mano_obra', label: 'Mano de Obra' },
  { value: 'imprevistos', label: 'Imprevistos' },
  { value: 'administracion', label: 'Administración' }
] as const;

// Subcategorías para Costos Directos
export const DIRECT_COST_SUBCATEGORIES = [
  { value: 'subcontratos', label: 'Subcontratos' },
  { value: 'materiales', label: 'Materiales' },
  { value: 'otros', label: 'Otros' }
] as const;

// Subcategorías para Costos Indirectos
export const INDIRECT_COST_SUBCATEGORIES = [
  { value: 'cargas_sociales', label: 'Cargas Sociales' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'control_calidad', label: 'Control de Calidad' },
  { value: 'servicios_basicos', label: 'Servicios Básicos' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'polizas', label: 'Pólizas' },
  { value: 'inspeccion_ingenieros', label: 'Inspección de Ingenieros' },
  { value: 'viaticos', label: 'Viáticos' },
  { value: 'garantias', label: 'Garantías' },
  { value: 'equipos', label: 'Equipos' },
  { value: 'otros', label: 'Otros' }
] as const;

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const;

// Mapeo de estados de proyecto: inglés (frontend) <-> español (base de datos)
export type ProjectEnglishStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectSpanishStatus = 'planificacion' | 'en_progreso' | 'pausado' | 'completado' | 'cancelado';

export const PROJECT_STATUS_MAP: Record<ProjectEnglishStatus, ProjectSpanishStatus> = {
  planning: 'planificacion',
  in_progress: 'en_progreso',
  on_hold: 'pausado',
  completed: 'completado',
  cancelled: 'cancelado',
};

export const PROJECT_STATUS_REVERSE_MAP: Record<ProjectSpanishStatus, ProjectEnglishStatus> = {
  planificacion: 'planning',
  en_progreso: 'in_progress',
  pausado: 'on_hold',
  completado: 'completed',
  cancelado: 'cancelled',
};

export function mapProjectStatus(
  status?: ProjectEnglishStatus | ProjectSpanishStatus | string
): ProjectSpanishStatus | undefined {
  if (!status) return undefined;
  // Si ya viene en español, devolverlo tal cual
  const spanishStatuses: readonly ProjectSpanishStatus[] = [
    'planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado'
  ] as const;
  if ((spanishStatuses as readonly string[]).includes(status)) {
    return status as ProjectSpanishStatus;
  }
  // Intentar mapear desde inglés
  const mapped = PROJECT_STATUS_MAP[status as ProjectEnglishStatus];
  return mapped ?? undefined;
}

export function reverseMapProjectStatus(
  status?: ProjectSpanishStatus | ProjectEnglishStatus | string
): ProjectEnglishStatus | undefined {
  if (!status) return undefined;
  const englishStatuses: readonly ProjectEnglishStatus[] = [
    'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'
  ] as const;
  if ((englishStatuses as readonly string[]).includes(status)) {
    return status as ProjectEnglishStatus;
  }
  const mapped = PROJECT_STATUS_REVERSE_MAP[status as ProjectSpanishStatus];
  return mapped ?? undefined;
}
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

// Mapeo de categorías: inglés (frontend) -> español (base de datos)
export const INCOME_CATEGORY_MAP: Record<string, string> = {
  'payment': 'pago_proyecto',
  'advance': 'anticipo',
  'bonus': 'pago_final',
  'refund': 'pago_parcial',
  'other': 'otros'
};

// Mapeo de status: inglés (frontend) -> español (base de datos)
export const INCOME_STATUS_MAP: Record<IncomeEnglishStatus, IncomeSpanishStatus> = {
  'pending': 'pendiente',
  'confirmed': 'confirmado',
  'cancelled': 'cancelado'
};

// Mapeo inverso: español (base de datos) -> inglés (frontend)
export const INCOME_CATEGORY_REVERSE_MAP: Record<string, string> = {
  // Español (BD) -> Inglés (UI)
  'pago_proyecto': 'payment',
  'anticipo': 'advance',
  'pago_final': 'bonus',
  'pago_parcial': 'refund',
  'otros': 'other',
  // Inglés canónico (BD) -> Inglés (UI)
  'payment_received': 'payment',
  'advance_payment': 'advance',
  'final_payment': 'bonus',
  'milestone_payment': 'refund',
  // Inglés alternativo (BD) -> Inglés (UI)
  'payment': 'payment',
  'advance': 'advance',
  'bonus': 'bonus',
  'refund': 'refund',
  'other': 'other'
};

export const INCOME_STATUS_REVERSE_MAP: Record<IncomeSpanishStatus, IncomeEnglishStatus> = {
  'pendiente': 'pending',
  'confirmado': 'confirmed',
  'cancelado': 'cancelled'
};

// Funciones de utilidad para conversión
export const mapIncomeCategory = (category: string): string => {
  return INCOME_CATEGORY_MAP[category] || category;
};

// Narrow return type to IncomeStatus for better type safety in call sites
export const mapIncomeStatus = (status: string): IncomeSpanishStatus => {
  return (INCOME_STATUS_MAP[status as IncomeEnglishStatus] || status) as IncomeSpanishStatus;
};

export const reverseMapIncomeCategory = (category: string): string => {
  return INCOME_CATEGORY_REVERSE_MAP[category] || category;
};

// Narrow return type to IncomeStatus for better type safety in call sites
export const reverseMapIncomeStatus = (status: string): IncomeEnglishStatus => {
  return (INCOME_STATUS_REVERSE_MAP[status as IncomeSpanishStatus] || status) as IncomeEnglishStatus;
};

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
  status: 'pendiente' | 'aprobado' | 'rechazado' | 'implementado';
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
  description?: string;
  designer?: string;
  change_type?: 'accion_correctiva' | 'accion_preventiva' | 'extras';
  impact_type?: 'positivo' | 'negativo';
  cost_impact?: number;
  currency?: 'CRC' | 'USD';
  exchange_rate?: number;
  cost_impact_crc?: number;
  schedule_impact_days?: number;
  cost_impact_details?: string;
  quality_impact?: string;
  schedule_details?: string;
  risk_assessment?: string;
  additional_comments?: string;
  cost_impact_level?: 'bajo' | 'medio' | 'alto';
  quality_impact_level?: 'bajo' | 'medio' | 'alto';
  schedule_impact_level?: 'bajo' | 'medio' | 'alto';
  risk_impact_level?: 'bajo' | 'medio' | 'alto';
  status?: 'pendiente' | 'aprobado' | 'rechazado' | 'implementado';
  request_date?: string;
  notes?: string;
  
  // Campos legacy para compatibilidad
  amount?: number;
  requested_by?: string;
  approved_by?: string;
  approval_date?: string;
  requested_date?: string;
  implementation_date?: string;
}

export interface UpdateChangeOrderData {
  project_id?: string;
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
  status?: 'pendiente' | 'aprobado' | 'rechazado' | 'implementado';
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
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobado', label: 'Aprobada' },
  { value: 'rechazado', label: 'Rechazada' },
  { value: 'implementado', label: 'Implementada' }
] as const;

export const IMPACT_LEVELS = [
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' }
] as const;