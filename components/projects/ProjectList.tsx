'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { ProjectService } from '@/lib/supabase/database';
import { Project, ProjectStatus, ProjectFilters, PaginationParams } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  MapPin, 
  User, 
  DollarSign,
  Eye,
  Edit,
  Building2
} from 'lucide-react';
import Link from 'next/link';

interface ProjectListProps {
  clientId?: string;
  showActions?: boolean;
}

export default function ProjectList({ clientId, showActions = true }: ProjectListProps) {
  const { user, hasRole } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10
  });
  const [totalCount, setTotalCount] = useState(0);

  // Permissions using UserRoleType string literals
  const canCreateProjects = hasRole('gerencia');
  const canEditProjects = hasRole('gerencia') || hasRole('administrativo');
  const canDeleteProjects = hasRole('gerencia');

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
  
      
      const filters: ProjectFilters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? [statusFilter as ProjectStatus] : undefined,
        client_id: clientId || undefined
      };

      const projectServiceInstance = new ProjectService();
      const result = await projectServiceInstance.getProjects(filters, pagination);
      setProjects(result.data);
      setTotalCount(result.total);
    } catch (error) {
      console.warn('Error loading projects (connection issue):', error);
      // Solo mostrar error si no es un problema de conexión
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      if (!errorMessage.includes('net::ERR_ABORTED') && !errorMessage.includes('fetch')) {
        toast.error('Error al cargar los proyectos');
      }
      // Establecer datos vacíos en caso de error de conexión
      setProjects([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, pagination.page, clientId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);



  const getStatusBadge = useMemo(() => (status: ProjectStatus) => {
    const statusConfig: Record<ProjectStatus, { label: string; variant: 'success' | 'default' | 'outline' | 'destructive' }> = {
      planificacion: { label: 'Planificación', variant: 'outline' },
      en_progreso: { label: 'En progreso', variant: 'success' },
      pausado: { label: 'Pausado', variant: 'outline' },
      completado: { label: 'Completado', variant: 'default' },
      cancelado: { label: 'Cancelado', variant: 'destructive' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  }, []);

  const formatCurrency = useMemo(() => (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const formatDate = useMemo(() => (date?: string) => {
    if (!date) return 'Sin definir';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return dateObj.toLocaleDateString('es-ES');
  }, []);

  const totalPages = Math.ceil(totalCount / pagination.limit);

  if (loading && projects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Proyectos
          </h2>
          <p className="text-muted-foreground">
            {totalCount} proyecto{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreateProjects && showActions && (
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: ProjectStatus | 'all') => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'No se encontraron proyectos con los filtros aplicados'
                  : 'Aún no hay proyectos creados'}
              </p>
              {canCreateProjects && showActions && (
                <Link href="/projects/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Proyecto
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status)}
                    {showActions && (
                      <div className="flex gap-1">
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {canEditProjects && (
                          <Link href={`/projects/${project.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}

                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium">
                        {(() => {
                          const c: any = project.client;
                          if (Array.isArray(c)) {
                            return c[0]?.name ?? 'Sin asignar';
                          }
                          if (typeof c === 'object' && c !== null) {
                            return c.name ?? 'Sin asignar';
                          }
                          return typeof c === 'string' ? c : 'Sin asignar';
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Presupuesto:</span>
                      <div className="flex flex-col">
                        {(project.presupuesto_original || project.presupuesto_inicial) && project.presupuesto_final ? (
                          <>
                            <span className="font-medium text-green-600">{formatCurrency(project.presupuesto_final)}</span>
                            <span className="text-xs text-muted-foreground">Final (Inicial: {formatCurrency(project.presupuesto_original ?? project.presupuesto_inicial ?? 0)})</span>
                          </>
                        ) : (
                          <span className="font-medium">{formatCurrency((project.presupuesto_final || project.presupuesto_original || project.presupuesto_inicial || project.budget || 0))}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Inicio:</span>
                      <span className="font-medium">
                        {project.actual_start_date || project.estimated_start_date || project.start_date ? 
                          formatDate(project.actual_start_date || project.estimated_start_date || project.start_date) : 'Sin definir'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ubicación:</span>
                      <span className="font-medium">{project.location || 'Sin definir'}</span>
                    </div>
                  </div>

                  {/* Budget Breakdown Summary */}
                  {(project.costos_directos || project.costos_indirectos || project.mano_obra) && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Desglose Presupuestario:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {project.costos_directos && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Costos Directos: {formatCurrency(project.costos_directos)}</span>
                          </div>
                        )}
                        {project.costos_indirectos && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Costos Indirectos: {formatCurrency(project.costos_indirectos)}</span>
                          </div>
                        )}
                        {project.administracion && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>Administración: {formatCurrency(project.administracion)}</span>
                          </div>
                        )}
                        {project.mano_obra && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Mano de Obra: {formatCurrency(project.mano_obra)}</span>
                          </div>
                        )}
                        {project.imprevistos && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Imprevistos: {formatCurrency(project.imprevistos)}</span>
                          </div>
                        )}
                        {project.utilidad && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span>Utilidad: {formatCurrency(project.utilidad)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}