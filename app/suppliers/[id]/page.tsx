'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Building, Edit, Mail, Phone, MapPin, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { withAuth } from '@/components/auth/withAuth';
import { UserRoleType, Supplier } from '@/lib/types';
import { SupplierService } from '@/lib/supabase/database';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';

function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  const [loading, setLoading] = useState(true);


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
    } catch (error) {
      console.error('Error loading supplier:', error);
      toast.error('Error al cargar el proveedor');
    } finally {
      setLoading(false);
    }
  };



  const canEdit = profile?.role === 'gerencia';

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/suppliers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
            <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
              {supplier.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>
        {canEdit && (
          <Link href={`/suppliers/${supplier.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Supplier Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <p className="text-sm">{supplier.name}</p>
            </div>
            
            {supplier.tax_id && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">RUC/NIT</label>
                <p className="text-sm">{supplier.tax_id}</p>
              </div>
            )}
            
            {supplier.contact_name && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contacto</label>
                <p className="text-sm">{supplier.contact_name}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <div className="mt-1">
                <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                  {supplier.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{supplier.email}</p>
                </div>
              </div>
            )}
            
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                  <p className="text-sm">{supplier.phone}</p>
                </div>
              </div>
            )}
            
            {supplier.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                  <p className="text-sm">{supplier.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {supplier.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
          </CardContent>
        </Card>
      )}




    </div>
  );
}

export default withAuth(SupplierDetailPage, ['gerencia', 'administrativo', 'cliente'] as UserRoleType[]);