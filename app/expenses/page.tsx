'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/ui/file-upload';
import { TranslatableInput } from '@/components/ui/translatable-input';
import { Plus, Search, Filter, DollarSign, TrendingUp, TrendingDown, Calendar, Building2, Edit, Trash2, UserPlus, FileText, Upload, X, Calculator, Users, Truck, AlertTriangle, Download } from 'lucide-react';
import { ProjectService } from '@/lib/supabase/database';
import { Project, Supplier } from '@/types/database';
import { 
  Expense, 
  CreateExpenseData, 
  UpdateExpenseData,
  ExpenseForm as ExpenseFormType,
  ExpenseSummary,
  EXPENSE_CATEGORIES, 
  DIRECT_COST_SUBCATEGORIES, 
  INDIRECT_COST_SUBCATEGORIES,
  PAYMENT_STATUSES,
  CURRENCIES,
  ExpenseCategory
} from '@/lib/types/expense';
import { ExpenseService } from '@/lib/services/expenseService';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { uploadFile } from '@/lib/services/fileService';
import { NewSupplierModal } from '@/components/suppliers/NewSupplierModal';

// Usando tipos optimizados de lib/types/expense

interface ProjectSummary {
  project_id: string;
  project_name: string;
  total: number;
  totalUSD: number;
  count: number;
  percentage: number;
}

// Instancia del servicio optimizado
const expenseService = new ExpenseService();

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  
  const supabase = createClient();
  const [expenseForm, setExpenseForm] = useState<ExpenseFormType>({
    project_id: '',
    category: 'costos_directos',
    subcategory_direct: undefined,
    subcategory_indirect: undefined,
    description: '',
    amount: '',
    currency: 'CRC',
    exchange_rate: '',
    date: new Date().toISOString().split('T')[0],
    supplier_id: 'none',
    invoice_number: '',
    payment_status: 'pendiente',
    payment_date: '',
    notes: '',
    receipt_url: '',
    reference: '',
    reference_attachment_url: '',
    reference_attachment_name: '',
    reference_attachment_type: '',
    reference_attachment_size: '',
    details: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Efecto para resetear subcategoría cuando cambie la categoría
  useEffect(() => {
    setSelectedSubcategory('all');
  }, [selectedCategory]);

  // Efecto para actualizar el tipo de cambio cuando se cambia la moneda a CRC
  useEffect(() => {
    const updateExchangeRateForCurrency = async () => {
      if (expenseForm.currency === 'CRC' && expenseForm.date && !expenseForm.exchange_rate) {
        try {
          const rate = await getExchangeRate(expenseForm.date);
          setExpenseForm(prev => ({ ...prev, exchange_rate: rate.toString() }));
        } catch (error) {
          // Error silently handled - exchange rate can be set manually
        }
      }
      // Removido el else if que limpiaba el exchange_rate para USD
      // Ahora el usuario puede ingresar manualmente el tipo de cambio para USD
    };

    updateExchangeRateForCurrency();
  }, [expenseForm.currency]);

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadFile(file);
      setExpenseForm(prev => ({
        ...prev,
        receipt_url: result.url
      }));
      toast.success('Archivo subido exitosamente');
      return result;
    } catch (error) {
      toast.error('Error al subir el archivo');
      throw error;
    }
  };

  const handleFileRemove = () => {
    setExpenseForm(prev => ({
      ...prev,
      receipt_url: ''
    }));
  };

  const handleReferenceFileUpload = async (file: File) => {
    try {
      const result = await uploadFile(file);
      setExpenseForm(prev => ({
        ...prev,
        reference_attachment_url: result.url,
        reference_attachment_name: file.name,
        reference_attachment_type: file.type,
        reference_attachment_size: file.size.toString()
      }));
      toast.success('Comprobante de referencia subido exitosamente');
      return result;
    } catch (error) {
      toast.error('Error al subir el comprobante de referencia');
      throw error;
    }
  };

  const handleReferenceFileRemove = () => {
    setExpenseForm(prev => ({
      ...prev,
      reference_attachment_url: '',
      reference_attachment_name: '',
      reference_attachment_type: '',
      reference_attachment_size: ''
    }));
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar datos en paralelo para mejor rendimiento
      const [projectsResponse, suppliersResponse, expensesResponse] = await Promise.all([
        new ProjectService().getProjects(),
        supabase
          .from('suppliers')
          .select('*')
          .eq('status', 'ACTIVO')
          .order('name', { ascending: true }),
        expenseService.getExpenses(undefined, { 
          page: 1, 
          limit: 1000, 
          sort_by: 'expense_date', 
          sort_order: 'desc' 
        })
      ]);
      
      // Manejar respuesta de proyectos
      if (projectsResponse.data) {
        setProjects(projectsResponse.data as Project[]);
      }
      
      // Manejar respuesta de proveedores
      if (suppliersResponse.error) {
        toast.error('Error al cargar proveedores');
      } else {
        setSuppliers(suppliersResponse.data || []);
      }
      
      // Manejar respuesta de gastos usando el servicio optimizado
      setExpenses(expensesResponse.data || []);
      
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener el tipo de cambio del Banco Central de Costa Rica
  const getExchangeRate = async (date: string): Promise<number> => {
    try {
      // Por ahora usamos un valor fijo ya que la API del BCCR requiere configuración especial
      // En producción se debería implementar una API proxy o usar un servicio de tipos de cambio
      const defaultRate = 500; // Tipo de cambio aproximado CRC/USD
      
      // Simulamos una pequeña variación basada en la fecha para hacer más realista
      const dateObj = new Date(date);
      const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const variation = (dayOfYear % 10) - 5; // Variación de -5 a +4
      
      return defaultRate + variation;
    } catch (error) {
      return 500; // Valor por defecto
    }
  };

  // Función para actualizar automáticamente el tipo de cambio cuando cambia la fecha
  const handleDateChange = async (date: string) => {
    setExpenseForm(prev => ({ ...prev, date }));
    if (expenseForm.currency === 'CRC') {
      try {
        const rate = await getExchangeRate(date);
        setExpenseForm(prev => ({ ...prev, exchange_rate: rate.toString() }));
      } catch (error) {
        // Error silently handled - exchange rate can be set manually
      }
    }
  };

  const handleAddExpense = async () => {
    try {
      // Asegurar sesión fresca antes de guardar
      const isSessionOk = await ensureFreshSession();
      if (!isSessionOk) return;
      // Validaciones básicas
      if (!expenseForm.project_id) {
        toast.error('Debe seleccionar un proyecto');
        return;
      }
      
      if (!expenseForm.description?.trim()) {
        toast.error('La descripción es requerida');
        return;
      }
      
      if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
        toast.error('El monto debe ser mayor a 0');
        return;
      }
      
      const inputAmount = parseFloat(expenseForm.amount);
      
      // Preparar datos para la base de datos
      const expenseData: CreateExpenseData = {
        project_id: expenseForm.project_id,
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        amount: inputAmount,
        currency: expenseForm.currency,
        exchange_rate: expenseForm.exchange_rate ? parseFloat(expenseForm.exchange_rate) : undefined,
        expense_date: expenseForm.date,
        supplier_id: expenseForm.supplier_id === 'none' ? undefined : expenseForm.supplier_id,
        invoice_number: expenseForm.invoice_number?.trim() || undefined,
        payment_status: expenseForm.payment_status || 'pendiente',
        payment_date: expenseForm.payment_date || undefined,
        notes: expenseForm.notes?.trim() || undefined,
        receipt_url: expenseForm.receipt_url || undefined,
        reference: expenseForm.reference?.trim() || undefined,
        reference_attachment_url: expenseForm.reference_attachment_url || undefined,
        reference_attachment_name: expenseForm.reference_attachment_name || undefined,
        reference_attachment_type: expenseForm.reference_attachment_type || undefined,
        reference_attachment_size: expenseForm.reference_attachment_size ? parseInt(expenseForm.reference_attachment_size) : undefined
      };

      // Agregar subcategorías según la categoría seleccionada
      if (expenseForm.category === 'costos_directos' && expenseForm.subcategory_direct) {
        expenseData.subcategory_direct = expenseForm.subcategory_direct;
      }
      
      if (expenseForm.category === 'costos_indirectos' && expenseForm.subcategory_indirect) {
        expenseData.subcategory_indirect = expenseForm.subcategory_indirect;
      }
      
      // Usar el servicio optimizado para crear el gasto
      const newExpense = await expenseService.createExpense(expenseData);
      
      // Actualizar la lista local agregando el nuevo gasto al inicio
      setExpenses(prev => [newExpense, ...prev]);
      
      setIsAddDialogOpen(false);
      resetExpenseForm();
      toast.success('Gasto agregado exitosamente');
    } catch (error) {
      toast.error('Error al agregar el gasto');
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      project_id: '',
      category: 'costos_directos',
      subcategory_direct: undefined,
      subcategory_indirect: undefined,
      description: '',
      amount: '',
      currency: 'CRC',
      exchange_rate: '',
      date: new Date().toISOString().split('T')[0],
      supplier_id: 'none',
      invoice_number: '',
      payment_status: 'pendiente',
      payment_date: '',
      notes: '',
      receipt_url: '',
      reference: '',
      reference_attachment_url: '',
      reference_attachment_name: '',
      reference_attachment_type: '',
      reference_attachment_size: '',
      details: ''
    });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    
    setExpenseForm({
      project_id: expense.project_id,
      category: expense.category || 'costos_directos',
      subcategory_direct: expense.subcategory_direct || undefined,
      subcategory_indirect: expense.subcategory_indirect || undefined,
      description: expense.description,
      amount: expense.amount.toString(),
      currency: expense.currency || 'CRC',
      exchange_rate: expense.exchange_rate_usd?.toString() || '',
      date: expense.expense_date || new Date().toISOString().split('T')[0],
      supplier_id: expense.supplier_id || 'none',
      invoice_number: expense.invoice_number || '',
      payment_status: expense.payment_status || 'pendiente',
      payment_date: expense.payment_date || '',
      notes: expense.notes || '',
      receipt_url: expense.receipt_url || '',
      reference: expense.reference || '',
      reference_attachment_url: expense.reference_attachment_url || '',
      reference_attachment_name: expense.reference_attachment_name || '',
      reference_attachment_type: expense.reference_attachment_type || '',
      reference_attachment_size: expense.reference_attachment_size?.toString() || '',
      details: expense.details || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    
    // Preparar datos para la actualización (mover fuera del try para que esté disponible en catch)
    let updateData: UpdateExpenseData | null = null;
    
    try {
      // Asegurar sesión fresca antes de actualizar
      const isSessionOk = await ensureFreshSession();
      if (!isSessionOk) return;
      // Validaciones básicas
      if (!expenseForm.project_id) {
        toast.error('Debe seleccionar un proyecto');
        return;
      }
      
      if (!expenseForm.category) {
        toast.error('Debe seleccionar una categoría');
        return;
      }
      
      if (!expenseForm.description?.trim()) {
        toast.error('La descripción es requerida');
        return;
      }
      
      if (!expenseForm.amount || isNaN(parseFloat(expenseForm.amount))) {
        toast.error('El monto debe ser un número válido');
        return;
      }
      
      const inputAmount = parseFloat(expenseForm.amount);
      
      if (inputAmount <= 0) {
        toast.error('El monto debe ser mayor a 0');
        return;
      }
      
      // Preparar datos para la actualización
      updateData = {
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        amount: inputAmount,
        currency: expenseForm.currency,
        exchange_rate_usd: expenseForm.exchange_rate ? parseFloat(expenseForm.exchange_rate) : null,
        expense_date: expenseForm.date,
        supplier_id: expenseForm.supplier_id === 'none' ? null : expenseForm.supplier_id,
        invoice_number: expenseForm.invoice_number?.trim() || null,
        payment_status: expenseForm.payment_status || 'pendiente',
        payment_date: expenseForm.payment_date || null,
        notes: expenseForm.notes?.trim() || null,
        receipt_url: expenseForm.receipt_url || null,
        reference: expenseForm.reference?.trim() || null,
        // Campos de adjunto de referencia
        reference_attachment_url: expenseForm.reference_attachment_url || null,
        reference_attachment_name: expenseForm.reference_attachment_name || null,
        reference_attachment_type: expenseForm.reference_attachment_type || null,
        reference_attachment_size: expenseForm.reference_attachment_size ? parseInt(expenseForm.reference_attachment_size) : null,
        // Limpiar subcategorías por defecto
        subcategory_direct: undefined,
        subcategory_indirect: undefined
      };

      // Agregar subcategorías según la categoría seleccionada
      if (expenseForm.category === 'costos_directos' && expenseForm.subcategory_direct) {
        updateData.subcategory_direct = expenseForm.subcategory_direct;
      }
      
      if (expenseForm.category === 'costos_indirectos' && expenseForm.subcategory_indirect) {
        updateData.subcategory_indirect = expenseForm.subcategory_indirect;
      }
      
      // Usar el servicio optimizado para actualizar el gasto
      const updatedExpense = await expenseService.updateExpense(editingExpense.id, updateData);
      
      // Actualizar la lista local
      setExpenses(prev => prev.map(expense => 
        expense.id === editingExpense.id ? updatedExpense : expense
      ));
      
      setIsEditDialogOpen(false);
      setEditingExpense(null);
      resetExpenseForm();
      toast.success('Gasto actualizado exitosamente');
    } catch (error) {
      toast.error(`Error al actualizar el gasto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingExpense(null);
    resetExpenseForm();
  };

  // Verifica y refresca la sesión si está próxima a expirar antes de operaciones críticas
  const ensureFreshSession = async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        router.push('/login?next=/expenses');
        return false;
      }
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;
      // Si queda menos de 2 minutos, intentar renovar
      if (timeUntilExpiry < 120) {
        const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
        if (error || !newSession) {
          toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          router.push('/login?next=/expenses');
          return false;
        }
      }
      return true;
    } catch (err) {
      toast.error('Error verificando tu sesión. Intenta nuevamente.');
      return false;
    }
  };

  const handleNewSupplierCreated = async (newSupplier: { id: string }) => {
    // Recargar la lista de proveedores
    try {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'ACTIVO')
        .order('name', { ascending: true });
      
      if (suppliersError) {
        toast.error('Error al cargar proveedores');
      } else {
        setSuppliers(suppliersData || []);
        // Seleccionar automáticamente el nuevo proveedor
        setExpenseForm(prev => ({ ...prev, supplier_id: newSupplier.id }));
        toast.success('Proveedor creado y seleccionado exitosamente');
      }
    } catch (error) {
      toast.error('Error al recargar proveedores');
    }
    
    // Cerrar el modal
    setIsNewSupplierModalOpen(false);
  };

  // Función para calcular rangos de fechas
  const getDateRange = (filter: string): { start: Date; end: Date } | null => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    switch (filter) {
      case 'this_month':
        return {
          start: new Date(currentYear, currentMonth, 1),
          end: new Date(currentYear, currentMonth + 1, 0)
        };
      case 'last_6_months':
        return {
          start: new Date(currentYear, currentMonth - 6, 1),
          end: now
        };
      case 'this_year':
        return {
          start: new Date(currentYear, 0, 1),
          end: new Date(currentYear, 11, 31)
        };
      case 'custom':
        if (startDate && endDate) {
          return {
            start: new Date(startDate),
            end: new Date(endDate)
          };
        }
        return null;
      default:
        return null;
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesProject = selectedProject === 'all' || expense.project_id === selectedProject;
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || 
                              expense.subcategory_direct === selectedSubcategory || 
                              expense.subcategory_indirect === selectedSubcategory;
    const matchesSupplier = selectedSupplier === 'all' || expense.supplier_id === selectedSupplier;

    const term = searchTerm.toLowerCase();
    const supplierName = suppliers.find(s => s.id === expense.supplier_id)?.name || '';
    const matchesSearch = expense.description.toLowerCase().includes(term) ||
                          supplierName.toLowerCase().includes(term);
    
    // Filtro de fecha
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        const expenseDate = new Date(expense.expense_date);
        matchesDate = expenseDate >= dateRange.start && expenseDate <= dateRange.end;
      }
    }
    
    return matchesProject && matchesCategory && matchesSubcategory && matchesSupplier && matchesSearch && matchesDate;
  });

  const projectSummary: ProjectSummary[] = projects.map(project => {
    const projectExpenses = filteredExpenses.filter(expense => expense.project_id === project.id);
    const total = projectExpenses.reduce((sum, expense) => {
      const exchangeRate = expense.exchange_rate_usd || 500;
      return sum + (expense.currency === 'CRC' ? expense.amount : expense.amount * exchangeRate);
    }, 0);
    const totalUSD = Math.round(projectExpenses.reduce((sum, expense) => {
      return sum + (expense.currency === 'USD' ? expense.amount : expense.amount / (expense.exchange_rate_usd || 500));
    }, 0) * 100) / 100;
    
    // Calcular porcentaje respecto al presupuesto del proyecto
    const projectBudget = project.presupuesto_final || project.presupuesto_inicial || project.budget || 0;
    const budgetUtilization = projectBudget > 0 ? (total / projectBudget) * 100 : 0;
    
    return {
      project_id: project.id,
      project_name: project.name,
      total,
      totalUSD,
      count: projectExpenses.length,
      percentage: budgetUtilization
    };
  }).filter(summary => summary.count > 0).sort((a, b) => b.total - a.total);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => {
    const exchangeRate = expense.exchange_rate_usd || 500;
    return sum + (expense.currency === 'CRC' ? expense.amount : expense.amount * exchangeRate);
  }, 0);
  const totalExpensesUSD = Math.round(filteredExpenses.reduce((sum, expense) => {
    return sum + (expense.currency === 'USD' ? expense.amount : expense.amount / (expense.exchange_rate_usd || 500));
  }, 0) * 100) / 100;
  const effectiveExchangeRate = totalExpensesUSD > 0 
     ? (totalExpenses / totalExpensesUSD)
     : 500;



  // Función optimizada para calcular totales por categoría
  const calculateCategoryTotals = (expenses: Expense[]) => {
    const totals: Record<ExpenseCategory, { total_crc: number; total_usd: number; count: number }> = {
      costos_directos: { total_crc: 0, total_usd: 0, count: 0 },
      costos_indirectos: { total_crc: 0, total_usd: 0, count: 0 },
      mano_obra: { total_crc: 0, total_usd: 0, count: 0 },
      administracion: { total_crc: 0, total_usd: 0, count: 0 },
      imprevistos: { total_crc: 0, total_usd: 0, count: 0 },
      gastos_administrativos: { total_crc: 0, total_usd: 0, count: 0 },
      utilidad: { total_crc: 0, total_usd: 0, count: 0 }
    };

    expenses.forEach(expense => {
      const category = expense.category;
      if (totals[category]) {
        totals[category].count++;
        
        const exchangeRate = expense.exchange_rate_usd || 500;
        
        if (expense.currency === 'USD') {
          totals[category].total_usd += expense.amount;
          totals[category].total_crc += expense.amount * exchangeRate;
        } else {
          totals[category].total_crc += expense.amount;
          totals[category].total_usd += expense.amount / exchangeRate;
        }
      }
    });

    return totals;
  };

  // Calcular totales de categorías para gastos filtrados
  const categoryTotals = calculateCategoryTotals(filteredExpenses);

  // Función para obtener los colores de las categorías
  const getCategoryColors = (categoryValue: string) => {
    const colorMap: Record<string, { color: string; bgColor: string; borderColor: string }> = {
      'costos_directos': {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      'costos_indirectos': {
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      'mano_obra': {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      'administracion': {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      'imprevistos': {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    };
    
    return colorMap[categoryValue] || {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  // Función para exportar gastos a Excel
  const exportToExcel = async () => {
    try {
      // Importar la librería de forma perezosa para evitar cargarla en SSR/initial render
      const XLSX = await import('xlsx');
      // Preparar los datos para exportar
      const dataToExport = filteredExpenses.map(expense => {
        const project = projects.find(p => p.id === expense.project_id);
        const supplier = suppliers.find(s => s.id === expense.supplier_id);
        const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
        
        // Obtener la subcategoría correcta según el tipo
        let subcategory = 'N/A';
        if (expense.subcategory_direct) {
          const directSubcat = DIRECT_COST_SUBCATEGORIES.find(sub => sub.value === expense.subcategory_direct);
          subcategory = directSubcat?.label || expense.subcategory_direct;
        } else if (expense.subcategory_indirect) {
          const indirectSubcat = INDIRECT_COST_SUBCATEGORIES.find(sub => sub.value === expense.subcategory_indirect);
          subcategory = indirectSubcat?.label || expense.subcategory_indirect;
        }
        
        // Calcular el tipo de cambio para mostrar ambas monedas
        const exchangeRate = expense.exchange_rate_usd || 500; // Usar el tipo de cambio real si está disponible
        const amountCRC = expense.currency === 'USD' ? expense.amount * exchangeRate : expense.amount;
        const amountUSD = expense.currency === 'CRC' ? expense.amount / exchangeRate : expense.amount;

        return {
          'Fecha': new Date(expense.expense_date).toLocaleDateString('es-CR'),
          'Proyecto': project?.name || 'N/A',
          'Descripción': expense.description,
          'Categoría': category?.label || expense.category,
          'Subcategoría': subcategory,
          'Proveedor': supplier?.name || 'N/A',
          'Referencia': expense.reference || 'N/A',
          'Monto Original': expense.amount.toLocaleString('es-CR', { 
            style: 'currency', 
            currency: expense.currency 
          }),
          'Moneda': expense.currency,
          'Tipo de Cambio USD': expense.exchange_rate_usd?.toFixed(2) || 'N/A',
          'Monto CRC': amountCRC.toLocaleString('es-CR', { 
            style: 'currency', 
            currency: 'CRC' 
          }),
          'Monto USD': amountUSD.toLocaleString('en-US', { 
            style: 'currency', 
            currency: 'USD' 
          }),
          'Adjunto de Factura': expense.receipt_url || 'Sin adjunto',
          'Adjunto de Referencia': expense.reference_attachment_url || 'Sin adjunto',
          'Notas': expense.notes || '',
          'Detalles': expense.details || ''
        };
      });

      // Crear el libro de trabajo
      const workbook = XLSX.utils.book_new();
      
      // Crear la hoja de trabajo con los datos
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 12 }, // Fecha
        { wch: 25 }, // Proyecto
        { wch: 30 }, // Descripción
        { wch: 20 }, // Categoría
        { wch: 20 }, // Subcategoría
        { wch: 25 }, // Proveedor
        { wch: 20 }, // Referencia
        { wch: 15 }, // Monto Original
        { wch: 8 },  // Moneda
        { wch: 15 }, // Tipo de Cambio USD
        { wch: 15 }, // Monto CRC
        { wch: 15 }, // Monto USD
        { wch: 35 }, // Adjunto de Factura
        { wch: 35 }, // Adjunto de Referencia
        { wch: 30 }, // Notas
        { wch: 30 }  // Detalles
      ];
      worksheet['!cols'] = columnWidths;

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');

      // Crear el nombre del archivo con la fecha actual y el nombre del proyecto
      const currentDate = new Date().toISOString().split('T')[0];
      let fileName = `gastos_${currentDate}`;
      
      // Si hay un proyecto específico seleccionado, agregarlo al nombre
      if (selectedProject !== 'all') {
        const selectedProjectData = projects.find(p => p.id === selectedProject);
        if (selectedProjectData) {
          // Limpiar el nombre del proyecto para uso en nombre de archivo
          const cleanProjectName = selectedProjectData.name
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales
            .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
            .substring(0, 30); // Limitar longitud
          fileName = `gastos_${cleanProjectName}_${currentDate}`;
        }
      }
      
      fileName += '.xlsx';

      // Descargar el archivo
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Archivo ${fileName} descargado exitosamente`);
    } catch (error) {
      toast.error('Error al exportar los datos a Excel');
    }
  };

  // Componente de resumen por categorías
  const CategorySummaryCard = () => {
    const categories = [
      {
        key: 'costos_directos' as const,
        label: 'Costos Directos',
        icon: Building2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      {
        key: 'costos_indirectos' as const,
        label: 'Costos Indirectos',
        icon: Calculator,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      {
        key: 'mano_obra' as const,
        label: 'Mano de Obra',
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      {
        key: 'administracion' as const,
        label: 'Administración',
        icon: FileText,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      {
        key: 'imprevistos' as const,
        label: 'Imprevistos',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    ];

    const totalGeneral = Object.values(categoryTotals).reduce((sum, cat) => ({
      total_crc: sum.total_crc + cat.total_crc,
      total_usd: sum.total_usd + cat.total_usd,
      count: sum.count + cat.count
    }), { total_crc: 0, total_usd: 0, count: 0 });

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumen de Gastos por Categoría
          </CardTitle>
          <CardDescription>
            Total de {totalGeneral.count} gastos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {categories.map(category => {
              const data = categoryTotals[category.key];
              const Icon = category.icon;
              
              return (
                <div
                  key={category.key}
                  className={`p-4 rounded-lg border-2 ${category.bgColor} ${category.borderColor} transition-all hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`h-5 w-5 ${category.color}`} />
                    <span className="text-sm font-medium text-gray-600">
                      {data.count} gastos
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {category.label}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">USD:</span>
                      <span className={`font-bold text-sm ${category.color}`}>
                        ${data.total_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">CRC:</span>
                      <span className="text-sm font-medium text-gray-700">
                        ₡{data.total_crc.toLocaleString('es-CR')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Total General */}
          <div className="border-t pt-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Total General</span>
                  <span className="text-sm text-gray-600">({totalGeneral.count} gastos)</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ${totalGeneral.total_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-600">
                    ₡{totalGeneral.total_crc.toLocaleString('es-CR')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando gastos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            <span className="sm:hidden">Gastos</span>
            <span className="hidden sm:inline">Gestión de Gastos</span>
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            <span className="sm:hidden">Control de gastos</span>
            <span className="hidden sm:inline">Control y seguimiento de gastos por proyecto</span>
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Agregar</span>
              <span className="hidden sm:inline">Agregar Gasto</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Gasto</DialogTitle>
              <DialogDescription>
                Registra un nuevo gasto para el proyecto seleccionado
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
              <div className="space-y-2">
                <Label htmlFor="project">Proyecto</Label>
                <Select
                  value={expenseForm.project_id}
                  onValueChange={(value) => setExpenseForm(prev => ({ ...prev, project_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value as ExpenseCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Subcategoría para Costos Directos */}
              {expenseForm.category === 'costos_directos' && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory_direct">Subcategoría Directa *</Label>
                  <Select 
                    value={expenseForm.subcategory_direct || ''} 
                    onValueChange={(value) => setExpenseForm(prev => ({ 
                      ...prev, 
                      subcategory_direct: value as 'subcontratos' | 'materiales' | 'otros',
                      subcategory_indirect: undefined 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una subcategoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECT_COST_SUBCATEGORIES.map(subcategory => (
                        <SelectItem key={subcategory.value} value={subcategory.value}>
                          {subcategory.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subcategoría para Costos Indirectos */}
              {expenseForm.category === 'costos_indirectos' && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory_indirect">Subcategoría Indirecta *</Label>
                  <Select 
                    value={expenseForm.subcategory_indirect || ''} 
                    onValueChange={(value) => setExpenseForm(prev => ({ 
                      ...prev, 
                      subcategory_indirect: value as 'cargas_sociales' | 'alquiler' | 'control_calidad' | 'servicios_basicos' | 'transporte' | 'polizas' | 'inspeccion_ingenieros' | 'viaticos' | 'garantias' | 'equipos' | 'otros',
                      subcategory_direct: undefined 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una subcategoría" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {INDIRECT_COST_SUBCATEGORIES.map(subcategory => (
                        <SelectItem key={subcategory.value} value={subcategory.value}>
                          {subcategory.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <TranslatableInput
                  id="description"
                  value={expenseForm.description}
                  onChange={(value) => setExpenseForm(prev => ({ ...prev, description: value }))}
                  placeholder="Descripción del gasto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={expenseForm.currency}
                  onValueChange={(value) => setExpenseForm(prev => ({ ...prev, currency: value as 'CRC' | 'USD' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRC">Colones (CRC)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchange_rate">Tipo de Cambio</Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  step="0.01"
                  value={expenseForm.exchange_rate}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, exchange_rate: e.target.value }))}
                  placeholder={expenseForm.currency === 'USD' ? "Ingrese tipo de cambio USD/CRC" : "Tipo de cambio CRC/USD"}
                  disabled={false}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="supplier">Proveedor</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewSupplierModalOpen(true)}
                    className="h-8 px-2"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Nuevo
                  </Button>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded="false" className="w-full justify-between">
                      {(() => {
                        const selected = suppliers.find(s => s.id === expenseForm.supplier_id);
                        return selected ? selected.name : (expenseForm.supplier_id === 'none' ? 'Sin proveedor' : 'Seleccionar proveedor');
                      })()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar proveedor por nombre..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => setExpenseForm(prev => ({ ...prev, supplier_id: 'none' }))}
                            value="none"
                          >
                            Sin proveedor
                          </CommandItem>
                          {suppliers.map(supplier => (
                            <CommandItem
                              key={supplier.id}
                              onSelect={() => setExpenseForm(prev => ({ ...prev, supplier_id: supplier.id }))}
                              value={supplier.name}
                            >
                              {supplier.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>


              <div className="space-y-2">
                <Label htmlFor="reference">Referencia</Label>
                <Input
                  id="reference"
                  value={expenseForm.reference}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Referencia del gasto"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="details">Detalles</Label>
                <Input
                  id="details"
                  value={expenseForm.details}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Detalles específicos del gasto"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Comprobante de Gasto</Label>
                <FileUpload
                  acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                  maxFileSize={5 * 1024 * 1024}
                  onFileUpload={async (file) => {
                    const result = await handleFileUpload(file);
                    return result;
                  }}
                  onFileRemove={handleFileRemove}
                  existingFile={expenseForm.receipt_url ? {
                    name: expenseForm.receipt_url.split('/').pop() || 'Comprobante de Gasto',
                    type: 'application/pdf',
                    size: 0,
                    url: expenseForm.receipt_url
                  } : undefined}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Comprobante de Referencia</Label>
                <FileUpload
                  acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                  maxFileSize={5 * 1024 * 1024}
                  onFileUpload={async (file) => {
                    const result = await handleReferenceFileUpload(file);
                    return result;
                  }}
                  onFileRemove={handleReferenceFileRemove}
                  existingFile={expenseForm.reference_attachment_url ? {
                    name: expenseForm.reference_attachment_name || 'Comprobante de Referencia',
                    type: expenseForm.reference_attachment_type || 'application/pdf',
                    size: expenseForm.reference_attachment_size ? parseInt(expenseForm.reference_attachment_size) : 0,
                    url: expenseForm.reference_attachment_url
                  } : undefined}
                />
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddExpense} disabled={
                  !expenseForm.project_id || 
                  !expenseForm.description || 
                  !expenseForm.amount ||
                  (expenseForm.category === 'costos_directos' && !expenseForm.subcategory_direct) ||
                  (expenseForm.category === 'costos_indirectos' && !expenseForm.subcategory_indirect)
                }>
                Agregar Gasto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Expense Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Editar Gasto</DialogTitle>
              <DialogDescription>
                Modifica los datos del gasto seleccionado
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
              <div className="space-y-2">
                <Label htmlFor="edit_project">Proyecto *</Label>
                <Select value={expenseForm.project_id} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, project_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_category">Categoría *</Label>
                <Select value={expenseForm.category} onValueChange={(value: ExpenseCategory) => setExpenseForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Subcategoría para Costos Directos */}
              {expenseForm.category === 'costos_directos' && (
                <div className="space-y-2">
                  <Label htmlFor="edit_subcategory_direct">Subcategoría Directa *</Label>
                  <Select 
                    value={expenseForm.subcategory_direct || ''} 
                    onValueChange={(value) => setExpenseForm(prev => ({ 
                      ...prev, 
                      subcategory_direct: value as 'subcontratos' | 'materiales' | 'otros',
                      subcategory_indirect: undefined 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una subcategoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECT_COST_SUBCATEGORIES.map(subcategory => (
                        <SelectItem key={subcategory.value} value={subcategory.value}>
                          {subcategory.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subcategoría para Costos Indirectos */}
              {expenseForm.category === 'costos_indirectos' && (
                <div className="space-y-2">
                  <Label htmlFor="edit_subcategory_indirect">Subcategoría Indirecta *</Label>
                  <Select 
                    value={expenseForm.subcategory_indirect || ''} 
                    onValueChange={(value) => setExpenseForm(prev => ({ 
                      ...prev, 
                      subcategory_indirect: value as 'cargas_sociales' | 'alquiler' | 'control_calidad' | 'servicios_basicos' | 'transporte' | 'polizas' | 'inspeccion_ingenieros' | 'viaticos' | 'garantias' | 'equipos' | 'otros',
                      subcategory_direct: undefined 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una subcategoría" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {INDIRECT_COST_SUBCATEGORIES.map(subcategory => (
                        <SelectItem key={subcategory.value} value={subcategory.value}>
                          {subcategory.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit_description">Descripción *</Label>
                <TranslatableInput
                  id="edit_description"
                  value={expenseForm.description}
                  onChange={(value) => setExpenseForm(prev => ({ ...prev, description: value }))}
                  placeholder="Descripción del gasto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_amount">Monto *</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_currency">Moneda</Label>
                <Select value={expenseForm.currency} onValueChange={(value: 'CRC' | 'USD') => setExpenseForm(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRC">Colones (CRC)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_exchange_rate">Tipo de Cambio</Label>
                <Input
                  id="edit_exchange_rate"
                  type="number"
                  step="0.01"
                  value={expenseForm.exchange_rate}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, exchange_rate: e.target.value }))}
                  placeholder={expenseForm.currency === 'USD' ? "Ingrese tipo de cambio USD/CRC" : "Tipo de cambio CRC/USD"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_date">Fecha *</Label>
                <Input
                  id="edit_date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit_supplier">Proveedor</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewSupplierModalOpen(true)}
                    className="h-8 px-2"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Nuevo
                  </Button>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded="false" className="w-full justify-between">
                      {(() => {
                        const selected = suppliers.find(s => s.id === expenseForm.supplier_id);
                        return selected ? `${selected.name} ${selected.supplier_type ? '- ' + selected.supplier_type : ''}` : (expenseForm.supplier_id === 'none' ? 'Sin proveedor' : 'Selecciona un proveedor');
                      })()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar proveedor por nombre..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => setExpenseForm(prev => ({ ...prev, supplier_id: 'none' }))}
                            value="none"
                          >
                            Sin proveedor
                          </CommandItem>
                          {suppliers.map(supplier => (
                            <CommandItem
                              key={supplier.id}
                              onSelect={() => setExpenseForm(prev => ({ ...prev, supplier_id: supplier.id }))}
                              value={supplier.name}
                            >
                              {supplier.name} {supplier.supplier_type ? `- ${supplier.supplier_type}` : ''}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_reference">Referencia</Label>
                <Input
                  id="edit_reference"
                  value={expenseForm.reference}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Referencia del gasto"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit_details">Detalles</Label>
                <Input
                  id="edit_details"
                  value={expenseForm.details}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Detalles específicos del gasto"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit_notes">Notas</Label>
                <Input
                  id="edit_notes"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Comprobante de Gasto</Label>
                <FileUpload
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                  maxFileSize={5 * 1024 * 1024}
                  existingFile={expenseForm.receipt_url ? (() => {
                    const url = expenseForm.receipt_url;
                    const fileName = url.split('/').pop() || 'Comprobante de Gasto';
                    const fileExtension = fileName.split('.').pop()?.toLowerCase();
                    let fileType = 'application/octet-stream';
                    
                    if (fileExtension === 'pdf') {
                      fileType = 'application/pdf';
                    } else if (['jpg', 'jpeg'].includes(fileExtension || '')) {
                      fileType = 'image/jpeg';
                    } else if (fileExtension === 'png') {
                      fileType = 'image/png';
                    }
                    
                    return {
                      name: decodeURIComponent(fileName),
                      type: fileType,
                      size: undefined,
                      url: url
                    };
                  })() : undefined}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Comprobante de Referencia</Label>
                <FileUpload
                  onFileUpload={handleReferenceFileUpload}
                  onFileRemove={handleReferenceFileRemove}
                  acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                  maxFileSize={5 * 1024 * 1024}
                  existingFile={expenseForm.reference_attachment_url ? {
                    name: expenseForm.reference_attachment_name || 'Comprobante de Referencia',
                    type: expenseForm.reference_attachment_type || 'application/pdf',
                    size: expenseForm.reference_attachment_size ? parseInt(expenseForm.reference_attachment_size) : 0,
                    url: expenseForm.reference_attachment_url
                  } : undefined}
                />
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateExpense} disabled={
                  !expenseForm.project_id || 
                  !expenseForm.description || 
                  !expenseForm.amount ||
                  (expenseForm.category === 'costos_directos' && !expenseForm.subcategory_direct) ||
                  (expenseForm.category === 'costos_indirectos' && !expenseForm.subcategory_indirect)
                }>
                Actualizar Gasto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              <span className="sm:hidden">Total</span>
              <span className="hidden sm:inline">Total Gastos</span>
            </CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="space-y-1">
              <div className="text-lg sm:text-xl font-bold">₡{totalExpenses.toLocaleString()}</div>
              <div className="text-base sm:text-lg font-semibold text-green-600">${totalExpensesUSD.toLocaleString()}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="sm:hidden">TC efectivo (sobre totales): ₡{effectiveExchangeRate.toLocaleString('es-CR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} por $1 • {filteredExpenses.length} gastos</span>
              <span className="hidden sm:inline">Effective FX (from totals): ₡{effectiveExchangeRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} per $1 • {filteredExpenses.length} expenses registered</span>
            </p>
          </CardContent>
        </Card>
        
        {projectSummary.slice(0, 3).map((summary, index) => {
          return (
            <Card key={summary.project_id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">{summary.project_name}</CardTitle>
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="space-y-1">
                  <div className="text-lg sm:text-xl font-bold">₡{summary.total.toLocaleString()}</div>
                  <div className="text-base sm:text-lg font-semibold text-green-600">${summary.totalUSD.toLocaleString()}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="sm:hidden">{summary.percentage.toFixed(1)}% • {summary.count}</span>
                  <span className="hidden sm:inline">{summary.percentage.toFixed(1)}% del presupuesto • {summary.count} gastos</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">
            <span className="sm:hidden">Filtros</span>
            <span className="hidden sm:inline">Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">
                  <span className="sm:hidden">Buscar</span>
                  <span className="hidden sm:inline">Search</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar gastos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Proyecto</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Categoría</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Subcategoría</Label>
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las subcategorías</SelectItem>
                    {selectedCategory === 'costos_directos' && DIRECT_COST_SUBCATEGORIES.map(subcategory => (
                      <SelectItem key={subcategory.value} value={subcategory.value}>
                        {subcategory.label}
                      </SelectItem>
                    ))}
                    {selectedCategory === 'costos_indirectos' && INDIRECT_COST_SUBCATEGORIES.map(subcategory => (
                      <SelectItem key={subcategory.value} value={subcategory.value}>
                        {subcategory.label}
                      </SelectItem>
                    ))}
                    {(selectedCategory === 'all' || (selectedCategory !== 'costos_directos' && selectedCategory !== 'costos_indirectos')) && (
                      <>
                        {DIRECT_COST_SUBCATEGORIES.map(subcategory => (
                          <SelectItem key={subcategory.value} value={subcategory.value}>
                            {subcategory.label}
                          </SelectItem>
                        ))}
                        {INDIRECT_COST_SUBCATEGORIES.map(subcategory => (
                          <SelectItem key={subcategory.value} value={subcategory.value}>
                            {subcategory.label}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Proveedor</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proveedores</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => {
                  setSelectedProject('all');
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                  setSelectedSupplier('all');
                  setSearchTerm('');
                  setDateFilter('all');
                  setStartDate('');
                  setEndDate('');
                }} className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="sm:hidden">Limpiar</span>
                  <span className="hidden sm:inline">Clear Filters</span>
                </Button>
              </div>
            </div>
            
            {/* Filtros de fecha */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="space-y-2">
                <Label>Filtro de Fecha</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fechas</SelectItem>
                    <SelectItem value="this_month">Este mes</SelectItem>
                    <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
                    <SelectItem value="this_year">Este año</SelectItem>
                    <SelectItem value="custom">Rango personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateFilter === 'custom' && (
                <div className="flex gap-2 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm text-gray-600">Desde</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm text-gray-600">Hasta</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Summary by Category */}
      <CategorySummaryCard />

      {/* Expenses Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                <span className="sm:hidden">Gastos</span>
                <span className="hidden sm:inline">Expense List</span>
              </CardTitle>
              <CardDescription className="text-sm">
                {filteredExpenses.length} 
                <span className="sm:hidden"> gastos encontrados</span>
                <span className="hidden sm:inline"> expenses found</span>
              </CardDescription>
            </div>
            {filteredExpenses.length > 0 && (
              <Button 
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Exportar Excel</span>
                <span className="hidden sm:inline">Export to Excel</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                <span className="sm:hidden">No hay gastos registrados</span>
                <span className="hidden sm:inline">No expenses registered</span>
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                <span className="sm:hidden">Comienza agregando el primer gasto</span>
                <span className="hidden sm:inline">Start by adding the first expense for this project</span>
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Agregar Gasto</span>
                <span className="hidden sm:inline">Add First Expense</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block sm:hidden space-y-4">
                {filteredExpenses.map((expense) => {
                  const project = projects.find(p => p.id === expense.project_id);
                  const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
                  const categoryColors = getCategoryColors(expense.category);
                  const supplier = suppliers.find(s => s.id === expense.supplier_id);
                  
                  return (
                    <Card key={expense.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{project?.name || 'Proyecto no encontrado'}</div>
                            <div className="text-xs text-gray-500">{expense.expense_date.split('-').reverse().join('/')}</div>
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${categoryColors.color} ${categoryColors.bgColor} ${categoryColors.borderColor}`}>
                            {category?.label}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>
                          )}
                        </div>
                        
                        {supplier?.name && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Proveedor:</span> {supplier.name}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <div className="text-right">
                            {expense.currency === 'USD' ? (
                              <>
                                <div className="text-green-600 font-medium">${expense.amount.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">
                                  ₡{(expense.amount * (expense.exchange_rate_usd || 500)).toLocaleString()}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-medium">₡{expense.amount.toLocaleString()}</div>
                                <div className="text-xs text-green-600">
                                  ${(expense.amount / (expense.exchange_rate_usd || 500)).toLocaleString()}
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            {expense.receipt_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(expense.receipt_url, '_blank')}
                                className="h-8 px-2 text-xs"
                              >
                                Gasto
                              </Button>
                            )}
                            {expense.reference_attachment_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(expense.reference_attachment_url, '_blank')}
                                className="h-8 px-2 text-xs"
                              >
                                Ref
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditExpense(expense)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Gasto</TableHead>
                      <TableHead className="text-center">Referencia</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {filteredExpenses.map((expense) => {
                  const project = projects.find(p => p.id === expense.project_id);
                  const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
                  const categoryColors = getCategoryColors(expense.category);
                  const supplier = suppliers.find(s => s.id === expense.supplier_id);
                  
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {expense.expense_date.split('-').reverse().join('/')}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{project?.name || 'Proyecto no encontrado'}</div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${categoryColors.color} ${categoryColors.bgColor} ${categoryColors.borderColor}`}>
                          {category?.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-sm text-gray-500">{expense.notes}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div className="space-y-1">
                          {expense.currency === 'USD' ? (
                            <>
                              <div className="text-green-600">${expense.amount.toLocaleString()}</div>
                              <div className="text-sm text-gray-500">
                                ₡{(expense.amount * (expense.exchange_rate_usd || 500)).toLocaleString()}
                              </div>
                            </>
                          ) : (
                            <>
                              <div>₡{expense.amount.toLocaleString()}</div>
                              <div className="text-sm text-green-600">
                                ${(expense.amount / (expense.exchange_rate_usd || 500)).toLocaleString()}
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {expense.receipt_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(expense.receipt_url, '_blank')}
                            className="h-8 px-3"
                          >
                            Ver gasto
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin gasto</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {expense.reference_attachment_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(expense.reference_attachment_url, '_blank')}
                            className="h-8 px-3"
                          >
                            Ver referencia
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin referencia</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear nuevo proveedor */}
      <NewSupplierModal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        onSupplierCreated={handleNewSupplierCreated}
      />
    </div>
  );
}