'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
// Usaremos el endpoint API para crear proveedores, que valida y mapea campos según la tabla real
// Esto evita desalineaciones de tipos entre lib/types y types/database
// import { SupplierService } from '@/lib/supabase/database';
import { toast } from 'sonner';
// Note: We only need the new supplier's id for the callback

interface NewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Callback expects minimal data (id) to avoid cross-type conflicts
  onSupplierCreated: (supplier: { id: string }) => void;
}

export function NewSupplierModal({ isOpen, onClose, onSupplierCreated }: NewSupplierModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    supplier_type: 'MATERIALES' as 'MATERIALES' | 'SERVICIOS' | 'EQUIPOS' | 'SUBCONTRATISTA',
    status: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del proveedor es requerido');
      return;
    }

    try {
      setLoading(true);
      // Construir payload alineado con la tabla 'suppliers'
      const payload = {
        name: formData.name.trim(),
        contact_person: formData.contact_person.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        tax_id: formData.tax_id.trim() || undefined,
        supplier_type: formData.supplier_type,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      };

      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error || 'Error al crear el proveedor';
        throw new Error(msg);
      }

      const newSupplier = json?.data as { id: string };
      toast.success('Proveedor creado exitosamente');
      
      // Resetear formulario
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
        supplier_type: 'MATERIALES' as 'MATERIALES' | 'SERVICIOS' | 'EQUIPOS' | 'SUBCONTRATISTA',
        status: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
        notes: ''
      });
      
      // Notificar al componente padre y cerrar modal
      if (newSupplier?.id) {
        onSupplierCreated({ id: newSupplier.id });
      }
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el proveedor';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    if (!loading) {
      // Resetear formulario al cerrar
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
        supplier_type: 'MATERIALES' as 'MATERIALES' | 'SERVICIOS' | 'EQUIPOS' | 'SUBCONTRATISTA',
        status: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
        notes: ''
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Nuevo Proveedor
          </DialogTitle>
          <DialogDescription>
            Completa los datos del nuevo proveedor. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información básica */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modal_name">Nombre del Proveedor *</Label>
              <Input
                id="modal_name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Constructora ABC S.A."
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modal_tax_id">RUC/NIT</Label>
              <Input
                id="modal_tax_id"
                value={formData.tax_id}
                onChange={(e) => handleInputChange('tax_id', e.target.value)}
                placeholder="Ej: 20123456789"
                disabled={loading}
              />
            </div>
          </div>

          {/* Información de contacto */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modal_contact_person">Persona de Contacto</Label>
              <Input
                id="modal_contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                placeholder="Ej: Juan Pérez"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modal_email">Email</Label>
              <Input
                id="modal_email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Ej: contacto@proveedor.com"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modal_phone">Teléfono</Label>
              <Input
                id="modal_phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Ej: +506 8888-8888"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modal_supplier_type">Tipo de Proveedor</Label>
              <Select 
                value={formData.supplier_type} 
                onValueChange={(value) => handleInputChange('supplier_type', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MATERIALES">Materiales</SelectItem>
                  <SelectItem value="SERVICIOS">Servicios</SelectItem>
                  <SelectItem value="EQUIPOS">Equipos</SelectItem>
                  <SelectItem value="SUBCONTRATISTA">Subcontratista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modal_status">Estado</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="modal_address">Dirección</Label>
            <Textarea
              id="modal_address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Ej: Av. Principal 123, San José, Costa Rica"
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="modal_notes">Notas</Label>
            <Textarea
              id="modal_notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Información adicional sobre el proveedor..."
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Proveedor'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}