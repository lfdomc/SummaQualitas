'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Building, Save } from 'lucide-react';
import Link from 'next/link';
import { withAuth } from '@/components/auth/withAuth';
import { UserRoleType, Supplier } from '@/lib/types';
import { SupplierService } from '@/lib/supabase/database';
import { toast } from 'sonner';

function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    is_active: true,
    notes: ''
  });

  const supplierId = params.id as string;

  useEffect(() => {
    if (supplierId) {
      loadSupplier();
    }
  }, [supplierId]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      const supplierService = new SupplierService();
      const result = await supplierService.getSupplierById(supplierId);
      
      if (!result) {
        toast.error('Proveedor no encontrado');
        router.push('/suppliers');
        return;
      }
      
      setSupplier(result);
      setFormData({
        name: result.name || '',
        contact_name: result.contact_name || '',
        email: result.email || '',
        phone: result.phone || '',
        address: result.address || '',
        tax_id: result.tax_id || '',
        is_active: result.is_active ?? true,
        notes: result.notes || ''
      });
    } catch (error) {
      console.error('Error loading supplier:', error);
      toast.error('Error al cargar el proveedor');
      router.push('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del proveedor es requerido');
      return;
    }

    try {
      setSaving(true);
      const supplierService = new SupplierService();
      
      const updateData = {
        name: formData.name.trim(),
        contact_name: formData.contact_name.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        tax_id: formData.tax_id.trim() || null,
        is_active: formData.is_active,
        notes: formData.notes.trim() || null
      };

      await supplierService.updateSupplier(supplierId, updateData);
      toast.success('Proveedor actualizado exitosamente');
      router.push(`/suppliers/${supplierId}`);
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Error al actualizar el proveedor');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando proveedor...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-8">
        <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Proveedor no encontrado</h3>
        <p className="text-muted-foreground mb-4">
          El proveedor que buscas no existe o ha sido eliminado.
        </p>
        <Link href="/suppliers">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proveedores
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/suppliers/${supplierId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Editar Proveedor</h1>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Proveedor</CardTitle>
          <CardDescription>
            Actualiza los datos del proveedor: {supplier.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Proveedor *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Constructora ABC S.A."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tax_id">RUC/NIT</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleInputChange('tax_id', e.target.value)}
                  placeholder="Ej: 20123456789"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nombre de Contacto</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Ej: contacto@proveedor.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Ej: +51 999 888 777"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="is_active">Estado</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">
                    {formData.is_active ? 'Activo' : 'Inactivo'}
                  </Label>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Ej: Av. Principal 123, Lima, Perú"
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Información adicional sobre el proveedor..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Link href={`/suppliers/${supplierId}`}>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(EditSupplierPage, ['gerencia'] as UserRoleType[]);