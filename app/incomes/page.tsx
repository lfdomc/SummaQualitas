'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Calendar, Filter, Search } from 'lucide-react';
import { incomeService } from '@/lib/supabase/database';
import { projectService } from '@/lib/supabase/database';
import type { Income, CreateIncomeData, UpdateIncomeData, Project, Client } from '@/types/database';
import { INCOME_STATUSES, INCOME_CATEGORIES, mapIncomeCategory, mapIncomeStatus, reverseMapIncomeCategory, reverseMapIncomeStatus } from '@/types/database';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';
import { fileService } from '@/lib/services/fileService';

type IncomeWithRelations = Income & { project?: Project; client?: Client };

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<IncomeWithRelations[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<IncomeWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [incomeForm, setIncomeForm] = useState<CreateIncomeData>({
    project_id: '',
    client_id: '',
    description: '',
    amount: 0,
    currency: 'CRC', // Siempre se guardará en CRC
    received_date: new Date().toISOString().split('T')[0],
    category: 'payment', // Usar valores en inglés que acepta la BD
    status: 'pending',   // Usar valores en inglés que acepta la BD
    reference: '',
    notes: '',
    receipt_url: undefined
  });

  // Estado para el monto en USD que ingresa el usuario
  const [amountInUSD, setAmountInUSD] = useState<number>(0);

  // Estados para conversión de moneda
  const [exchangeRate, setExchangeRate] = useState<number>(520); // Tipo de cambio CRC/USD
  const [equivalentAmount, setEquivalentAmount] = useState<number>(0);
  const [isCalculatingExchange, setIsCalculatingExchange] = useState(false);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);

  useEffect(() => {
    loadData();
    fetchDailyExchangeRate();
  }, []);

  // useEffect para recalcular automáticamente cuando cambien amountInUSD o exchangeRate
  useEffect(() => {
    const amountInCRC = amountInUSD * exchangeRate;
    setEquivalentAmount(amountInCRC);
  }, [amountInUSD, exchangeRate]);

  // Función para obtener el tipo de cambio del día
  const fetchDailyExchangeRate = async () => {
    try {
      setIsLoadingExchangeRate(true);
      
      // Usar exchangerate-api que permite CORS
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (response.ok) {
        const data = await response.json();
        const crcRate = data.rates.CRC;
        if (crcRate) {
          setExchangeRate(crcRate);
          // El useEffect se encargará de recalcular automáticamente
          toast.success(`Tipo de cambio actualizado: ₡${crcRate.toFixed(2)} por USD`);
          return;
        }
      }
      
      // Si la API falla, intentar con otra API alternativa
      const fallbackResponse = await fetch('https://open.er-api.com/v6/latest/USD');
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const crcRate = fallbackData.rates.CRC;
        if (crcRate) {
          setExchangeRate(crcRate);
          // El useEffect se encargará de recalcular automáticamente
          toast.success(`Tipo de cambio actualizado: ₡${crcRate.toFixed(2)} por USD`);
          return;
        }
      }
      
      // Si ambas APIs fallan, mantener el valor por defecto
      toast.info('Usando tipo de cambio por defecto. Puedes actualizarlo manualmente.');
      
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast.info('No se pudo obtener el tipo de cambio automáticamente. Usando valor por defecto.');
    } finally {
      setIsLoadingExchangeRate(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando carga de datos...');
      
      const [incomesData, projectsData] = await Promise.all([
        incomeService.getIncomes(),
        projectService.getAllProjects()
      ]);
      
      console.log('📊 Datos cargados:', {
        incomesCount: incomesData?.length || 0,
        projectsCount: projectsData?.length || 0,
        projects: projectsData
      });
      
      // Convertir categorías y status de español (BD) a inglés (frontend)
      const mappedIncomes = incomesData.map(income => ({
        ...income,
        category: reverseMapIncomeCategory(income.category),
        status: reverseMapIncomeStatus(income.status)
      }));
      
      setIncomes(mappedIncomes);
      setProjects(projectsData);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast.error(`Error al cargar los datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncome = async () => {
    try {
      if (!incomeForm.project_id || !incomeForm.description || !amountInUSD || !exchangeRate || exchangeRate <= 0) {
        toast.error('Por favor completa todos los campos requeridos y asegúrate de que el tipo de cambio sea válido');
        return;
      }

      const selectedProject = projects.find(p => p.id === incomeForm.project_id);
      if (!selectedProject?.client_id) {
        toast.error('El proyecto seleccionado no tiene un cliente asignado');
        return;
      }

      // Convertir el monto de USD a CRC
      const amountInCRC = amountInUSD * exchangeRate;

      const incomeData: CreateIncomeData = {
        ...incomeForm,
        client_id: selectedProject.client_id,
        amount: Number(amountInCRC), // Guardar en colones
        currency: 'CRC', // Siempre guardar en CRC
        category: mapIncomeCategory(incomeForm.category || 'payment'), // Convertir a español para BD
        status: mapIncomeStatus(incomeForm.status || 'pending'),       // Convertir a español para BD
        receipt_url: incomeForm.receipt_url
      };


      
      await incomeService.createIncome(incomeData);
      toast.success('Ingreso creado exitosamente');
      setIsAddDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating income:', error);
      toast.error(`Error al crear el ingreso: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleUpdateIncome = async () => {
    try {
      if (!selectedIncome || !incomeForm.description || !incomeForm.amount || !exchangeRate || exchangeRate <= 0) {
        toast.error('Por favor completa todos los campos requeridos y asegúrate de que el tipo de cambio sea válido');
        return;
      }

      const updateData: UpdateIncomeData = {
        description: incomeForm.description,
        amount: Number(incomeForm.amount),
        currency: incomeForm.currency,
        received_date: incomeForm.received_date,
        category: mapIncomeCategory(incomeForm.category),
        status: mapIncomeStatus(incomeForm.status),
        reference: incomeForm.reference,
        notes: incomeForm.notes,
        receipt_url: incomeForm.receipt_url
      };

      await incomeService.updateIncome(selectedIncome.id, updateData);
      toast.success('Ingreso actualizado exitosamente');
      setIsEditDialogOpen(false);
      setSelectedIncome(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating income:', error);
      toast.error('Error al actualizar el ingreso');
    }
  };

  const handleDeleteIncome = async (income: IncomeWithRelations) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este ingreso?')) {
      return;
    }

    try {
      await incomeService.deleteIncome(income.id);
      toast.success('Ingreso eliminado exitosamente');
      loadData();
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error('Error al eliminar el ingreso');
    }
  };

  // Funciones para manejar la conversión de moneda
  const handleCurrencyChange = (currency: string) => {
    setIncomeForm({ ...incomeForm, currency });
    // No llamar calculateEquivalentAmount aquí para evitar conflictos con useEffect
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = Number(e.target.value);
    setAmountInUSD(amount);
    // El useEffect se encargará de recalcular automáticamente
  };

  const handleExchangeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = Number(e.target.value);
    setExchangeRate(rate);
    // El useEffect se encargará de recalcular automáticamente
  };

  const calculateEquivalentAmount = (amount: number, currency: string, rate?: number) => {
    const currentRate = rate || exchangeRate;
    if (currency === 'CRC') {
      // Convertir de CRC a USD
      setEquivalentAmount(amount / currentRate);
    } else {
      // Convertir de USD a CRC
      setEquivalentAmount(amount * currentRate);
    }
  };

  const handleEditIncome = (income: IncomeWithRelations) => {
    setSelectedIncome(income);
    setIncomeForm({
      project_id: income.project_id,
      client_id: income.client_id,
      description: income.description,
      amount: income.amount,
      currency: income.currency,
      received_date: income.received_date,
      category: income.category,
      status: income.status,
      reference: income.reference || '',
      notes: income.notes || '',
      receipt_url: income.receipt_url
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setIncomeForm({
      project_id: '',
      client_id: '',
      description: '',
      amount: 0,
      currency: 'CRC',
      received_date: new Date().toISOString().split('T')[0],
      category: 'payment',
      status: 'pending',
      reference: '',
      notes: '',
      receipt_url: undefined
    });
    setAmountInUSD(0);
    setEquivalentAmount(0);
    setExchangeRate(520);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const result = await fileService.uploadFile(file, 'income-attachments');
      setIncomeForm({
        ...incomeForm,
        receipt_url: result.url
      });
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
      throw error;
    }
  };

  // Comentado: useEffect conflictivo que causaba que equivalentAmount se resetee a 0
  // useEffect(() => {
  //   calculateEquivalentAmount(incomeForm.amount, incomeForm.currency);
  // }, [incomeForm.amount, incomeForm.currency, exchangeRate]);

  const formatCurrency = (amount: number, currency: string = 'CRC') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(amount);
  };

  const formatCurrencyUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const convertCRCToUSD = (amountCRC: number) => {
    return amountCRC / exchangeRate;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusObj = INCOME_STATUSES.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const getCategoryLabel = (category: string) => {
    const categoryObj = INCOME_CATEGORIES.find(c => c.value === category);
    return categoryObj ? categoryObj.label : category;
  };

  // Filtros
  const filteredIncomes = incomes.filter(income => {
    const matchesSearch = income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         income.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         income.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'all' || income.project_id === selectedProject;
    const matchesStatus = selectedStatus === 'all' || income.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || income.category === selectedCategory;
    
    return matchesSearch && matchesProject && matchesStatus && matchesCategory;
  });

  // Estadísticas - Convertir todos los montos a CRC
  const totalIncomes = filteredIncomes.reduce((sum, income) => {
    const amountInCRC = income.currency === 'USD' ? income.amount * exchangeRate : income.amount;
    return sum + amountInCRC;
  }, 0);
  const confirmedIncomes = filteredIncomes.filter(income => income.status === 'confirmed');
  const pendingIncomes = filteredIncomes.filter(income => income.status === 'pending');
  const totalConfirmed = confirmedIncomes.reduce((sum, income) => {
    const amountInCRC = income.currency === 'USD' ? income.amount * exchangeRate : income.amount;
    return sum + amountInCRC;
  }, 0);
  const totalPending = pendingIncomes.reduce((sum, income) => {
    const amountInCRC = income.currency === 'USD' ? income.amount * exchangeRate : income.amount;
    return sum + amountInCRC;
  }, 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando ingresos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Ingresos</h1>
          <p className="text-gray-600">Administra los ingresos de tus proyectos</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ingreso
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncomes)}</div>
            <div className="text-sm text-muted-foreground font-medium">
              {formatCurrencyUSD(convertCRCToUSD(totalIncomes))}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredIncomes.length} ingresos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalConfirmed)}</div>
            <div className="text-sm text-muted-foreground font-medium">
              {formatCurrencyUSD(convertCRCToUSD(totalConfirmed))}
            </div>
            <p className="text-xs text-muted-foreground">
              {confirmedIncomes.length} ingresos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
            <div className="text-sm text-muted-foreground font-medium">
              {formatCurrencyUSD(convertCRCToUSD(totalPending))}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingIncomes.length} ingresos pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Set(filteredIncomes.map(income => income.project_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
projects with income
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por descripción, proyecto o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-filter">Proyecto</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los proyectos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {INCOME_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-filter">Categoría</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {INCOME_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedProject('all');
                setSelectedStatus('all');
                setSelectedCategory('all');
              }}>
                <Filter className="h-4 w-4 mr-2" />
Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incomes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Income List</CardTitle>
          <CardDescription>
            {filteredIncomes.length} incomes found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIncomes.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No incomes registered</h3>
              <p className="text-gray-600 mb-4">Start by adding the first income for your projects</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add First Income
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>
                      {new Date(income.received_date).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {income.project?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {income.client?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{income.description}</div>
                        {income.reference && (
                          <div className="text-sm text-gray-500">Ref: {income.reference}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(income.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(income.amount, income.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {income.currency === 'USD' 
                          ? formatCurrency(income.amount * exchangeRate, 'CRC')
                          : formatCurrencyUSD(convertCRCToUSD(income.amount))
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(income.status)}>
                        {getStatusLabel(income.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditIncome(income)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteIncome(income)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Income Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Ingreso</DialogTitle>
            <DialogDescription>
              Registra un nuevo ingreso para un proyecto específico
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Proyecto *</Label>
              <Select value={incomeForm.project_id} onValueChange={(value) => setIncomeForm({ ...incomeForm, project_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    console.log('🎯 Renderizando proyectos en select:', projects);
                    return projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select value={incomeForm.category} onValueChange={(value) => setIncomeForm({ ...incomeForm, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Descripción *</Label>
              <Input
                id="description"
                value={incomeForm.description}
                onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                placeholder="Descripción del ingreso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda de Almacenamiento</Label>
              <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="text-sm font-medium text-blue-800">
                  CRC (Colones Costarricenses)
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Los ingresos siempre se guardan en colones
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="exchangeRate">Tipo de Cambio (CRC/USD)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchDailyExchangeRate}
                  disabled={isLoadingExchangeRate}
                  className="text-xs"
                >
                  {isLoadingExchangeRate ? 'Actualizando...' : 'Actualizar'}
                </Button>
              </div>
              <Input
                id="exchangeRate"
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={handleExchangeRateChange}
                onFocus={(e) => e.target.select()}
                placeholder="520.00"
                disabled={isLoadingExchangeRate}
              />
              <p className="text-xs text-gray-500">
                Tipo de cambio actual. Haz clic en "Actualizar" para obtener la tasa del día.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto en Dólares (USD) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amountInUSD === 0 ? '' : amountInUSD}
                  onChange={handleAmountChange}
                  onFocus={() => {
                    if (amountInUSD === 0) {
                      setAmountInUSD(0);
                    }
                  }}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-gray-500">
                Ingresa el monto en dólares. Se convertirá automáticamente a colones.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Monto que se Guardará (CRC)</Label>
              <div className="p-3 bg-green-50 rounded-md border border-green-200">
                <div className="text-lg font-semibold text-green-700">
                  ₡{equivalentAmount.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CRC
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Calculado con tipo de cambio: {exchangeRate.toLocaleString('es-CR', { minimumFractionDigits: 2 })} CRC por USD
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="received_date">Fecha de Ingreso</Label>
              <Input
                id="received_date"
                type="date"
                value={incomeForm.received_date}
                onChange={(e) => setIncomeForm({ ...incomeForm, received_date: e.target.value })}
              />
            </div>



            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={incomeForm.status} onValueChange={(value) => setIncomeForm({ ...incomeForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                value={incomeForm.reference}
                onChange={(e) => setIncomeForm({ ...incomeForm, reference: e.target.value })}
                placeholder="Número de referencia o factura"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={incomeForm.notes}
                onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                placeholder="Notas adicionales"
                rows={3}
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-2 col-span-2">
              <FileUpload
                label="Comprobante de Ingreso"
                description="Adjunta un PDF o imagen como comprobante de este ingreso"
                acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                maxSize={5 * 1024 * 1024} // 5MB
                onFileUpload={handleFileUpload}
                onFileRemove={() => {
                  setIncomeForm({
                    ...incomeForm,
                    receipt_url: undefined
                  });
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateIncome} className="bg-green-600 hover:bg-green-700">
              Crear Ingreso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Income Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ingreso</DialogTitle>
            <DialogDescription>
              Modifica los detalles del ingreso seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_description">Descripción *</Label>
              <Input
                id="edit_description"
                value={incomeForm.description}
                onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                placeholder="Descripción del ingreso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_currency">Moneda</Label>
              <Select value={incomeForm.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRC">CRC (Colones Costarricenses)</SelectItem>
                   <SelectItem value="USD">USD (Dólares Americanos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_exchangeRate">Tipo de Cambio (CRC/USD)</Label>
              <Input
                id="edit_exchangeRate"
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={handleExchangeRateChange}
                placeholder="520.00"
              />
              <p className="text-xs text-gray-500">
                Ingresa el tipo de cambio del día (cuántos colones por 1 dólar)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_amount">Monto *</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                value={incomeForm.amount === 0 ? '' : incomeForm.amount}
                onChange={handleAmountChange}
                onFocus={() => {
                  if (incomeForm.amount === 0) {
                    setIncomeForm({ ...incomeForm, amount: '' as any });
                  }
                }}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Equivalente en {incomeForm.currency === 'CRC' ? 'USD' : 'CRC'}</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="text-lg font-semibold text-green-600">
                  {incomeForm.currency === 'CRC' 
                     ? `$${equivalentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                     : `₡${equivalentAmount.toLocaleString('es-CR')} CRC`
                   }
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Calculado con tipo de cambio: {exchangeRate.toLocaleString('es-CR', { minimumFractionDigits: 2 })} CRC por USD
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_received_date">Fecha de Ingreso</Label>
              <Input
                id="edit_received_date"
                type="date"
                value={incomeForm.received_date}
                onChange={(e) => setIncomeForm({ ...incomeForm, received_date: e.target.value })}
              />
            </div>



            <div className="space-y-2">
              <Label htmlFor="edit_category">Categoría</Label>
              <Select value={incomeForm.category} onValueChange={(value) => setIncomeForm({ ...incomeForm, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_status">Estado</Label>
              <Select value={incomeForm.status} onValueChange={(value) => setIncomeForm({ ...incomeForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_reference">Referencia</Label>
              <Input
                id="edit_reference"
                value={incomeForm.reference}
                onChange={(e) => setIncomeForm({ ...incomeForm, reference: e.target.value })}
                placeholder="Número de referencia o factura"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_notes">Notas</Label>
              <Textarea
                id="edit_notes"
                value={incomeForm.notes}
                onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                placeholder="Notas adicionales"
                rows={3}
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-2 col-span-2">
              <FileUpload
                label="Comprobante de Ingreso"
                description="Adjunta un PDF o imagen como comprobante de este ingreso"
                acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                maxSize={5 * 1024 * 1024} // 5MB
                onFileUpload={handleFileUpload}
                onFileRemove={() => {
                  setIncomeForm({
                    ...incomeForm,
                    receipt_url: undefined
                  });
                }}
                existingFile={incomeForm.receipt_url ? {
                  name: 'Receipt',
                  url: incomeForm.receipt_url || '',
                  type: 'application/pdf',
                  size: 0
                } : undefined}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedIncome(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateIncome} className="bg-green-600 hover:bg-green-700">
              Actualizar Ingreso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}