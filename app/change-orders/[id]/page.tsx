'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, CheckCircle, Trash2, FileText, Calendar, DollarSign, Clock, User, AlertTriangle, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import type { ChangeOrder } from '@/types/database';

interface ChangeOrderWithProject extends ChangeOrder {
  projects?: {
    id: string;
    name: string;
    presupuesto_original?: number;
    presupuesto_final?: number;
    estimated_start_date?: string;
    estimated_end_date?: string;
  };
}

export default function ChangeOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [changeOrder, setChangeOrder] = useState<ChangeOrderWithProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [implementing, setImplementing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState(false);

  const orderId = params.id as string;

  useEffect(() => {
    if (user && orderId) {
      fetchChangeOrder();
    }
  }, [user, orderId]);

  const fetchChangeOrder = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/change-orders/${orderId}`);
      const result = await response.json();
      
      if (result.success) {
        setChangeOrder(result.data);
      } else {
        toast.error(result.error || 'Error al cargar la orden de cambio');
        router.push('/change-orders');
      }
    } catch (error) {
      console.error('Error fetching change order:', error);
      toast.error('Error al cargar la orden de cambio');
      router.push('/change-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleImplementOrder = async () => {
    try {
      setImplementing(true);
      
      const response = await fetch(`/api/change-orders/${orderId}/implement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Orden de cambio implementada exitosamente');
        fetchChangeOrder(); // Refresh the data
      } else {
        toast.error(result.error || 'Error al implementar la orden de cambio');
      }
    } catch (error) {
      console.error('Error implementing change order:', error);
      toast.error('Error al implementar la orden de cambio');
    } finally {
      setImplementing(false);
    }
  };

  const handleApproveOrder = async () => {
    try {
      setApproving(true);
      
      const response = await fetch(`/api/change-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Orden de cambio aprobada exitosamente');
        fetchChangeOrder(); // Refresh the data
      } else {
        toast.error(result.error || 'Error al aprobar la orden de cambio');
      }
    } catch (error) {
      console.error('Error approving change order:', error);
      toast.error('Error al aprobar la orden de cambio');
    } finally {
      setApproving(false);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      setDeleting(true);
      
      const response = await fetch(`/api/change-orders/${orderId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Orden de cambio eliminada exitosamente');
        router.push('/change-orders');
      } else {
        toast.error(result.error || 'Error al eliminar la orden de cambio');
      }
    } catch (error) {
      console.error('Error deleting change order:', error);
      toast.error('Error al eliminar la orden de cambio');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', variant: 'secondary' as const },
      approved: { label: 'Aprobada', variant: 'default' as const },
      rejected: { label: 'Rechazada', variant: 'destructive' as const },
      implemented: { label: 'Implementada', variant: 'success' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      corrective: { label: 'Acción Correctiva', variant: 'destructive' as const },
      preventive: { label: 'Acción Preventiva', variant: 'secondary' as const },
      extra: { label: 'Extras', variant: 'default' as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.extra;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getImpactBadge = (impact: string) => {
    const impactConfig = {
      bajo: { label: 'Bajo', variant: 'secondary' as const },
      medio: { label: 'Medio', variant: 'default' as const },
      alto: { label: 'Alto', variant: 'destructive' as const },
      low: { label: 'Bajo', variant: 'secondary' as const },
      medium: { label: 'Medio', variant: 'default' as const },
      high: { label: 'Alto', variant: 'destructive' as const },
    };
    
    const config = impactConfig[impact as keyof typeof impactConfig] || impactConfig.medio;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando orden de cambio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!changeOrder) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Orden de cambio no encontrada</h1>
          <Link href="/change-orders">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Órdenes de Cambio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/change-orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{changeOrder.document_number}</h1>
            <p className="text-muted-foreground">
              Proyecto: {changeOrder.projects?.name || 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(changeOrder.status)}
          {changeOrder.status !== 'implemented' && changeOrder.status !== 'rejected' && (
            <Link href={`/change-orders/${orderId}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
          {changeOrder.status === 'pending_approval' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={approving} className="bg-green-600 hover:bg-green-700">
                  <Check className="mr-2 h-4 w-4" />
                  {approving ? 'Aprobando...' : 'Aprobar'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Aprobar Orden de Cambio</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Está seguro que desea aprobar esta orden de cambio? 
                    Una vez aprobada, podrá ser implementada en el proyecto.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApproveOrder} className="bg-green-600 hover:bg-green-700">
                    Aprobar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {changeOrder.status === 'approved' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={implementing}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {implementing ? 'Implementando...' : 'Implementar'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Implementar Orden de Cambio</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Está seguro que desea implementar esta orden de cambio? 
                    Esta acción aplicará los cambios al presupuesto y cronograma del proyecto.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleImplementOrder}>
                    Implementar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {changeOrder.status !== 'implemented' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar Orden de Cambio</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Está seguro que desea eliminar esta orden de cambio? 
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <div className="mt-1">
                    {getTypeBadge(changeOrder.change_type)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Diseñador</label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{changeOrder.designer || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="mt-1 text-sm">{changeOrder.description}</p>
              </div>
              
              {changeOrder.general_comments && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Comentarios</label>
                  <p className="mt-1 text-sm">{changeOrder.general_comments}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Impactos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Análisis de Impactos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Impacto en Costo</label>
                  <div className="mt-1">
                    {getImpactBadge(changeOrder.cost_impact_level || 'medio')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Impacto en Calidad</label>
                  <div className="mt-1">
                    {getImpactBadge(changeOrder.quality_impact_level || 'medio')}
                  </div>
                </div>
              </div>
              
              {changeOrder.schedule_comments && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Comentarios de Cronograma</label>
                  <p className="mt-1 text-sm">{changeOrder.schedule_comments}</p>
                </div>
              )}
              
              {changeOrder.risk_comments && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Comentarios de Riesgo</label>
                  <p className="mt-1 text-sm">{changeOrder.risk_comments}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Impacto Financiero */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Impacto Financiero
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  (changeOrder.cost_impact_crc || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(changeOrder.cost_impact_crc || 0) >= 0 ? '+' : ''}
                  {formatCurrency(changeOrder.cost_impact_crc || 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {(changeOrder.cost_impact_crc || 0) >= 0 ? 'Incremento' : 'Reducción'} del presupuesto
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Impacto en Cronograma */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Impacto en Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  (changeOrder.schedule_impact_days || 0) >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {(changeOrder.schedule_impact_days || 0) >= 0 ? '+' : ''}
                  {changeOrder.schedule_impact_days || 0} días
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {(changeOrder.schedule_impact_days || 0) >= 0 ? 'Retraso' : 'Adelanto'} en cronograma
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Creada</label>
                <p className="text-sm">{formatDate(changeOrder.created_at)}</p>
              </div>
              {changeOrder.updated_at && changeOrder.updated_at !== changeOrder.created_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actualizada</label>
                  <p className="text-sm">{formatDate(changeOrder.updated_at)}</p>
                </div>
              )}
              {changeOrder.implementation_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Implementada</label>
                  <p className="text-sm">{formatDate(changeOrder.implementation_date)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Proyecto */}
          {changeOrder.projects && (
            <Card>
              <CardHeader>
                <CardTitle>Proyecto Asociado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="text-sm font-medium">{changeOrder.projects.name}</p>
                </div>
                {changeOrder.projects.presupuesto_original && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Presupuesto Original</label>
                    <p className="text-sm">{formatCurrency(changeOrder.projects.presupuesto_original)}</p>
                  </div>
                )}
                {changeOrder.projects.presupuesto_original && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Presupuesto Final</label>
                    <p className="text-sm">{formatCurrency((changeOrder.projects.presupuesto_original || 0) + (changeOrder.cost_impact_crc || 0))}</p>
                  </div>
                )}
                <Link href={`/projects/${changeOrder.projects.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Ver Proyecto
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}