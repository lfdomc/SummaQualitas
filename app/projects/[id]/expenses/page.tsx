'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Project, Expense, Supplier, EXPENSE_CATEGORIES } from '@/types/database';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

interface CreateExpenseData {
  project_id: string;
  category: 'costos_directos' | 'costos_indirectos' | 'administracion' | 'mano_obra' | 'imprevistos';
  subcategory_direct?: string;
  subcategory_indirect?: string;
  description: string;
  amount: number;
  currency: 'CRC' | 'USD';
  exchange_rate_usd?: number;
  expense_date: string;
  supplier_id?: string;

  reference?: string;
  details?: string;
  notes?: string;
}

function ProjectExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const supabase = createClient();
  
  // Estado de autenticación
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Estado del formulario de gastos
  const [expenseForm, setExpenseForm] = useState<CreateExpenseData>({
    project_id: projectId,
    category: 'costos_directos',
    subcategory_direct: undefined,
    subcategory_indirect: undefined,
    description: '',
    amount: 0,
    currency: 'CRC',
    exchange_rate_usd: 500,
    expense_date: new Date().toISOString().split('T')[0],
    supplier_id: '',

    reference: '',
    details: '',
    notes: ''
  });

  // Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        setUser(user);
        setIsAuthenticated(!!user);
      } catch (error) {
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (projectId && isAuthenticated) {
      loadProjectData();
      loadExpenses();
      loadSuppliers();
    }
  }, [projectId, isAuthenticated]);

  const loadProjectData = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      toast.error('Error al cargar el proyecto');
      router.push('/projects');
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      toast.error('Error al cargar los gastos');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      // Error loading suppliers - handled silently
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      project_id: projectId,
      category: 'costos_directos',
      subcategory_direct: undefined,
      subcategory_indirect: undefined,
      description: '',
      amount: 0,
      currency: 'CRC',
      exchange_rate_usd: 500,
      expense_date: new Date().toISOString().split('T')[0],
      supplier_id: '',
  
      reference: '',
      details: '',
      notes: ''
    });
  };

  const handleAddExpense = async () => {
    try {
      if (!expenseForm.category || !expenseForm.description || expenseForm.amount <= 0) {
        toast.error('Por favor complete todos los campos requeridos');
        return;
      }

      const { error } = await supabase
        .from('expenses')
        .insert([expenseForm]);

      if (error) throw error;

      toast.success('Gasto agregado exitosamente');
      setIsAddDialogOpen(false);
      resetExpenseForm();
      loadExpenses();
    } catch (error) {
      toast.error('Error al agregar el gasto');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      project_id: expense.project_id,
      category: expense.category as CreateExpenseData['category'],
      subcategory_direct: expense.subcategory_direct || undefined,
      subcategory_indirect: expense.subcategory_indirect || undefined,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency as 'CRC' | 'USD',
      exchange_rate_usd: expense.exchange_rate_usd || 500,
      expense_date: expense.expense_date,
      supplier_id: expense.supplier_id || '',
  
      reference: expense.reference || '',
      details: expense.details || '',
      notes: expense.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateExpense = async () => {
    try {
      if (!editingExpense) return;

      if (!expenseForm.category || !expenseForm.description || expenseForm.amount <= 0) {
        toast.error('Por favor complete todos los campos requeridos');
        return;
      }

      const { error } = await supabase
        .from('expenses')
        .update(expenseForm)
        .eq('id', editingExpense.id);

      if (error) throw error;

      toast.success('Gasto actualizado exitosamente');
      setIsEditDialogOpen(false);
      setEditingExpense(null);
      resetExpenseForm();
      loadExpenses();
    } catch (error) {
      toast.error('Error al actualizar el gasto');
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingExpense(null);
    resetExpenseForm();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast.success('Gasto eliminado exitosamente');
      loadExpenses();
    } catch (error) {
      toast.error('Error al eliminar el gasto');
    }
  };

  // Filtrar gastos
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calcular totales
  const totalExpenses = filteredExpenses.reduce((sum, expense) => {
    return sum + (expense.currency === 'CRC' ? expense.amount : expense.amount * (expense.exchange_rate_usd || 500));
  }, 0);

  const totalUSD = filteredExpenses.reduce((sum, expense) => {
    return sum + (expense.currency === 'USD' ? expense.amount : expense.amount / (expense.exchange_rate_usd || 500));
  }, 0);

  // Calcular totales por categoría
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    const amount = expense.currency === 'CRC' ? expense.amount : expense.amount * (expense.exchange_rate_usd || 500);
    acc[expense.category] = (acc[expense.category] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

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

  const canEdit = isAuthenticated; // Simplificado para usar solo autenticación básica

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
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
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <Link href="/projects" className="hover:text-gray-700">
          Proyectos
        </Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-gray-700">
          {project?.name}
        </Link>
        <span>/</span>
        <span>Gastos</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gastos del Proyecto</h1>
          <p className="text-gray-600 mt-1">{project?.name}</p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/projects/${projectId}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Proyecto
            </Button>
          </Link>
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
                    Complete la información del gasto para el proyecto {project?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría *</Label>
                      <Select
                        value={expenseForm.category}
                        onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value as CreateExpenseData['category'], subcategory_direct: undefined, subcategory_indirect: undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subcategory">Subcategoría</Label>
                      <Input
                        id="subcategory"
                        value={
                          expenseForm.category === 'costos_directos'
                            ? (expenseForm.subcategory_direct ?? '')
                            : (expenseForm.subcategory_indirect ?? '')
                        }
                        onChange={(e) =>
                          setExpenseForm({
                            ...expenseForm,
                            ...(expenseForm.category === 'costos_directos'
                              ? { subcategory_direct: e.target.value || undefined }
                              : { subcategory_indirect: e.target.value || undefined }),
                          })
                        }
                        placeholder="Subcategoría opcional"
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
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Moneda</Label>
                      <Select
                        value={expenseForm.currency}
                        onValueChange={(value: 'CRC' | 'USD') => setExpenseForm({ ...expenseForm, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRC">CRC (₡)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exchange_rate_usd">Tipo de Cambio</Label>
                      <Input
                        id="exchange_rate_usd"
                        type="number"
                        step="0.01"
                        value={expenseForm.exchange_rate_usd}
                        onChange={(e) => setExpenseForm({ ...expenseForm, exchange_rate_usd: parseFloat(e.target.value) || 500 })}
                        placeholder="500.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expense_date">Fecha</Label>
                      <Input
                        id="expense_date"
                        type="date"
                        value={expenseForm.expense_date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                      />
                    </div>
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
                  <div className="grid grid-cols-2 gap-4">

                    <div className="space-y-2">
                      <Label htmlFor="reference">Referencia</Label>
                      <Input
                        id="reference"
                        value={expenseForm.reference}
                        onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
                        placeholder="Referencia interna"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="details">Detalles</Label>
                    <Textarea
                      id="details"
                      value={expenseForm.details}
                      onChange={(e) => setExpenseForm({ ...expenseForm, details: e.target.value })}
                      placeholder="Detalles adicionales del gasto"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                      placeholder="Notas internas"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddExpense}>
                    Agregar Gasto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-xl font-bold">{formatCurrency(totalExpenses)}</div>
              <div className="text-lg font-semibold text-green-600">{formatUSDCurrency(totalUSD)}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} expenses registered
            </p>
          </CardContent>
        </Card>

        {Object.entries(expensesByCategory).slice(0, 3).map(([category, amount]) => {
          const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.value === category);
          const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
          
          return (
            <Card key={category}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{categoryInfo?.label || category}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-xl font-bold">{formatCurrency(amount)}</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatUSDCurrency(amount / (project?.exchange_rate_usd || 500))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
Clear Filters
              </Button>
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
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Supplier</th>
                  <th className="text-right p-4">Amount</th>
                  {canEdit && <th className="text-center p-4">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
                  const supplier = suppliers.find(s => s.id === expense.supplier_id);
                  const supplierName = supplier?.name || '-';
                  
                  return (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        {new Date(expense.expense_date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {categoryInfo?.label || expense.category}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{expense.description}</div>
                        {expense.reference && (
                          <div className="text-sm text-gray-500">Ref: {expense.reference}</div>
                        )}
                      </td>
                      <td className="p-4">{supplierName}</td>
                      <td className="p-4 text-right font-medium">
                        <div className="space-y-1">
                          <div>
                            {expense.currency === 'CRC' 
                              ? formatCurrency(expense.amount)
                              : formatUSDCurrency(expense.amount)
                            }
                          </div>
                          {expense.currency === 'USD' && (
                            <div className="text-sm text-gray-500">
                              {formatCurrency(expense.amount * (expense.exchange_rate_usd || 500))}
                            </div>
                          )}
                          {expense.currency === 'CRC' && (
                            <div className="text-sm text-green-600">
                              {formatUSDCurrency(expense.amount / (expense.exchange_rate_usd || 500))}
                            </div>
                          )}
                        </div>
                      </td>
                      {canEdit && (
                        <td className="p-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('¿Está seguro de que desea eliminar este gasto?')) {
                                  handleDeleteExpense(expense.id);
                                }
                              }}
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
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value as CreateExpenseData['category'], subcategory_direct: undefined, subcategory_indirect: undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subcategory">Subcategoría</Label>
                <Input
                  id="edit-subcategory"
                  value={
                    expenseForm.category === 'costos_directos'
                      ? (expenseForm.subcategory_direct ?? '')
                      : (expenseForm.subcategory_indirect ?? '')
                  }
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      ...(expenseForm.category === 'costos_directos'
                        ? { subcategory_direct: e.target.value || undefined }
                        : { subcategory_indirect: e.target.value || undefined }),
                    })
                  }
                  placeholder="Subcategoría opcional"
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
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Monto *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency">Moneda</Label>
                <Select
                  value={expenseForm.currency}
                  onValueChange={(value: 'CRC' | 'USD') => setExpenseForm({ ...expenseForm, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRC">CRC (₡)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-exchange_rate_usd">Tipo de Cambio</Label>
                <Input
                  id="edit-exchange_rate_usd"
                  type="number"
                  step="0.01"
                  value={expenseForm.exchange_rate_usd}
                  onChange={(e) => setExpenseForm({ ...expenseForm, exchange_rate_usd: parseFloat(e.target.value) || 500 })}
                  placeholder="500.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expense_date">Fecha</Label>
                <Input
                  id="edit-expense_date"
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                />
              </div>
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
            <div className="grid grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label htmlFor="edit-reference">Referencia</Label>
                <Input
                  id="edit-reference"
                  value={expenseForm.reference}
                  onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
                  placeholder="Referencia interna"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-details">Detalles</Label>
              <Textarea
                id="edit-details"
                value={expenseForm.details}
                onChange={(e) => setExpenseForm({ ...expenseForm, details: e.target.value })}
                placeholder="Detalles adicionales del gasto"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                placeholder="Notas internas"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateExpense}>
              Actualizar Gasto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectExpensesPage;