// =====================================================
// TIPOS ESPECÍFICOS PARA GASTOS (EXPENSES)
// =====================================================

import { Project, Supplier } from '@/types/database';

// Tipos de categorías de gastos
export type ExpenseCategory = 
  | 'costos_directos' 
  | 'costos_indirectos' 
  | 'mano_obra' 
  | 'imprevistos' 
  | 'administracion' 
  | 'gastos_administrativos' 
  | 'utilidad';

// Subcategorías para costos directos
export type DirectCostSubcategory = 
  | 'subcontratos' 
  | 'materiales' 
  | 'otros';

// Subcategorías para costos indirectos
export type IndirectCostSubcategory = 
  | 'cargas_sociales' 
  | 'alquiler' 
  | 'control_calidad' 
  | 'servicios_basicos' 
  | 'transporte' 
  | 'polizas' 
  | 'inspeccion_ingenieros' 
  | 'viaticos' 
  | 'garantias' 
  | 'equipos' 
  | 'otros';

// Estados de pago
export type PaymentStatus = 'pendiente' | 'pagado' | 'cancelado';

// Monedas soportadas
export type Currency = 'CRC' | 'USD';

// Interface principal para gastos
export interface Expense {
  id: string;
  project_id: string;
  project?: Project;
  category: ExpenseCategory;
  subcategory_direct?: DirectCostSubcategory;
  subcategory_indirect?: IndirectCostSubcategory;
  description: string;
  amount: number;
  currency: Currency;
  exchange_rate_usd?: number;
  expense_date: string;
  supplier_id?: string;
  supplier?: Supplier;
  invoice_number?: string;
  payment_status: PaymentStatus;
  payment_date?: string;
  notes?: string;
  receipt_url?: string;
  reference?: string;
  reference_attachment_url?: string;
  reference_attachment_name?: string;
  reference_attachment_type?: string;
  reference_attachment_size?: number;
  details?: string;
  created_at: string;
  updated_at: string;
}

// Interface para crear un nuevo gasto
export interface CreateExpenseData {
  project_id: string;
  category: ExpenseCategory;
  subcategory_direct?: DirectCostSubcategory;
  subcategory_indirect?: IndirectCostSubcategory;
  description: string;
  amount: number;
  currency: Currency;
  exchange_rate?: number;
  expense_date: string;
  supplier_id?: string;
  invoice_number?: string;
  payment_status?: PaymentStatus;
  payment_date?: string;
  notes?: string;
  receipt_url?: string;
  reference?: string;
  reference_attachment_url?: string;
  reference_attachment_name?: string;
  reference_attachment_type?: string;
  reference_attachment_size?: number;
  details?: string;
}

// Interface para actualizar un gasto
export interface UpdateExpenseData {
  category?: ExpenseCategory;
  subcategory_direct?: DirectCostSubcategory;
  subcategory_indirect?: IndirectCostSubcategory;
  description?: string;
  amount?: number;
  currency?: Currency;
  exchange_rate_usd?: number | null;
  expense_date?: string;
  supplier_id?: string | null;
  invoice_number?: string;
  payment_status?: PaymentStatus;
  payment_date?: string | null;
  notes?: string | null;
  receipt_url?: string | null;
  reference?: string | null;
  reference_attachment_url?: string | null;
  reference_attachment_name?: string | null;
  reference_attachment_type?: string | null;
  reference_attachment_size?: number | null;
  details?: string | null;
}

// Interface para el formulario de gastos
export interface ExpenseForm {
  project_id: string;
  category: ExpenseCategory;
  subcategory_direct?: DirectCostSubcategory;
  subcategory_indirect?: IndirectCostSubcategory;
  description: string;
  amount: string; // String para el formulario, se convierte a number al enviar
  currency: Currency;
  exchange_rate: string; // String para el formulario
  date: string;
  supplier_id: string;
  invoice_number: string;
  payment_status: PaymentStatus;
  payment_date: string;
  notes: string;
  receipt_url: string;
  reference: string;
  reference_attachment_url: string;
  reference_attachment_name: string;
  reference_attachment_type: string;
  reference_attachment_size: string; // String para el formulario
  details: string;
}

// Interface para resumen de gastos por categoría
export interface ExpenseSummary {
  category: ExpenseCategory;
  total: number;
  totalUSD: number;
  count: number;
  percentage: number;
}

// Interface para resumen de gastos por proyecto
export interface ProjectExpenseSummary {
  project_id: string;
  project_name: string;
  total: number;
  totalUSD: number;
  count: number;
  percentage: number;
}

// Interface para filtros de gastos
export interface ExpenseFilters {
  project_id?: string;
  category?: ExpenseCategory;
  subcategory?: string;
  supplier_id?: string;
  payment_status?: PaymentStatus;
  currency?: Currency;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
}

// Constantes para las categorías
export const EXPENSE_CATEGORIES = [
  { value: 'costos_directos' as const, label: 'Costos Directos' },
  { value: 'costos_indirectos' as const, label: 'Costos Indirectos' },
  { value: 'mano_obra' as const, label: 'Mano de Obra' },
  { value: 'imprevistos' as const, label: 'Imprevistos' },
  { value: 'administracion' as const, label: 'Administración' },
  { value: 'gastos_administrativos' as const, label: 'Gastos Administrativos' },
  { value: 'utilidad' as const, label: 'Utilidad' }
] as const;

export const DIRECT_COST_SUBCATEGORIES = [
  { value: 'subcontratos' as const, label: 'Subcontratos' },
  { value: 'materiales' as const, label: 'Materiales' },
  { value: 'otros' as const, label: 'Otros' }
] as const;

export const INDIRECT_COST_SUBCATEGORIES = [
  { value: 'cargas_sociales' as const, label: 'Cargas Sociales' },
  { value: 'alquiler' as const, label: 'Alquiler' },
  { value: 'control_calidad' as const, label: 'Control de Calidad' },
  { value: 'servicios_basicos' as const, label: 'Servicios Básicos' },
  { value: 'transporte' as const, label: 'Transporte' },
  { value: 'polizas' as const, label: 'Pólizas' },
  { value: 'inspeccion_ingenieros' as const, label: 'Inspección de Ingenieros' },
  { value: 'viaticos' as const, label: 'Viáticos' },
  { value: 'garantias' as const, label: 'Garantías' },
  { value: 'equipos' as const, label: 'Equipos' },
  { value: 'otros' as const, label: 'Otros' }
] as const;

export const PAYMENT_STATUSES = [
  { value: 'pendiente' as const, label: 'Pendiente' },
  { value: 'pagado' as const, label: 'Pagado' },
  { value: 'cancelado' as const, label: 'Cancelado' }
] as const;

export const CURRENCIES = [
  { value: 'CRC' as const, label: 'Colones (CRC)' },
  { value: 'USD' as const, label: 'Dólares (USD)' }
] as const;