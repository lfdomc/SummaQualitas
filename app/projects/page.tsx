'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  Plus, 
  Eye, 
  Edit, 
  Calendar, 
  MapPin,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useMobileState } from '@/hooks/useMobileState';
import { Project, Client } from '@/types/database';
import { ProjectStatus } from '@/lib/types';
import { toast } from 'sonner';
import { getActiveClients } from '@/lib/services/projectService.client';
import ClientForm from '@/components/clients/ClientForm';
import { ProjectService } from '@/lib/supabase/database';
import ProjectTableSkeleton from '@/components/projects/ProjectTableSkeleton';
import { createClient } from '@/lib/supabase/client';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const permissions = usePermissions();
  const { isMobile } = useMobileState();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [projectExpenses, setProjectExpenses] = useState<Record<string, number>>({});
  const projectsPerPage = 10;
  
  const debouncedSearchTerm = useDebounce(searchTerm, 800);
  const projectService = new ProjectService(); // Usar cliente normal para otras operaciones
  const supabase = createClient();



  // Cargar clientes
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getActiveClients();
        setClients(clientsData);
      } catch (error) {
        // Error loading clients
      }
    };

    // Cargar clientes independientemente del estado de autenticación
    loadClients();
  }, [user]);

  // Cargar proyectos con filtros optimizados
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        
        // Cargar proyectos con paginación
        const filters = {
           status: statusFilter !== 'all' ? [statusFilter as ProjectStatus] : undefined,
           client_id: clientFilter !== 'all' ? clientFilter : undefined,
           search: debouncedSearchTerm || undefined
         };
        
        // Usar API administrativa para obtener proyectos
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: projectsPerPage.toString(),
          ...(filters.status && filters.status.length > 0 && { status: filters.status[0] }),
          ...(filters.client_id && { client_id: filters.client_id }),
          ...(filters.search && { search: filters.search })
        });
        
        const url = `/api/projects/admin?${params}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const projectsResult = await response.json();
        
        const projectsData = projectsResult.data || [];
        
        // Los gastos ya vienen calculados desde la API optimizada
        setProjects(projectsData);
        setTotalProjects(projectsResult.total || 0);
        setTotalPages(projectsResult.total_pages || 0);
      } catch (error) {
        setProjects([]);
        toast.error('Error al cargar proyectos');
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [user, loading, debouncedSearchTerm, statusFilter, clientFilter, currentPage]);



  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, clientFilter]);

  // Función para obtener variante del badge de estado
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'planificacion':
        return 'outline';
      case 'en_progreso':
        return 'default';
      case 'pausado':
        return 'outline';
      case 'completado':
        return 'secondary';
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Función para obtener etiqueta del estado
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planificacion':
        return 'Planificación';
      case 'en_progreso':
        return 'En Progreso';
      case 'pausado':
        return 'Pausado';
      case 'completado':
        return 'Completado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Los proyectos ya vienen filtrados del servidor, no necesitamos filtrar aquí
  const filteredProjects = projects;



  const handleClientCreated = (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
  };

  // Calcular estadísticas
  const totalProjectsCount = totalProjects; // Usar el total del servidor, no el array local
  const activeProjects = projects.filter(p => p.status === 'en_progreso').length;

  const canCreateProjects = permissions.canCreateProjects;
  const canEditProjects = permissions.canEditProjects;

  if (loadingProjects) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando proyectos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Gestión de Proyectos</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base sm:mt-2">
            Administra todos los proyectos de construcción
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsCreateClientDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:hidden">Cliente</span>
            <span className="hidden sm:inline">Nuevo Cliente</span>
          </Button>
          <Button
            onClick={() => router.push('/projects/new')}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:hidden">Proyecto</span>
            <span className="hidden sm:inline">Nuevo Proyecto</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 sm:gap-6 sm:mb-8">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{totalProjectsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los proyectos registrados
            </p>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En desarrollo actualmente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="planificacion">Planificación</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="client" className="text-sm font-medium">Cliente</Label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Proyectos ({filteredProjects.length})</span>
            {loadingProjects && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProjects ? (
            <ProjectTableSkeleton rows={projectsPerPage} />
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 lg:py-12">
              <Building2 className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-gray-400 mb-3 lg:mb-4" />
              <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
              <p className="text-sm lg:text-base text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
                  ? 'No se encontraron proyectos con los filtros aplicados.'
                  : 'Comienza creando tu primer proyecto de construcción.'}
              </p>
              <Button 
                onClick={() => router.push('/projects/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="lg:hidden">Crear Proyecto</span>
                <span className="hidden lg:inline">Crear Primer Proyecto</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Vista móvil con tarjetas */}
              <div className="block lg:hidden">
                <div className="space-y-4">
                  {filteredProjects.map((project) => {
                    const client = project.client || clients.find(c => c.id === project.client_id);
                    const totalExpenses = (project as any)?.actualExpenses ?? (project as any)?.actual_expenses ?? 0;
                    const budgetValue = project.presupuesto_final ?? project.presupuesto_inicial ?? project.budget;
                    const progressPercentage = budgetValue && budgetValue > 0
                      ? Math.min(((totalExpenses || 0) / budgetValue) * 100, 100)
                      : 0;

                    return (
                      <Card key={project.id} className="border border-border/50 hover:border-border transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base text-gray-900 truncate leading-tight">{project.name}</h3>
                              <p className="text-sm text-gray-600 mt-1 truncate">
                                {client?.name || 'Cliente no encontrado'}
                              </p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs shrink-0">
                              {getStatusLabel(project.status)}
                            </Badge>
                          </div>

                          {project.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {project.description.length > 80
                                ? `${project.description.substring(0, 80)}...`
                                : project.description}
                            </p>
                          )}

                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{project.location}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <div className="flex items-center text-gray-500 mb-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span className="text-xs">Inicio</span>
                              </div>
                              <div className="font-medium text-gray-900">
                                {(() => {
                                  const startDate = project.estimated_start_date || project.actual_start_date || project.start_date;
                                  if (!startDate) return 'Sin definir';
                                  const dateObj = new Date(startDate);
                                  return isNaN(dateObj.getTime()) ? 'Fecha inválida' : dateObj.toLocaleDateString('es-ES');
                                })()}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center text-gray-500 mb-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span className="text-xs">Fin</span>
                              </div>
                              <div className="font-medium text-gray-900">
                                {(() => {
                                  const endDate = project.estimated_end_date || project.actual_end_date || project.end_date;
                                  if (!endDate) return 'Sin definir';
                                  const dateObj = new Date(endDate);
                                  return isNaN(dateObj.getTime()) ? 'Fecha inválida' : dateObj.toLocaleDateString('es-ES');
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="flex justify-between items-center text-sm mb-2">
                              <span className="text-gray-600">Presupuesto:</span>
                              <span className="font-medium">{formatCurrency(project.presupuesto_final || project.presupuesto_inicial || project.budget || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mb-2">
                              <span className="text-gray-600">Gastado:</span>
                              <span className="font-medium">{formatCurrency(totalExpenses)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Progreso:</span>
                              <span className="font-medium">
                                {progressPercentage < 1 && progressPercentage > 0 
                                  ? progressPercentage.toFixed(1) + '%'
                                  : progressPercentage.toFixed(0) + '%'
                                }
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/projects/${project.id}`)}
                              className="flex-1 text-xs"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/projects/${project.id}/edit`)}
                              className="flex-1 text-xs"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Vista desktop con tabla */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Proyecto</TableHead>
                        <TableHead className="min-w-[150px]">Cliente</TableHead>
                        <TableHead className="min-w-[100px]">Estado</TableHead>
                        <TableHead className="min-w-[180px]">Fechas</TableHead>
                        <TableHead className="min-w-[160px]">Presupuesto</TableHead>
                        <TableHead className="min-w-[140px]">Progreso</TableHead>
                        <TableHead className="text-right min-w-[120px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => {
                        const client = project.client || clients.find(c => c.id === project.client_id);
                        const totalExpenses = (project as any)?.actualExpenses ?? (project as any)?.actual_expenses ?? 0;
                        const budgetValue = project.presupuesto_final ?? project.presupuesto_inicial ?? project.budget;
                        const progressPercentage = budgetValue && budgetValue > 0
              ? Math.min(((totalExpenses || 0) / budgetValue) * 100, 100)
              : 0;

                        return (
                          <TableRow key={project.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <div className="font-medium">{project.name}</div>
                                <div className="text-sm text-gray-500">
                                  {project.description && project.description.length > 60
                                    ? `${project.description.substring(0, 60)}...`
                                    : project.description}
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {project.location}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {client?.name || 'Cliente no encontrado'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(project.status)}>
                                {getStatusLabel(project.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Inicio: {(() => {
                                    const startDate = project.estimated_start_date || project.actual_start_date || project.start_date;
                                    if (!startDate) return 'Sin definir';
                                    const dateObj = new Date(startDate);
                                    return isNaN(dateObj.getTime()) ? 'Fecha inválida' : dateObj.toLocaleDateString('es-ES');
                                  })()}
                                </div>
                                <div className="flex items-center mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Fin: {(() => {
                                    const endDate = project.estimated_end_date || project.actual_end_date || project.end_date;
                                    if (!endDate) return 'Sin definir';
                                    const dateObj = new Date(endDate);
                                    return isNaN(dateObj.getTime()) ? 'Fecha inválida' : dateObj.toLocaleDateString('es-ES');
                                  })()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  Presupuesto: {formatCurrency(project.presupuesto_final || project.presupuesto_inicial || project.budget || 0)}
                                </div>
                                <div className="text-gray-500">
                                  Gastado: {formatCurrency(totalExpenses)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="w-full">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="font-medium">
                                    {progressPercentage < 1 && progressPercentage > 0 
                                      ? progressPercentage.toFixed(1) + '%'
                                      : progressPercentage.toFixed(0) + '%'
                                    }
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/projects/${project.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/projects/${project.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
          
          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-t gap-4">
              <div className="text-sm text-gray-700 order-2 sm:order-1">
                <span className="hidden sm:inline">
                  Mostrando {((currentPage - 1) * projectsPerPage) + 1} a {Math.min(currentPage * projectsPerPage, totalProjects)} de {totalProjects} proyectos
                </span>
                <span className="sm:hidden text-xs text-center">
                  {((currentPage - 1) * projectsPerPage) + 1}-{Math.min(currentPage * projectsPerPage, totalProjects)} de {totalProjects}
                </span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>
                
                {/* Desktop pagination numbers */}
                <div className="hidden md:flex space-x-1">
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
                        className="px-3"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                {/* Mobile/Tablet pagination numbers */}
                <div className="flex md:hidden space-x-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="px-2 min-w-[32px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3"
                >
                  <span className="hidden sm:inline mr-1">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Client Creation Dialog */}
      <ClientForm
        isOpen={isCreateClientDialogOpen}
        onClose={() => setIsCreateClientDialogOpen(false)}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}