'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/ui/file-upload';
import { Plus, Search, Filter, DollarSign, TrendingUp, TrendingDown, Calendar, Building2, Edit, Trash2 } from 'lucide-react';
import { ProjectService } from '@/lib/supabase/database';
import { Project, Expense, CreateExpenseData, Supplier, EXPENSE_CATEGORIES } from '@/types/database';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { uploadFile } from '@/lib/services/fileService';

type ExpenseCategory = 'costos_directos' | 'costos_indirectos' | 'gastos_administrativos' | 'mano_obra' | 'imprevistos';

interface ExpenseForm {
  project_id: string;
  category: ExpenseCategory;
  subcategory: string;
  description: string;
  amount: string;
  currency: 'CRC' | 'USD';
  exchange_rate: string;
  date: string;
  supplier_id: string;

  reference: string;
  details: string;
  notes: string;
  attachment_url: string;
  attachment_name: string;
  attachment_type: string;
  attachment_size: number;
}

interface ExpenseSummary {
  category: ExpenseCategory;
  total: number;
  totalUSD: number;
  count: number;
  percentage: number;
}

interface ProjectSummary {
  project_id: string;
  project_name: string;
  total: number;
  totalUSD: number;
  count: number;
  percentage: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({
    project_id: '',
    category: 'costos_directos',
    subcategory: '',
    description: '',
    amount: '',
    currency: 'CRC',
    exchange_rate: '',
    date: new Date().toISOString().split('T')[0],
    supplier_id: 'none',

    reference: '',
    details: '',
    notes: '',
    attachment_url: '',
    attachment_name: '',
    attachment_type: '',
    attachment_size: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  // Efecto para actualizar el tipo de cambio cuando se cambia la moneda a CRC
  useEffect(() => {
    const updateExchangeRateForCurrency = async () => {
      if (expenseForm.currency === 'CRC' && expenseForm.date && !expenseForm.exchange_rate) {
        try {
          const rate = await getExchangeRate(expenseForm.date);
          setExpenseForm(prev => ({ ...prev, exchange_rate: rate.toString() }));
        } catch (error) {
          console.error('Error updating exchange rate for currency change:', error);
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
        attachment_url: result.url,
        attachment_name: result.name,
        attachment_type: result.type,
        attachment_size: result.size
      }));
      toast.success('Archivo subido exitosamente');
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
      throw error;
    }
  };

  const handleFileRemove = () => {
    setExpenseForm(prev => ({
      ...prev,
      attachment_url: '',
      attachment_name: '',
      attachment_type: '',
      attachment_size: 0
    }));
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const projectService = new ProjectService();
      const projectsResponse = await projectService.getProjects();
      
      // Cargar proveedores
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'ACTIVO')
        .order('name', { ascending: true });
      
      if (suppliersError) {
        console.error('Error loading suppliers:', suppliersError);
        toast.error('Error al cargar proveedores');
      } else {
        setSuppliers(suppliersData || []);
      }
      
      setProjects(projectsResponse.data as Project[]);
      
      // Cargar gastos desde la base de datos
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (expensesError) {
        console.error('Error loading expenses:', expensesError);
        toast.error('Error al cargar los gastos');
      } else {
        setExpenses(expensesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
      const defaultRate = 520; // Tipo de cambio aproximado CRC/USD
      
      // Simulamos una pequeña variación basada en la fecha para hacer más realista
      const dateObj = new Date(date);
      const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const variation = (dayOfYear % 10) - 5; // Variación de -5 a +4
      
      return defaultRate + variation;
    } catch (error) {
      console.error('Error calculating exchange rate:', error);
      return 520; // Valor por defecto
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
        console.error('Error updating exchange rate:', error);
      }
    }
  };

  const handleAddExpense = async () => {
    try {
      // Convertir todo a colones para guardar en la base de datos
      const inputAmount = parseFloat(expenseForm.amount);
      const exchangeRate = parseFloat(expenseForm.exchange_rate) || 1;
      
      // Si es USD, convertir a colones; si es CRC, mantener el valor
      const amountInCRC = expenseForm.currency === 'USD' ? inputAmount * exchangeRate : inputAmount;
      const originalAmountUSD = expenseForm.currency === 'USD' ? inputAmount : inputAmount / exchangeRate;
      
      // Preparar datos para la base de datos (todo en colones)
      const expenseData: CreateExpenseData = {
        project_id: expenseForm.project_id,
        category: expenseForm.category,
        subcategory: expenseForm.subcategory || undefined,
        description: expenseForm.description,
        amount: amountInCRC, // Siempre en colones
        amount_usd: originalAmountUSD, // Valor original en USD para referencia
        currency: 'CRC', // Siempre guardar como CRC en la base
        exchange_rate: exchangeRate, // Siempre guardar el tipo de cambio usado
        date: expenseForm.date,
        supplier_id: expenseForm.supplier_id === 'none' ? undefined : expenseForm.supplier_id,
  
        reference: expenseForm.reference || undefined,
        details: expenseForm.details || undefined,
        notes: expenseForm.notes || undefined,
        attachment_url: expenseForm.attachment_url || undefined,
        attachment_name: expenseForm.attachment_name || undefined,
        attachment_type: expenseForm.attachment_type || undefined,
        attachment_size: expenseForm.attachment_size || undefined
      };
      
      // Guardar en la base de datos
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select('*')
        .single();
      
      if (error) {
        console.error('Error saving expense:', error);
        toast.error('Error al guardar el gasto en la base de datos');
        return;
      }
      
      // Actualizar la lista local
      setExpenses(prev => [...prev, data]);
      setIsAddDialogOpen(false);
      resetExpenseForm();
      toast.success('Gasto agregado exitosamente');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Error al agregar el gasto');
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      project_id: '',
      category: 'costos_directos',
      subcategory: '',
      description: '',
      amount: '',
      currency: 'CRC',
      exchange_rate: '',
      date: new Date().toISOString().split('T')[0],
      supplier_id: 'none',
  
      reference: '',
      details: '',
      notes: '',
      attachment_url: '',
      attachment_name: '',
      attachment_type: '',
      attachment_size: 0
    });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    
    // Determinar la moneda original y el monto original
    // Si amount_usd existe y es diferente del cálculo CRC/exchange_rate, fue ingresado en USD
    const exchangeRate = expense.exchange_rate || 1;
    const calculatedUSD = expense.amount / exchangeRate;
    const wasEnteredInUSD = expense.amount_usd && Math.abs(expense.amount_usd - calculatedUSD) > 0.01;
    
    const originalCurrency = wasEnteredInUSD ? 'USD' : 'CRC';
    const originalAmount = wasEnteredInUSD ? expense.amount_usd : expense.amount;
    
    setExpenseForm({
      project_id: expense.project_id,
      category: expense.category,
      subcategory: expense.subcategory || '',
      description: expense.description,
      amount: originalAmount?.toString() || expense.amount.toString(),
      currency: originalCurrency,
      exchange_rate: expense.exchange_rate?.toString() || '',
      date: expense.date,
      supplier_id: expense.supplier_id || 'none',

      reference: expense.reference || '',
      details: expense.details || '',
      notes: expense.notes || '',
      attachment_url: expense.attachment_url || '',
      attachment_name: expense.attachment_name || '',
      attachment_type: expense.attachment_type || '',
      attachment_size: expense.attachment_size || 0
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    
    try {
      // Convertir todo a colones para guardar en la base de datos
      const inputAmount = parseFloat(expenseForm.amount);
      const exchangeRate = parseFloat(expenseForm.exchange_rate) || 1;
      
      // Si es USD, convertir a colones; si es CRC, mantener el valor
      const amountInCRC = expenseForm.currency === 'USD' ? inputAmount * exchangeRate : inputAmount;
      const originalAmountUSD = expenseForm.currency === 'USD' ? inputAmount : inputAmount / exchangeRate;
      
      // Preparar datos para la actualización (todo en colones)
      const updateData = {
        project_id: expenseForm.project_id,
        category: expenseForm.category,
        subcategory: expenseForm.subcategory || null,
        description: expenseForm.description,
        amount: amountInCRC, // Siempre en colones
        amount_usd: originalAmountUSD, // Valor original en USD para referencia
        currency: 'CRC', // Siempre guardar como CRC en la base
        exchange_rate: exchangeRate, // Siempre guardar el tipo de cambio usado
        date: expenseForm.date,
        supplier_id: expenseForm.supplier_id === 'none' ? null : expenseForm.supplier_id,
  
        reference: expenseForm.reference || null,
        details: expenseForm.details || null,
        notes: expenseForm.notes || null,
        attachment_url: expenseForm.attachment_url || null,
        attachment_name: expenseForm.attachment_name || null,
        attachment_type: expenseForm.attachment_type || null,
        attachment_size: expenseForm.attachment_size || null
      };
      
      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', editingExpense.id)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error updating expense:', error);
        toast.error('Error al actualizar el gasto en la base de datos');
        return;
      }
      
      // Actualizar la lista local
      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? data : exp));
      setIsEditDialogOpen(false);
      setEditingExpense(null);
      resetExpenseForm();
      toast.success('Gasto actualizado exitosamente');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Error al actualizar el gasto');
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingExpense(null);
    resetExpenseForm();
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
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de fecha
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        const expenseDate = new Date(expense.date);
        matchesDate = expenseDate >= dateRange.start && expenseDate <= dateRange.end;
      }
    }
    
    return matchesProject && matchesCategory && matchesSearch && matchesDate;
  });

  const projectSummary: ProjectSummary[] = projects.map(project => {
    const projectExpenses = filteredExpenses.filter(expense => expense.project_id === project.id);
    const total = projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalUSD = Math.round(projectExpenses.reduce((sum, expense) => sum + (expense.amount_usd || 0), 0) * 100) / 100;
    
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

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalExpensesUSD = Math.round(filteredExpenses.reduce((sum, expense) => sum + (expense.amount_usd || 0), 0) * 100) / 100;

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Gastos</h1>
          <p className="text-gray-600 mt-1">Control y seguimiento de gastos por proyecto</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Gasto
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
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
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
                <Label htmlFor="supplier">Proveedor</Label>
                <Select value={expenseForm.supplier_id} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, supplier_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <FileUpload
                  title="Adjuntar Archivo"
                  description="Sube facturas, recibos o documentos relacionados (PDF, JPEG, PNG, JPG)"
                  acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                  maxSize={5 * 1024 * 1024}
                  onFileUpload={async (file) => {
                    const result = await handleFileUpload(file);
                    return result;
                  }}
                  onFileRemove={handleFileRemove}
                  currentFile={expenseForm.attachment_name ? {
                    name: expenseForm.attachment_name,
                    type: expenseForm.attachment_type,
                    size: expenseForm.attachment_size,
                    url: expenseForm.attachment_url
                  } : undefined}
                />
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddExpense} disabled={!expenseForm.project_id || !expenseForm.description || !expenseForm.amount}>
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
              <div className="space-y-2">
                <Label htmlFor="edit_subcategory">Subcategoría</Label>
                <Input
                  id="edit_subcategory"
                  value={expenseForm.subcategory}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, subcategory: e.target.value }))}
                  placeholder="Subcategoría específica"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Descripción *</Label>
                <Input
                  id="edit_description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
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
                <Label htmlFor="edit_supplier">Proveedor</Label>
                <Select value={expenseForm.supplier_id} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, supplier_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.supplier_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <FileUpload
                  label="Adjuntar Archivo"
                  description="Sube facturas, recibos o documentos relacionados (PDF, JPEG, PNG, JPG)"
                  acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                  maxSize={5 * 1024 * 1024}
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  currentFile={expenseForm.attachment_name ? {
                    name: expenseForm.attachment_name,
                    type: expenseForm.attachment_type,
                    size: expenseForm.attachment_size,
                    url: expenseForm.attachment_url
                  } : undefined}
                />
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateExpense} disabled={!expenseForm.project_id || !expenseForm.description || !expenseForm.amount}>
                Actualizar Gasto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-xl font-bold">₡{totalExpenses.toLocaleString()}</div>
              <div className="text-lg font-semibold text-green-600">${totalExpensesUSD.toLocaleString()}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} expenses registered
            </p>
          </CardContent>
        </Card>
        
        {projectSummary.slice(0, 3).map((summary, index) => {
          return (
            <Card key={summary.project_id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{summary.project_name}</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-xl font-bold">₡{summary.total.toLocaleString()}</div>
                  <div className="text-lg font-semibold text-green-600">${summary.totalUSD.toLocaleString()}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.percentage.toFixed(1)}% del presupuesto • {summary.count} gastos
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Proyecto</Label>
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
                <Label>Categoría</Label>
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
              <div className="flex items-end">
                <Button variant="outline" onClick={() => {
                  setSelectedProject('all');
                  setSelectedCategory('all');
                  setSearchTerm('');
                  setDateFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
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

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
          <CardDescription>
            {filteredExpenses.length} expenses found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses registered</h3>
              <p className="text-gray-600 mb-4">Start by adding the first expense for this project</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Expense
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => {
                  const project = projects.find(p => p.id === expense.project_id);
                  const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
                  
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {expense.date.split('-').reverse().join('/')}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{project?.name || 'Proyecto no encontrado'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {category?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-sm text-gray-500">{expense.notes}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.supplier?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div className="space-y-1">
                          {/* Siempre mostrar colones como principal (ya que todo se guarda en CRC) */}
                          <div>₡{expense.amount.toLocaleString()}</div>
                          {expense.amount_usd && (
                            <div className="text-sm text-green-600">${expense.amount_usd.toLocaleString()}</div>
                          )}
                        </div>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}