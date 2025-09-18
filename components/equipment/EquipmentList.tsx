'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { projectService, equipmentService } from '@/lib/supabase/database';
import { Equipment, Project, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  Wrench,
  Truck,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  MapPin,
  Settings,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { EquipmentForm } from './EquipmentForm';

interface EquipmentListProps {
  projectId?: string;
  showActions?: boolean;
}

export default function EquipmentList({ projectId, showActions = true }: EquipmentListProps) {
  const { profile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'disponible' | 'en_uso' | 'mantenimiento' | 'fuera_servicio'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const canCreateEquipment = profile?.role === 'gerencia' || profile?.role === 'administrativo';
  const canEditEquipment = profile?.role === 'gerencia' || profile?.role === 'administrativo';
  const canDeleteEquipment = profile?.role === 'gerencia';

  useEffect(() => {
    loadEquipment();
    if (!projectId) {
      loadProjects();
    }
  }, [projectId]);

  useEffect(() => {
    filterEquipment();
  }, [searchTerm, statusFilter, typeFilter, locationFilter]);

  const loadEquipment = async () => {
    try {
      setLoading(true);

      let equipmentData: Equipment[];
      
      if (projectId) {
        equipmentData = await equipmentService.getProjectEquipment(projectId);
      } else {
        equipmentData = await equipmentService.getAllEquipment();
      }
      
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Error loading equipment:', error);
      toast.error('Error al cargar los equipos');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
  
      const projectData = await projectService.getProjects();
      setProjects(projectData.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const filterEquipment = () => {
    // This would be implemented with proper filtering logic
    // For now, we'll keep the original equipment
  };

  const handleEdit = (equipmentItem: Equipment) => {
    setEditingEquipment(equipmentItem);
    setIsDialogOpen(true);
  };

  const handleDelete = async (equipmentId: string) => {
    try {

      await equipmentService.deleteEquipment(equipmentId);
      toast.success('Equipo eliminado exitosamente');
      await loadEquipment();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast.error('Error al eliminar el equipo');
    }
  };

  const handleStatusChange = async (equipmentId: string, newStatus: string) => {
    try {
  
      await equipmentService.updateEquipmentStatus(equipmentId, newStatus);
      toast.success('Estado del equipo actualizado');
      await loadEquipment();
    } catch (error) {
      console.error('Error updating equipment status:', error);
      toast.error('Error al actualizar el estado del equipo');
    }
  };

  const handleEquipmentSaved = () => {
    setIsDialogOpen(false);
    setEditingEquipment(null);
    loadEquipment();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (equipmentItem: Equipment) => {
    const statusConfig = {
      available: { color: 'bg-green-500', icon: CheckCircle, text: 'Disponible' },
      in_use: { color: 'bg-blue-500', icon: Activity, text: 'En Uso' },
      maintenance: { color: 'bg-yellow-500', icon: Settings, text: 'Mantenimiento' },
      out_of_service: { color: 'bg-red-500', icon: AlertTriangle, text: 'Fuera de Servicio' }
    };
    
    const config = statusConfig[equipmentItem.status as keyof typeof statusConfig] || statusConfig.available;
    const Icon = config.icon;
    
    return (
      <Badge variant="default" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const typeIcons = {
      'heavy_machinery': Truck,
      'tools': Wrench,
      'vehicles': Truck,
      'safety': CheckCircle,
      'measuring': Settings,
      'other': Building
    };
    
    return typeIcons[type as keyof typeof typeIcons] || Building;
  };

  const getEquipmentStats = () => {
    const total = equipment.length;
    const available = equipment.filter(eq => eq.status === 'disponible').length;
    const inUse = equipment.filter(eq => eq.status === 'en_uso').length;
    const maintenance = equipment.filter(eq => eq.status === 'mantenimiento').length;
    const outOfService = equipment.filter(eq => eq.status === 'fuera_servicio').length;
    
    return { total, available, inUse, maintenance, outOfService };
  };

  const stats = getEquipmentStats();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Equipos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Uso</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inUse}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mantenimiento</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
              </div>
              <Settings className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Equipos de Construcción</CardTitle>
              <CardDescription>
                Gestiona el inventario y seguimiento de equipos
              </CardDescription>
            </div>
            {canCreateEquipment && showActions && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Equipo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEquipment ? 'Editar Equipo' : 'Nuevo Equipo'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingEquipment 
                        ? 'Modifica los datos del equipo'
                        : 'Registra un nuevo equipo en el inventario'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <EquipmentForm 
                    equipment={editingEquipment}
                    projectId={projectId}
                    onSuccess={handleEquipmentSaved}
                    onCancel={() => {
                      setIsDialogOpen(false);
                      setEditingEquipment(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, código, modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select 
              value={statusFilter} 
              onValueChange={(value: 'all' | 'disponible' | 'en_uso' | 'mantenimiento' | 'fuera_servicio') => setStatusFilter(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="in_use">En Uso</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="out_of_service">Fuera de Servicio</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="heavy_machinery">Maquinaria Pesada</SelectItem>
                <SelectItem value="tools">Herramientas</SelectItem>
                <SelectItem value="vehicles">Vehículos</SelectItem>
                <SelectItem value="safety">Seguridad</SelectItem>
                <SelectItem value="measuring">Medición</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Equipment List */}
          {equipment.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay equipos registrados</h3>
              <p className="text-muted-foreground mb-4">
                Comienza registrando los equipos de tu inventario
              </p>
              {canCreateEquipment && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primer Equipo
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {equipment.map((equipmentItem) => {
                const TypeIcon = getTypeIcon(equipmentItem.type);
                return (
                  <div key={equipmentItem.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{equipmentItem.name}</h4>
                            {getStatusBadge(equipmentItem)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Código</p>
                              <p className="font-medium">{equipmentItem.code}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Modelo</p>
                              <p className="font-medium">{equipmentItem.model || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Ubicación</p>
                              <p className="font-medium">
                                {equipmentItem.current_location || 'Sin asignar'}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Valor</p>
                              <p className="font-medium">
                                {equipmentItem.purchase_price 
                                  ? formatCurrency(equipmentItem.purchase_price)
                                  : 'N/A'
                                }
                              </p>
                            </div>
                          </div>
                          
                          {equipmentItem.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {equipmentItem.description}
                            </p>
                          )}
                          
                          {equipmentItem.project && (
                            <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
                              <Building className="h-3 w-3" />
                              Asignado a: {equipmentItem.project.name}
                            </div>
                          )}
                          
                          {equipmentItem.last_maintenance_date && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Último mantenimiento: {formatDate(equipmentItem.last_maintenance_date)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {showActions && (
                        <div className="flex items-center gap-2">
                          {canEditEquipment && (
                            <Select
                              value={equipmentItem.status}
                              onValueChange={(value) => handleStatusChange(equipmentItem.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">Disponible</SelectItem>
                                <SelectItem value="in_use">En Uso</SelectItem>
                                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                                <SelectItem value="out_of_service">Fuera de Servicio</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          
                          {canEditEquipment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(equipmentItem)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {canDeleteEquipment && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El equipo "{equipmentItem.name}" será eliminado permanentemente del inventario.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(equipmentItem.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}