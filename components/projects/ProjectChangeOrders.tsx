'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, FileEdit, CheckCircle, Eye, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { ChangeOrder } from '@/types/database';

interface ProjectChangeOrdersProps {
  projectId: string;
  projectName?: string;
}

interface ChangeOrderWithProject extends ChangeOrder {
  projects?: {
    id: string;
    name: string;
    original_budget?: number;
    final_budget?: number;
  };
}

export default function ProjectChangeOrders({ projectId, projectName }: ProjectChangeOrdersProps) {
  const [changeOrders, setChangeOrders] = useState<ChangeOrderWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    implemented: 0,
    totalBudgetImpact: 0,
    totalScheduleImpact: 0
  });

  useEffect(() => {
    if (projectId) {
      fetchChangeOrders();
    }
  }, [projectId]);

  const fetchChangeOrders = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/change-orders?project_id=${projectId}`);
      const result = await response.json();
      
      if (result.success) {
        const orders = result.data || [];
        setChangeOrders(orders);
        
        // Calcular estadísticas
        const stats = orders.reduce((acc: { total: number; [key: string]: number }, order: ChangeOrderWithProject) => {
          acc.total++;
          acc[order.status]++;
          acc.totalBudgetImpact += order.cost_impact_crc || 0;
          acc.totalScheduleImpact += order.schedule_impact_days || 0;
          return acc;
        }, {
          total: 0,
          pending: 0,
          approved: 0,
          implemented: 0,
          rejected: 0,
          totalBudgetImpact: 0,
          totalScheduleImpact: 0
        });
        
        setStats(stats);
      } else {
        console.error('Error fetching change orders:', result.error);
        setChangeOrders([]);
      }
    } catch (error) {
      console.error('Error fetching change orders:', error);
      setChangeOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImplementOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/change-orders/${orderId}/implement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Orden de cambio implementada exitosamente');
        fetchChangeOrders(); // Refresh the data
      } else {
        toast.error(result.error || 'Error al implementar la orden de cambio');
      }
    } catch (error) {
      console.error('Error implementing change order:', error);
      toast.error('Error al implementar la orden de cambio');
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', variant: 'secondary' as const },
      aprobado: { label: 'Aprobada', variant: 'default' as const },
      rechazado: { label: 'Rechazada', variant: 'destructive' as const },
      implementado: { label: 'Implementada', variant: 'success' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      corrective: { label: 'Correctiva', variant: 'destructive' as const },
      preventive: { label: 'Preventiva', variant: 'secondary' as const },
      extra: { label: 'Extras', variant: 'default' as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.extra;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Órdenes de Cambio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                Órdenes de Cambio
              </CardTitle>
              <CardDescription>
                {projectName && `Proyecto: ${projectName}`}
              </CardDescription>
            </div>
            <Link href={`/change-orders/new?project_id=${projectId}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Orden
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.implemented}</div>
              <div className="text-sm text-muted-foreground">Implementadas</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className={`text-2xl font-bold ${
                stats.totalBudgetImpact >= 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {stats.totalBudgetImpact >= 0 ? '+' : ''}
                {formatCurrency(stats.totalBudgetImpact)}
              </div>
              <div className="text-sm text-muted-foreground">Impacto Total</div>
            </div>
          </div>

          {/* Tabla de órdenes de cambio */}
          {changeOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileEdit className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay órdenes de cambio</h3>
              <p className="text-muted-foreground mb-4">
                Este proyecto aún no tiene órdenes de cambio registradas.
              </p>
              <Link href={`/change-orders/new?project_id=${projectId}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Orden
                </Button>
              </Link>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Impacto Presupuesto</TableHead>
                    <TableHead>Cronograma</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changeOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.document_number}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(order.change_type)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={order.description}>
                          {order.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${
                          (order.cost_impact_crc || 0) >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {(order.cost_impact_crc || 0) >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {(order.cost_impact_crc || 0) >= 0 ? '+' : ''}
                            {formatCurrency(order.cost_impact_crc || 0)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${
                          (order.schedule_impact_days || 0) >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          <Calendar className="h-4 w-4" />
                          <span>
                            {(order.schedule_impact_days || 0) >= 0 ? '+' : ''}
                            {order.schedule_impact_days || 0} días
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/change-orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {order.status === 'approved' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="default" size="sm">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Implementar Orden de Cambio</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Está seguro que desea implementar la orden de cambio {order.document_number}? 
                                    Esta acción aplicará los cambios al presupuesto y cronograma del proyecto.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleImplementOrder(order.id)}>
                                    Implementar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}