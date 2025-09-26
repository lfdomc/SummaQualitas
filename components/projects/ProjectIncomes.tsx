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
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Calendar, Eye } from 'lucide-react';
import { incomeService } from '@/lib/supabase/database';
import type { Income, CreateIncomeData, UpdateIncomeData, ProjectIncomesSummary } from '@/lib/types';
import { INCOME_STATUSES, INCOME_CATEGORIES, mapIncomeCategory, mapIncomeStatus, reverseMapIncomeCategory, reverseMapIncomeStatus } from '@/types/database';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';
import { fileService } from '@/lib/services/fileService';

interface ProjectIncomesProps {
  projectId: string;
  clientId: string;
  projectName: string;
  canManage?: boolean;
}

interface IncomeWithRelations extends Income {
  client?: {
    id: string;
    name: string;
    email?: string;
  };
}

export default function ProjectIncomes({ projectId, clientId, projectName, canManage = true }: ProjectIncomesProps) {
  const [incomes, setIncomes] = useState<IncomeWithRelations[]>([]);
  const [summary, setSummary] = useState<ProjectIncomesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<IncomeWithRelations | null>(null);

  const [incomeForm, setIncomeForm] = useState<CreateIncomeData>({
    project_id: projectId,
    client_id: clientId,
    description: '',
    amount: 0,
    currency: 'CRC',
    received_date: new Date().toISOString().split('T')[0],
    payment_method: 'transferencia',
    category: 'pago_proyecto',
    status: 'pendiente',
    reference: '',
    notes: '',
    receipt_url: undefined
  });

  useEffect(() => {
    loadProjectIncomes();
  }, [projectId]);

  const loadProjectIncomes = async () => {
    try {
      setLoading(true);
      const [incomesData, summaryData] = await Promise.all([
        incomeService.getProjectIncomes(projectId),
        incomeService.getProjectIncomesSummary(projectId)
      ]);
      // Aplicar mapeo inverso para convertir categorías y status de español a inglés
      const mappedIncomes = incomesData.map(income => ({
        ...income,
        category: reverseMapIncomeCategory(income.category),
        status: reverseMapIncomeStatus(income.status)
      }));
      setIncomes(mappedIncomes);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading project incomes:', error);
      toast.error('Error al cargar los ingresos del proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncome = async () => {
    try {
      if (!incomeForm.description || !incomeForm.amount) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      const incomeData: CreateIncomeData = {
        ...incomeForm,
        amount: Number(incomeForm.amount),
        category: mapIncomeCategory(incomeForm.category),
        status: mapIncomeStatus(incomeForm.status),
        receipt_url: incomeForm.receipt_url
      };

      await incomeService.createIncome(incomeData);
      toast.success('Ingreso creado exitosamente');
      setIsAddDialogOpen(false);
      resetForm();
      loadProjectIncomes();
    } catch (error) {
      console.error('Error creating income:', error);
      toast.error('Error al crear el ingreso');
    }
  };

  const handleUpdateIncome = async () => {
    try {
      if (!selectedIncome || !incomeForm.description || !incomeForm.amount) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      const updateData = {
        description: incomeForm.description,
        amount: Number(incomeForm.amount),
        currency: incomeForm.currency,
        received_date: incomeForm.received_date,
        payment_method: incomeForm.payment_method,
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
      loadProjectIncomes();
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
      loadProjectIncomes();
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error('Error al eliminar el ingreso');
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
      payment_method: income.payment_method,
      category: income.category,
      status: income.status,
      reference: income.reference || '',
      notes: income.notes || '',
      receipt_url: income.receipt_url || undefined
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setIncomeForm({
      project_id: projectId,
      client_id: clientId,
      description: '',
      amount: 0,
      currency: 'CRC',
      received_date: new Date().toISOString().split('T')[0],
      payment_method: 'transferencia',
      category: 'pago_proyecto',
      status: 'pending',
      reference: '',
      notes: '',
      receipt_url: undefined
    });
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

  const formatCurrency = (amount: number, currency: string = 'CRC') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmado': return 'default';
      case 'pendiente': return 'secondary';
      case 'cancelado': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmado': return 'Confirmado';
      case 'pendiente': return 'Pendiente';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'pago_proyecto': return 'Pago de Proyecto';
      case 'anticipo': return 'Anticipo';
      case 'pago_final': return 'Pago Final';
      case 'pago_parcial': return 'Pago Parcial';
      case 'otros': return 'Otros';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-32">
          <div className="text-lg">Cargando ingresos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ingresos del Proyecto</h2>
          <p className="text-gray-600">{projectName}</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Ingreso
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.total_confirmed_amount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.total_incomes || 0} ingresos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.confirmed_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(summary?.total_pending_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos cancelados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Incomes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ingresos</CardTitle>
          <CardDescription>
            {incomes.length} ingresos registrados para este proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ingresos registrados</h3>
              <p className="text-gray-600 mb-4">Comienza agregando el primer ingreso para este proyecto</p>
              {canManage && (
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Ingreso
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  {canManage && <TableHead className="text-center">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((income) => (
                  <TableRow key={income.id}>
                     <TableCell>
                       {new Date(income.received_date).toLocaleDateString('es-ES')}
                     </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{income.description}</div>
                        {income.reference && (
                          <div className="text-sm text-gray-500">Ref: {income.reference}</div>
                        )}
                        {income.notes && (
                          <div className="text-sm text-gray-500 mt-1">{income.notes}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(income.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(income.amount, income.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(income.status)}>
                        {getStatusLabel(income.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {income.payment_method?.replace('_', ' ') || 'N/A'}
                    </TableCell>
                    {canManage && (
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
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Income Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Ingreso</DialogTitle>
            <DialogDescription>
              Registra un nuevo ingreso para el proyecto: {projectName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={incomeForm.status} onValueChange={(value) => setIncomeForm({ ...incomeForm, status: value as 'pending' | 'confirmed' | 'cancelled' })}>
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
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select value={incomeForm.currency} onValueChange={(value) => setIncomeForm({ ...incomeForm, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRC">CRC (Colones Costarricenses)</SelectItem>
                  <SelectItem value="USD">USD (Dólares)</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="payment_method">Método de Pago</Label>
              <Select value={incomeForm.payment_method} onValueChange={(value) => setIncomeForm({ ...incomeForm, payment_method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
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

            <div className="space-y-2 col-span-2">
              <Label>Adjunto</Label>
              <FileUpload
                onFileUpload={handleFileUpload}
                onFileRemove={() => setIncomeForm({
                  ...incomeForm,
                  receipt_url: undefined
                })}
                acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                maxFileSize={10 * 1024 * 1024}
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
        <DialogContent className="max-w-2xl">
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
              <Label htmlFor="edit_amount">Monto *</Label>
              <Input
                id="edit_amount"
                type="number"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_currency">Moneda</Label>
              <Select value={incomeForm.currency} onValueChange={(value) => setIncomeForm({ ...incomeForm, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRC">CRC (Colones Costarricenses)</SelectItem>
                  <SelectItem value="USD">USD (Dólares)</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="edit_payment_method">Método de Pago</Label>
              <Select value={incomeForm.payment_method} onValueChange={(value) => setIncomeForm({ ...incomeForm, payment_method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
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
              <Select value={incomeForm.status} onValueChange={(value: 'pending' | 'confirmed' | 'cancelled') => setIncomeForm({ ...incomeForm, status: value })}>
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

            <div className="space-y-2 col-span-2">
              <Label>Adjunto</Label>
              <FileUpload
                onFileUpload={handleFileUpload}
                onFileRemove={() => setIncomeForm({
                  ...incomeForm,
                  receipt_url: undefined
                })}
                acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                maxFileSize={10 * 1024 * 1024}
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