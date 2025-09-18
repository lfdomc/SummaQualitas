'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { withAuth } from '@/components/auth/withAuth';
import { UserRoleType } from '@/lib/types';

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email?: string;
  phone: string;
  address: string;
  tax_id: string;
  supplier_type: 'MATERIALES' | 'SERVICIOS' | 'EQUIPOS' | 'SUBCONTRATISTA';
  status: 'ACTIVO' | 'INACTIVO';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface SupplierForm {
  name: string;
  contact_person: string;
  email?: string;
  phone: string;
  address: string;
  tax_id: string;
  supplier_type: 'MATERIALES' | 'SERVICIOS' | 'EQUIPOS' | 'SUBCONTRATISTA';
  status: 'ACTIVO' | 'INACTIVO';
  notes: string;
}

const initialSupplierForm: SupplierForm = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  tax_id: '',
  supplier_type: 'MATERIALES',
  status: 'ACTIVO',
  notes: ''
};

const supplierTypeLabels = {
  MATERIALES: 'Materiales',
  SERVICIOS: 'Servicios',
  EQUIPOS: 'Equipos',
  SUBCONTRATISTA: 'Subcontratista'
};

const statusLabels = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo'
};

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(initialSupplierForm);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchTerm, filterType, filterStatus]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.tax_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'ALL' || supplier.supplier_type === filterType;
      const matchesStatus = filterStatus === 'ALL' || supplier.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
    
    setFilteredSuppliers(filtered);
  };

  const handleAddSupplier = async () => {
    try {
      if (!supplierForm.name || !supplierForm.contact_person) {
        toast.error('Por favor complete los campos obligatorios');
        return;
      }

      // Preparar los datos para insertar, asegurando que email sea null si está vacío
      const dataToInsert = {
        ...supplierForm,
        email: supplierForm.email?.trim() || null
      };

      const { data, error } = await supabase
        .from('suppliers')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST204') {
          toast.error('Error: La tabla suppliers no existe en la base de datos. Por favor, ejecute las migraciones desde el dashboard de Supabase.');
        } else {
          toast.error(`Error al agregar proveedor: ${error.message || error.details || 'Error desconocido'}`);
        }
        return;
      }

      setSuppliers(prev => [data, ...prev]);
      setSupplierForm(initialSupplierForm);
      setIsAddDialogOpen(false);
      toast.success('Proveedor agregado exitosamente');
    } catch (error) {
      console.error('Error adding supplier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al agregar proveedor: ${errorMessage}`);
    }
  };

  const handleEditSupplier = async () => {
    try {
      if (!supplierForm.name || !supplierForm.contact_person) {
        toast.error('Por favor complete los campos obligatorios');
        return;
      }
      
      if (!editingSupplierId) return;

      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierForm)
        .eq('id', editingSupplierId)
        .select()
        .single();

      if (error) throw error;

      setSuppliers(prev => prev.map(supplier => 
        supplier.id === editingSupplierId ? data : supplier
      ));
      setSupplierForm(initialSupplierForm);
      setIsEditDialogOpen(false);
      setEditingSupplierId(null);
      toast.success('Proveedor actualizado exitosamente');
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Error al actualizar proveedor');
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      // Verificar si el proveedor tiene gastos asociados
      const { data: supplierExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('id')
        .eq('supplier_id', supplierId)
        .limit(1);

      if (expensesError) {
        console.error('Error checking supplier expenses:', expensesError);
        toast.error('Error al verificar los gastos del proveedor');
        return;
      }

      // Si el proveedor tiene gastos asociados, no permitir la eliminación
      if (supplierExpenses && supplierExpenses.length > 0) {
        toast.error('No se puede borrar porque el proveedor tiene gastos en un proyecto');
        return;
      }

      // Primera confirmación
      if (!window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
        return;
      }

      // Segunda confirmación
      if (!window.confirm('Esta acción no se puede deshacer. ¿Realmente deseas continuar?')) {
        return;
      }

      // Tercera confirmación
      if (!window.confirm('ÚLTIMA CONFIRMACIÓN: ¿Eliminar definitivamente este proveedor?')) {
        return;
      }

      // Proceder con la eliminación
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;

      setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
      toast.success('Proveedor eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Error al eliminar proveedor');
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setSupplierForm({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email || '',
      phone: supplier.phone,
      address: supplier.address,
      tax_id: supplier.tax_id,
      supplier_type: supplier.supplier_type,
      status: supplier.status,
      notes: supplier.notes || ''
    });
    setEditingSupplierId(supplier.id);
    setIsEditDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'ACTIVO' ? 'default' : 'secondary';
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'MATERIALES': return 'default';
      case 'SERVICIOS': return 'secondary';
      case 'EQUIPOS': return 'outline';
      case 'SUBCONTRATISTA': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Cargando proveedores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Truck className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Gestión de Proveedores</h1>
            <p className="text-muted-foreground">Administra la información de tus proveedores</p>
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Empresa *</Label>
                <Input
                  id="name"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Persona de Contacto *</Label>
                <Input
                  id="contact_person"
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Nombre del contacto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="correo@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Número de teléfono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Cédula Jurídica</Label>
                <Input
                  id="tax_id"
                  value={supplierForm.tax_id}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, tax_id: e.target.value }))}
                  placeholder="Número de cédula jurídica"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_type">Tipo de Proveedor</Label>
                <Select value={supplierForm.supplier_type} onValueChange={(value: string) => setSupplierForm(prev => ({ ...prev, supplier_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATERIALES">Materiales</SelectItem>
                    <SelectItem value="SERVICIOS">Servicios</SelectItem>
                    <SelectItem value="EQUIPOS">Equipos</SelectItem>
                    <SelectItem value="SUBCONTRATISTA">Subcontratista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Dirección completa"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales sobre el proveedor"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddSupplier} disabled={!supplierForm.name || !supplierForm.contact_person}>
                Agregar Proveedor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre, contacto, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-type">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  <SelectItem value="MATERIALES">Materiales</SelectItem>
                  <SelectItem value="SERVICIOS">Servicios</SelectItem>
                  <SelectItem value="EQUIPOS">Equipos</SelectItem>
                  <SelectItem value="SUBCONTRATISTA">Subcontratista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-status">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('ALL');
                  setFilterStatus('ALL');
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Proveedores ({filteredSuppliers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No se encontraron proveedores</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{supplier.name}</div>
                        {supplier.address && (
                          <div className="text-sm text-muted-foreground flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[200px]">{supplier.address}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.contact_person}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(supplier.supplier_type)}>
                        {supplierTypeLabels[supplier.supplier_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(supplier.status)}>
                        {statusLabels[supplier.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {supplier.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {supplier.tax_id}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteSupplier(supplier.id);
                          }}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre de la Empresa *</Label>
              <Input
                id="edit-name"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del proveedor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact_person">Persona de Contacto *</Label>
              <Input
                id="edit-contact_person"
                value={supplierForm.contact_person}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, contact_person: e.target.value }))}
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (opcional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="correo@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Número de teléfono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tax_id">Cédula Jurídica</Label>
              <Input
                id="edit-tax_id"
                value={supplierForm.tax_id}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, tax_id: e.target.value }))}
                placeholder="Número de cédula jurídica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-supplier_type">Tipo de Proveedor</Label>
              <Select value={supplierForm.supplier_type} onValueChange={(value: string) => setSupplierForm(prev => ({ ...prev, supplier_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MATERIALES">Materiales</SelectItem>
                  <SelectItem value="SERVICIOS">Servicios</SelectItem>
                  <SelectItem value="EQUIPOS">Equipos</SelectItem>
                  <SelectItem value="SUBCONTRATISTA">Subcontratista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select value={supplierForm.status} onValueChange={(value: string) => setSupplierForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-address">Dirección</Label>
              <Input
                id="edit-address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales sobre el proveedor"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSupplier}>
              Actualizar Proveedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(SuppliersPage, ['gerencia', 'administrativo', 'cliente'] as UserRoleType[]);