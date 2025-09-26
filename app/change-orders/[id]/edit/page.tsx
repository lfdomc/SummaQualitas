'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  FileEdit,
  Save,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Project, ChangeOrder, UpdateChangeOrderData } from '@/types/database';

interface ChangeOrderWithProject extends ChangeOrder {
  projects?: {
    id: string;
    name: string;
    presupuesto_original?: number;
    presupuesto_final?: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function EditChangeOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    changeOrder: true,
    projects: true,
    users: true,
  });

  const [changeOrder, setChangeOrder] = useState<ChangeOrderWithProject | null>(null);

  const [formData, setFormData] = useState<UpdateChangeOrderData>({
    project_id: '',
    title: '',
    description: '',
    amount: 0,
    currency: 'USD',
    status: 'pending',
    designer: '',
    approved_by: '',
    request_date: '',
    approval_date: '',
    implementation_date: '',
    notes: '',
  });

  const orderId = params.id as string;
  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }, [supabase]);

  const fetchInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      setLoadingStates({ changeOrder: true, projects: true, users: true });
      
      // Ejecutar todas las llamadas API en paralelo para mejorar el rendimiento
      const [changeOrderResponse, projectsResponse, usersData] = await Promise.all([
        fetch(`/api/change-orders/${orderId}`),
        fetch('/api/projects'),
        fetchUsers()
      ]);

      const [changeOrderResult, projectsResult] = await Promise.all([
        changeOrderResponse.json(),
        projectsResponse.json()
      ]);

      // Procesar datos de la orden de cambio
      if (changeOrderResult.success && changeOrderResult.data) {
        const changeOrderData = changeOrderResult.data;
        setChangeOrder(changeOrderData);
        
        setFormData({
          project_id: changeOrderData.project_id || '',
          title: changeOrderData.title || '',
          description: changeOrderData.description || '',
          amount: changeOrderData.amount || 0,
          currency: changeOrderData.currency || 'USD',
          status: changeOrderData.status || 'pending',
          designer: changeOrderData.designer || '',
          approved_by: changeOrderData.approved_by || 'unassigned',
          request_date: changeOrderData.request_date || new Date().toISOString().split('T')[0],
          approval_date: changeOrderData.approval_date || '',
          implementation_date: changeOrderData.implementation_date || '',
          notes: changeOrderData.notes || '',
        });
        setLoadingStates(prev => ({ ...prev, changeOrder: false }));
      } else {
        toast.error('Error al cargar la orden de cambio');
        setLoadingStates(prev => ({ ...prev, changeOrder: false }));
      }

      // Procesar datos de proyectos
      if (projectsResult.success) {
        setProjects(projectsResult.data || []);
        setLoadingStates(prev => ({ ...prev, projects: false }));
      } else {
        console.error('Error fetching projects:', projectsResult.error);
        setLoadingStates(prev => ({ ...prev, projects: false }));
      }

      // Procesar datos de usuarios
      setUsers(usersData);
      setLoadingStates(prev => ({ ...prev, users: false }));

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Error al cargar los datos');
      setLoadingStates({ changeOrder: false, projects: false, users: false });
    } finally {
      setInitialLoading(false);
    }
  }, [orderId, fetchUsers]);

  useEffect(() => {
    if (user && orderId) {
      fetchInitialData();
    }
  }, [user, orderId, fetchInitialData]);

  const handleInputChange = useCallback((field: keyof UpdateChangeOrderData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.project_id) {
      toast.error('Por favor selecciona un proyecto');
      return false;
    }
    if (!formData.title) {
      toast.error('Por favor ingresa un título');
      return false;
    }
    if (!formData.description) {
      toast.error('Por favor ingresa una descripción');
      return false;
    }
    
    return true;
  }, [formData.project_id, formData.title, formData.description]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Preparar datos solo con campos válidos del esquema
      const updateData: UpdateChangeOrderData = {
        project_id: formData.project_id,
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
        currency: formData.currency,
        status: formData.status,
        designer: formData.designer || null,
        approved_by: formData.approved_by === 'unassigned' ? null : formData.approved_by || null,
        request_date: formData.request_date || null,
        approval_date: formData.approval_date || null,
        implementation_date: formData.implementation_date || null,
        notes: formData.notes || null,
      };
      
      const response = await fetch(`/api/change-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Orden de cambio actualizada exitosamente');
        router.push(`/change-orders/${orderId}`);
      } else {
        toast.error(result.error || 'Error al actualizar la orden de cambio');
      }
    } catch (error) {
      console.error('Error updating change order:', error);
      toast.error('Error al actualizar la orden de cambio');
    } finally {
      setLoading(false);
    }
  }, [validateForm, formData, orderId, router]);

  // Memoizar las opciones de proyectos para evitar re-renderizados innecesarios
  const projectOptions = useMemo(() => {
    return projects.map(project => ({
      value: project.id,
      label: project.name
    }));
  }, [projects]);

  // Memoizar el proyecto seleccionado
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === formData.project_id);
  }, [projects, formData.project_id]);

  if (initialLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Indicador de progreso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div className="text-sm text-blue-700">
                <div className="font-medium">Cargando datos...</div>
                <div className="text-xs mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {loadingStates.changeOrder ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                    ) : (
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    )}
                    <span className={loadingStates.changeOrder ? "text-blue-600" : "text-green-600"}>
                      {loadingStates.changeOrder ? "Cargando orden de cambio..." : "Orden de cambio cargada"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingStates.projects ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                    ) : (
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    )}
                    <span className={loadingStates.projects ? "text-blue-600" : "text-green-600"}>
                      {loadingStates.projects ? "Cargando proyectos..." : "Proyectos cargados"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingStates.users ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                    ) : (
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    )}
                    <span className={loadingStates.users ? "text-blue-600" : "text-green-600"}>
                      {loadingStates.users ? "Cargando usuarios..." : "Usuarios cargados"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Skeleton para el formulario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-24 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-6">
              <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
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
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/change-orders/${orderId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Detalle
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <FileEdit className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Editar Orden de Cambio</h1>
        </div>
        <p className="text-gray-600">
          Modificar la orden de cambio {changeOrder.document_number} del proyecto {changeOrder.projects?.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="document_number">ID de la Orden</Label>
                <Input
                  id="document_number"
                  value={changeOrder?.document_number || ''}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                  placeholder="ID generado automáticamente"
                />
              </div>
              
              <div>
                <Label htmlFor="project">Proyecto *</Label>
                <Select 
                  value={formData.project_id} 
                  onValueChange={(value) => handleInputChange('project_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Estado *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                    <SelectItem value="implementado">Implementado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Título descriptivo de la orden de cambio"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción detallada de la orden de cambio"
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Información Financiera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Información Financiera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Monto</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    {formData.currency === 'USD' ? '$' : '₡'}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">Dólares ($)</SelectItem>
                    <SelectItem value="CRC">Colones (₡)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Gestión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información de Gestión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="designer">Diseñador</Label>
                <Input
                  id="designer"
                  value={formData.designer || ''}
                  onChange={(e) => handleInputChange('designer', e.target.value)}
                  placeholder="Nombre del diseñador"
                />
              </div>
              
              <div>
                <Label htmlFor="approved_by">Aprobado por</Label>
                <Select 
                  value={formData.approved_by} 
                  onValueChange={(value) => handleInputChange('approved_by', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                    {users
                      .filter((user) => {
                        // Filtrar solo usuarios gerenciales
                        const managerialRoles = ['gerente', 'director', 'supervisor', 'coordinador', 'jefe'];
                        return user.id && 
                               user.id.trim() !== '' && 
                               user.role && 
                               managerialRoles.some(role => 
                                 user.role.toLowerCase().includes(role)
                               );
                      })
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    
                    {/* Usuarios gerenciales de ejemplo si no hay usuarios en la base de datos */}
                    {users.filter((user) => {
                      const managerialRoles = ['gerente', 'director', 'supervisor', 'coordinador', 'jefe'];
                      return user.id && 
                             user.id.trim() !== '' && 
                             user.role && 
                             managerialRoles.some(role => 
                               user.role.toLowerCase().includes(role)
                             );
                    }).length === 0 && (
                      <>
                        <SelectItem value="ana-martinez">Ana Martínez (Gerente de Operaciones)</SelectItem>
                        <SelectItem value="carlos-rodriguez">Carlos Rodríguez (Director de Proyectos)</SelectItem>
                        <SelectItem value="maria-gonzalez">María González (Supervisora de Calidad)</SelectItem>
                        <SelectItem value="luis-fernandez">Luis Fernández (Coordinador Técnico)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="request_date">Fecha de Solicitud</Label>
                <Input
                  id="request_date"
                  type="date"
                  value={formData.request_date}
                  onChange={(e) => handleInputChange('request_date', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="approval_date">Fecha de Aprobación</Label>
                <Input
                  id="approval_date"
                  type="date"
                  value={formData.approval_date}
                  onChange={(e) => handleInputChange('approval_date', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="implementation_date">Fecha de Implementación</Label>
                <Input
                  id="implementation_date"
                  type="date"
                  value={formData.implementation_date}
                  onChange={(e) => handleInputChange('implementation_date', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notas adicionales sobre la orden de cambio"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-4">
          <Link href={`/change-orders/${orderId}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}