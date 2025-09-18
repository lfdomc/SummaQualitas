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
import { Project, Client } from '@/types/database';
import { ProjectStatus } from '@/lib/types';
import { toast } from 'sonner';
import {
  getProjects, 
  deleteProject, 
  getActiveClients
} from '@/lib/services/projectService';
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
        console.error('Error loading clients:', error);
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
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'on_hold':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Función para obtener etiqueta del estado
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'completed':
        return 'Completado';
      case 'on_hold':
        return 'En Pausa';
      case 'cancelled':
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
  const activeProjects = projects.filter(p => p.status === 'active').length;

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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Proyectos</h1>
          <p className="text-gray-600 mt-2">
            Administra todos los proyectos de construcción
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsCreateClientDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
          <Button
            onClick={() => router.push('/projects/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjectsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="on_hold">En Pausa</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
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
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
                  ? 'No se encontraron proyectos con los filtros aplicados.'
                  : 'Comienza creando tu primer proyecto de construcción.'}
              </p>
              <Button onClick={() => router.push('/projects/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Proyecto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Presupuesto</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => {
                    const client = project.clients || clients.find(c => c.id === project.client_id);
                    const totalExpenses = projectExpenses[project.id] || 0;
                    const progressPercentage = totalExpenses && (project.presupuesto_final || project.presupuesto_inicial || project.budget)
          ? Math.min((totalExpenses / (project.presupuesto_final || project.presupuesto_inicial || project.budget)) * 100, 100)
          : 0;

                    return (
                      <TableRow key={project.id}>
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
                                const startDate = project.fecha_inicio || project.estimated_start_date || project.actual_start_date;
                                if (!startDate) return 'Sin definir';
                                const dateObj = new Date(startDate);
                                return isNaN(dateObj.getTime()) ? 'Fecha inválida' : dateObj.toLocaleDateString('es-ES');
                              })()}
                            </div>
                            <div className="flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              Fin: {(() => {
                                const endDate = project.fecha_fin || project.estimated_end_date || project.actual_end_date;
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
          )}
          
          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-700">
                Mostrando {((currentPage - 1) * projectsPerPage) + 1} a {Math.min(currentPage * projectsPerPage, totalProjects)} de {totalProjects} proyectos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
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
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
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