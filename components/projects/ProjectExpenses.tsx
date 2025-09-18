'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Project, Expense, Supplier, EXPENSE_CATEGORIES } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';
import { fileService } from '@/lib/services/fileService';
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Calendar
} from 'lucide-react';

interface CreateExpenseData {
  project_id: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
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

interface ProjectExpensesProps {
  project: Project;
  canEdit?: boolean;
  showHeader?: boolean;
}

export function ProjectExpenses({ project, canEdit = true, showHeader = true }: ProjectExpensesProps) {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Estado del formulario de gastos
  const [expenseForm, setExpenseForm] = useState<CreateExpenseData>({
    project_id: project.id,
    category: '',
    subcategory: '',
    description: '',
    amount: 0,
    currency: 'CRC',
    exchange_rate: 500,
    date: new Date().toISOString().split('T')[0],
    supplier_id: '',

    reference: '',
    details: '',
    notes: '',
    attachment_url: undefined,
    attachment_name: undefined,
    attachment_type: undefined,
    attachment_size: undefined
  });

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', project.id)
        .order('date', { ascending: false });

      if (error) throw error;
      
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Error al cargar los gastos');
    } finally {
      setLoading(false);
    }
  }, [project.id, supabase]);

  const loadSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  }, [supabase]);

  useEffect(() => {
    loadExpenses();
    loadSuppliers();
  }, [loadExpenses, loadSuppliers]);



  const handleCreateExpense = async () => {
    try {
      if (!expenseForm.category || !expenseForm.description || expenseForm.amount <= 0) {
        toast.error('Por favor complete todos los campos requeridos');
        return;
      }

      const expenseData = {
        ...expenseForm,
        supplier_id: expenseForm.supplier_id || null,
        subcategory: expenseForm.subcategory || null,
  
        reference: expenseForm.reference || null,
        details: expenseForm.details || null,
        notes: expenseForm.notes || null,
        attachment_url: expenseForm.attachment_url || null,
        attachment_name: expenseForm.attachment_name || null,
        attachment_type: expenseForm.attachment_type || null,
        attachment_size: expenseForm.attachment_size || null
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) {
        throw error;
      }
      toast.success('Gasto agregado exitosamente');
      setIsAddDialogOpen(false);
      resetForm();
      loadExpenses();
    } catch (error: unknown) {
      console.error('Error creating expense:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear el gasto');
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          category: expenseForm.category,
          subcategory: expenseForm.subcategory || null,
          description: expenseForm.description,
          amount: expenseForm.amount,
          currency: expenseForm.currency,
          exchange_rate: expenseForm.exchange_rate,
          date: expenseForm.date,
          supplier_id: expenseForm.supplier_id || null,
    
          reference: expenseForm.reference || null,
          details: expenseForm.details || null,
          notes: expenseForm.notes || null,
          attachment_url: expenseForm.attachment_url || null,
          attachment_name: expenseForm.attachment_name || null,
          attachment_type: expenseForm.attachment_type || null,
          attachment_size: expenseForm.attachment_size || null
        })
        .eq('id', editingExpense.id);

      if (error) throw error;

      toast.success('Gasto actualizado exitosamente');
      setIsEditDialogOpen(false);
      setEditingExpense(null);
      resetForm();
      loadExpenses();
    } catch (error: unknown) {
      console.error('Error updating expense:', error);
      toast.error('Error al actualizar el gasto');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este gasto?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast.success('Gasto eliminado exitosamente');
      loadExpenses();
    } catch (error: unknown) {
      console.error('Error deleting expense:', error);
      toast.error('Error al eliminar el gasto');
    }
  };

  const resetForm = () => {
    setExpenseForm({
      project_id: project.id,
      category: '',
      subcategory: '',
      description: '',
      amount: 0,
      currency: 'CRC',
      exchange_rate: 500,
      date: new Date().toISOString().split('T')[0],
      supplier_id: '',
  
      reference: '',
      details: '',
      notes: '',
      attachment_url: undefined,
      attachment_name: undefined,
      attachment_type: undefined,
      attachment_size: undefined
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      const result = await fileService.uploadFile(file, 'expense-attachments');
      setExpenseForm({
        ...expenseForm,
        attachment_url: result.url,
        attachment_name: result.name,
        attachment_type: result.type,
        attachment_size: result.size
      });
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
      throw error;
    }
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      project_id: expense.project_id,
      category: expense.category,
      subcategory: expense.subcategory || '',
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      exchange_rate: expense.exchange_rate || 500,
      date: expense.date,
      supplier_id: expense.supplier_id || '',
  
      reference: expense.reference || '',
      details: expense.details || '',
      notes: expense.notes || '',
      attachment_url: expense.attachment_url || undefined,
      attachment_name: expense.attachment_name || undefined,
      attachment_type: expense.attachment_type || undefined,
      attachment_size: expense.attachment_size || undefined
    });
    setIsEditDialogOpen(true);
  };

  // Filtrar gastos con useMemo para optimizar rendimiento
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (expense.reference && expense.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  // Calcular totales con useMemo
  const { totalExpenses, totalUSD, expensesByCategory } = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, expense) => {
      return sum + (expense.currency === 'CRC' ? expense.amount : expense.amount * (expense.exchange_rate || 500));
    }, 0);

    const totalUSD = filteredExpenses.reduce((sum, expense) => {
      return sum + (expense.currency === 'USD' ? expense.amount : expense.amount / (expense.exchange_rate || 500));
    }, 0);

    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      const amount = expense.currency === 'CRC' ? expense.amount : expense.amount * (expense.exchange_rate || 500);
      acc[expense.category] = (acc[expense.category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    return { totalExpenses, totalUSD, expensesByCategory };
  }, [filteredExpenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatUSDCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gastos del Proyecto</h2>
            <p className="text-gray-600 mt-1">{project.name}</p>
          </div>
          {canEdit && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Gasto</DialogTitle>
                  <DialogDescription>
                    Complete la información del gasto para el proyecto {project.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría *</Label>
                      <Select
                        value={expenseForm.category}
                        onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((category, index) => (
                            <SelectItem key={`add-category-${index}-${category.value}`} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción *</Label>
                    <Input
                      id="description"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="Descripción del gasto"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Moneda *</Label>
                      <Select
                        value={expenseForm.currency}
                        onValueChange={(value: 'CRC' | 'USD') => setExpenseForm({ ...expenseForm, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRC">CRC (Colones)</SelectItem>
                          <SelectItem value="USD">USD (Dólares)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {expenseForm.currency === 'USD' && (
                      <div className="space-y-2">
                        <Label htmlFor="exchange_rate">Tipo de Cambio</Label>
                        <Input
                          id="exchange_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={expenseForm.exchange_rate}
                      onChange={(e) => setExpenseForm({ ...expenseForm, exchange_rate: parseFloat(e.target.value) || 500 })}
                          placeholder="500"
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Proveedor</Label>
                      <Select
                        value={expenseForm.supplier_id}
                        onValueChange={(value) => setExpenseForm({ ...expenseForm, supplier_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin proveedor</SelectItem>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Referencia</Label>
                    <Input
                      id="reference"
                      value={expenseForm.reference}
                      onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
                      placeholder="Referencia del gasto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                      placeholder="Notas adicionales"
                      rows={3}
                    />
                  </div>
                  
                  {/* Componente de subida de archivos */}
                  <div className="space-y-2">
                    <Label>Adjunto (PDF/Imagen)</Label>
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      onFileRemove={() => {
                        setExpenseForm({
                          ...expenseForm,
                          attachment_url: undefined,
                          attachment_name: undefined,
                          attachment_type: undefined,
                          attachment_size: undefined
                        });
                      }}
                      acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                      maxFileSize={10 * 1024 * 1024} // 10MB
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateExpense} className="bg-blue-600 hover:bg-blue-700">
                    Agregar Gasto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} gastos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total USD</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatUSDCurrency(totalUSD)}</div>
            <p className="text-xs text-muted-foreground">
Equivalent in dollars
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(expensesByCategory).slice(0, 3).map(([category, amount], index) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                return (
                  <div key={`category-${index}-${category}`} className="flex justify-between text-sm">
                    <span className="truncate">{category}</span>
                    <span className="font-medium">{percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar gastos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-left py-2">Supplier</th>
                  {canEdit && <th className="text-center py-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const supplier = suppliers.find(s => s.id === expense.supplier_id);
                  return (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {new Date(expense.date).toLocaleDateString('es-CR')}
                        </div>
                      </td>
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          {expense.reference && (
                            <div className="text-sm text-gray-500">Ref: {expense.reference}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{expense.category}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="font-medium">
                          {expense.currency === 'CRC' 
                            ? formatCurrency(expense.amount)
                            : formatUSDCurrency(expense.amount)
                          }
                        </div>
                        {expense.currency === 'USD' && (
                          <div className="text-sm text-gray-500">
                            {formatCurrency(expense.amount * (expense.exchange_rate || 500))}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        {supplier ? supplier.name : '-'}
                      </td>
                      {canEdit && (
                        <td className="py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredExpenses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron gastos para este proyecto.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
            <DialogDescription>
              Modifique la información del gasto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría *</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category, index) => (
                      <SelectItem key={`edit-category-${index}-${category.value}`} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Fecha *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción *</Label>
              <Input
                id="edit-description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Descripción del gasto"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Monto *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency">Moneda *</Label>
                <Select
                  value={expenseForm.currency}
                  onValueChange={(value: 'CRC' | 'USD') => setExpenseForm({ ...expenseForm, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRC">CRC (Colones)</SelectItem>
                    <SelectItem value="USD">USD (Dólares)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {expenseForm.currency === 'USD' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-exchange-rate">Tipo de Cambio</Label>
                  <Input
                    id="edit-exchange-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseForm.exchange_rate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, exchange_rate: parseFloat(e.target.value) || 500 })}
                    placeholder="500"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-supplier">Proveedor</Label>
                <Select
                  value={expenseForm.supplier_id}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin proveedor</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reference">Referencia</Label>
              <Input
                id="edit-reference"
                value={expenseForm.reference}
                onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
                placeholder="Referencia del gasto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                placeholder="Notas adicionales"
                rows={3}
              />
            </div>
            
            {/* Componente de subida de archivos */}
            <div className="space-y-2">
              <Label>Adjunto (PDF/Imagen)</Label>
              <FileUpload
                onFileUpload={handleFileUpload}
                onFileRemove={() => {
                  setExpenseForm({
                    ...expenseForm,
                    attachment_url: undefined,
                    attachment_name: undefined,
                    attachment_type: undefined,
                    attachment_size: undefined
                  });
                }}
                acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                maxFileSize={10 * 1024 * 1024} // 10MB
                existingFile={expenseForm.attachment_name ? {
                  name: expenseForm.attachment_name,
                  url: expenseForm.attachment_url,
                  type: expenseForm.attachment_type,
                  size: expenseForm.attachment_size
                } : undefined}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateExpense} className="bg-blue-600 hover:bg-blue-700">
              Actualizar Gasto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}