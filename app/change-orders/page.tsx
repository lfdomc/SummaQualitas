'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FileEdit,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Coins,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useAuthWorking } from '@/lib/hooks/useAuthWorking';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ChangeOrder, Project } from '@/types/database';

export default function ChangeOrdersPage() {
  // Usando useAuthWorking para sincronización con sidebar
  const { user } = useAuthWorking();
  const searchParams = useSearchParams();
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const supabase = createClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Leer project_id de la URL al cargar la página
  useEffect(() => {
    const projectIdFromUrl = searchParams.get('project_id');
    if (projectIdFromUrl) {
      setSelectedProject(projectIdFromUrl);
    }
  }, [searchParams]);

  // Cargar proyectos una sola vez al inicio
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user) {
        setCurrentPage(1); // Reset page when search changes
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Cargar órdenes de cambio cuando cambian los filtros o la página
  useEffect(() => {
    if (user) {
      fetchChangeOrders();
    }
  }, [user, selectedStatus, selectedType, selectedProject, searchTerm, currentPage]);

  // Cleanup effect para cancelar solicitudes pendientes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    // Intentar cargar desde caché primero
    const cacheKey = `projects_${user.id}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    
    // Si hay datos en caché y no han pasado más de 5 minutos, usarlos
    if (cachedData && cacheTime) {
      const timeDiff = Date.now() - parseInt(cacheTime);
      if (timeDiff < 5 * 60 * 1000) { // 5 minutos
        setProjects(JSON.parse(cachedData));
        return;
      }
    }
    
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      
      const projectsData = data || [];
      setProjects(projectsData);
      
      // Guardar en caché
      localStorage.setItem(cacheKey, JSON.stringify(projectsData));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los proyectos",
        variant: "destructive",
      });
    } finally {
      setLoadingProjects(false);
    }
  }, [user, supabase, toast]);

  const fetchChangeOrders = useCallback(async () => {
    try {
      // Cancelar solicitud anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      
      // Construir parámetros de consulta con paginación
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedProject !== 'all') params.append('project_id', selectedProject);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage.toString());
      params.append('limit', '20'); // Reducir a 20 registros por página
      
      // Fetch change orders via API
      const response = await fetch(`/api/change-orders?${params.toString()}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setChangeOrders(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalRecords(result.pagination?.total || 0);
      } else {
        console.error('Error fetching change orders:', result.error);
        toast.error('Error al cargar las órdenes de cambio');
      }
    } catch (error: any) {
      // No mostrar error si la solicitud fue cancelada
      if (error.name !== 'AbortError') {
        console.error('Error fetching change orders:', error);
        toast.error('Error al cargar las órdenes de cambio');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedType, selectedProject, searchTerm, currentPage]);

  // Ya no necesitamos filtrado local porque se hace en el servidor
  const displayedChangeOrders = changeOrders;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', variant: 'secondary' as const },
      aprobado: { label: 'Aprobada', variant: 'default' as const },
      rechazado: { label: 'Rechazada', variant: 'destructive' as const },
      implementado: { label: 'Implementada', variant: 'default' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      accion_correctiva: { label: 'Acción Correctiva', variant: 'destructive' as const },
      accion_preventiva: { label: 'Acción Preventiva', variant: 'secondary' as const },
      extras: { label: 'Extras', variant: 'default' as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.accion_correctiva;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₡0';
    }
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT');
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando órdenes de cambio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Proyectos
              </Button>
            </Link>
          </div>
          
          <Link href="/change-orders/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden de Cambio
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <FileEdit className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Órdenes de Cambio</h1>
        </div>
        <p className="text-gray-600">
          Gestión de órdenes de cambio que afectan el presupuesto y cronograma de los proyectos
        </p>
      </div>

      {/* Stats Cards - Solo mostrar si hay proyecto seleccionado */}
      {selectedProject && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
              <FileEdit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRecords}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {projects.find(p => p.id === selectedProject)?.name}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayedChangeOrders.filter(o => o.status === 'pendiente').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impacto Positivo</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  displayedChangeOrders
                    .filter(o => (o.cost_impact_crc || 0) > 0)
                    .reduce((sum, o) => sum + (o.cost_impact_crc || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impacto Negativo</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  displayedChangeOrders
                    .filter(o => (o.cost_impact_crc || 0) < 0)
                    .reduce((sum, o) => sum + Math.abs(o.cost_impact_crc || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por número, descripción o diseñador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-base font-semibold">Seleccionar Proyecto *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="border-2 border-blue-200 focus:border-blue-500">
                  <SelectValue placeholder="Seleccione un proyecto para ver sus órdenes" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Tipo</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="correctiva">Acción Correctiva</SelectItem>
                  <SelectItem value="preventiva">Acción Preventiva</SelectItem>
                  <SelectItem value="extras">Extras</SelectItem>
                  <SelectItem value="corrective">Acción Correctiva</SelectItem>
                  <SelectItem value="preventive">Acción Preventiva</SelectItem>
                  <SelectItem value="extra">Extras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Estado</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aprobado">Aprobada</SelectItem>
                  <SelectItem value="rechazado">Rechazada</SelectItem>
                  <SelectItem value="implementado">Implementada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Órdenes de Cambio</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Cargando órdenes de cambio</h3>
              <p className="text-muted-foreground">
                {currentPage > 1 ? `Cargando página ${currentPage}...` : 'Obteniendo datos del servidor...'}
              </p>
            </div>
          ) : !selectedProject ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Seleccione un Proyecto</h3>
              <p className="text-muted-foreground mb-4">
                Para ver las órdenes de cambio, primero debe seleccionar un proyecto específico en el filtro de arriba.
              </p>
              <p className="text-sm text-blue-600">
                Esta vista muestra las órdenes de un proyecto a la vez para una mejor organización.
              </p>
            </div>
          ) : displayedChangeOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay órdenes de cambio</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                  ? `No se encontraron órdenes para el proyecto "${projects.find(p => p.id === selectedProject)?.name}" con los filtros aplicados`
                  : `Aún no hay órdenes de cambio para el proyecto "${projects.find(p => p.id === selectedProject)?.name}"`}
              </p>
              <Link href="/change-orders/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Orden
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Diseñador</TableHead>
                  <TableHead>Impacto Presupuesto</TableHead>
                  <TableHead>Impacto Días</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedChangeOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link 
                        href={`/change-orders/${order.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {order.document_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {order.projects?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(order.change_type)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {order.description}
                    </TableCell>
                    <TableCell>{order.designer}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${
                        (order.cost_impact_crc || 0) > 0 ? 'text-green-600' : 
                        (order.cost_impact_crc || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(order.cost_impact_crc || 0) > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (order.cost_impact_crc || 0) < 0 ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <Coins className="h-4 w-4" />
                        )}
                        {formatCurrency(Math.abs(order.cost_impact_crc || 0))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${
                        (order.schedule_impact_days || 0) > 0 ? 'text-red-600' : 
                        (order.schedule_impact_days || 0) < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {(order.schedule_impact_days || 0) > 0 ? '+' : ''}{order.schedule_impact_days || 0} días
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
                        {order.status === 'aprobado' && (
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
          )}
          
          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * 20) + 1} a {Math.min(currentPage * 20, totalRecords)} de {totalRecords} resultados
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}