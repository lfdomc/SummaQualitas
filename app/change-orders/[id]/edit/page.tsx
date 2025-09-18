'use client';

import { useState, useEffect } from 'react';
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
import { useAuth } from '@/lib/hooks/useAuth';
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

export default function EditChangeOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [changeOrder, setChangeOrder] = useState<ChangeOrderWithProject | null>(null);
  const [formData, setFormData] = useState<UpdateChangeOrderData>({
    title: '',
    description: '',
    change_type: 'accion_correctiva',
    cost_impact_level: 'medio',
    cost_comments: '',
    schedule_impact_days: 0,
    schedule_comments: '',
    quality_impact_level: 'medio',
    risk_comments: '',
    general_comments: '',
    status: 'pending_approval'
  });

  const orderId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    if (user && orderId) {
      fetchChangeOrder();
      fetchProjects();
    }
  }, [user, orderId]);

  const fetchChangeOrder = async () => {
    try {
      setInitialLoading(true);
      
      const response = await fetch(`/api/change-orders/${orderId}`);
      const result = await response.json();
      
      if (result.success) {
        const order = result.data;
        setChangeOrder(order);
        
        // Llenar el formulario con los datos existentes
        
        // Recalcular cost_impact_crc basado en los valores actuales
        const costImpact = order.cost_impact || 0;
        const currency = order.currency || 'CRC';
        const exchangeRate = order.exchange_rate || 520.00;
        const correctCostImpactCrc = currency === 'USD' ? costImpact * exchangeRate : costImpact;
        
        setFormData({
          title: order.title || '',
        description: order.description || '',
        change_type: order.change_type || 'accion_correctiva',
        cost_impact_level: order.cost_impact_level || 'medio',
        cost_comments: order.cost_comments || '',
        schedule_impact_days: order.schedule_impact_days || 0,
        schedule_comments: order.schedule_comments || '',
        quality_impact_level: order.quality_impact_level || 'medio',
        risk_comments: order.risk_comments || '',
        general_comments: order.general_comments || '',
        status: order.status || 'pending_approval'
        });
      } else {
        toast.error(result.error || 'Error al cargar la orden de cambio');
        router.push('/change-orders');
      }
    } catch (error) {
      console.error('Error fetching change order:', error);
      toast.error('Error al cargar la orden de cambio');
      router.push('/change-orders');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, presupuesto_original, presupuesto_final')
        .order('name');

      if (error) throw error;
      setProjects((data || []) as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar los proyectos');
    }
  };

  const handleInputChange = (field: keyof UpdateChangeOrderData, value: string | number) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Calcular automáticamente el monto en colones cuando cambie el costo o la moneda
      if (field === 'cost_impact' || field === 'currency' || field === 'exchange_rate') {
        const costImpact = field === 'cost_impact' ? value : updated.cost_impact || 0;
        const currency = field === 'currency' ? value : updated.currency;
        const exchangeRate = field === 'exchange_rate' ? value : updated.exchange_rate || 520;
        
        if (currency === 'USD') {
          updated.cost_impact_crc = costImpact * exchangeRate;
        } else {
          updated.cost_impact_crc = costImpact;
        }
      }
      
      return updated;
    });
  };

  const handleNumberFocus = (field: keyof UpdateChangeOrderData) => {
    const currentValue = formData[field];
    if (currentValue === 0 || currentValue === '0') {
      setFormData(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      toast.error('Por favor ingrese un título');
      return false;
    }
    
    if (!formData.description?.trim()) {
      toast.error('Por favor ingrese una descripción');
      return false;
    }
    
    if (!formData.designer?.trim()) {
      toast.error('Por favor ingrese el diseñador');
      return false;
    }
    
    if (formData.currency === 'USD' && (!formData.exchange_rate || formData.exchange_rate <= 0)) {
      toast.error('Por favor ingrese un tipo de cambio válido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/change-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
  };

  if (initialLoading) {
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
                <Label htmlFor="project">Proyecto</Label>
                <Input 
                  value={changeOrder.projects?.name || 'N/A'}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  El proyecto no se puede cambiar al editar
                </p>
              </div>
              
              <div>
                <Label htmlFor="change_type">Tipo de Orden *</Label>
                <Select 
                  value={formData.change_type} 
                  onValueChange={(value) => handleInputChange('change_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accion_correctiva">Acción Correctiva</SelectItem>
                    <SelectItem value="accion_preventiva">Acción Preventiva</SelectItem>
                    <SelectItem value="extras">Extras</SelectItem>
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

            <div>
              <Label htmlFor="cost_impact_level">Nivel de Impacto en Costos</Label>
              <Select 
                value={formData.cost_impact_level} 
                onValueChange={(value) => handleInputChange('cost_impact_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="bajo">Bajo</SelectItem>
                   <SelectItem value="medio">Medio</SelectItem>
                   <SelectItem value="alto">Alto</SelectItem>
                 </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Impacto Financiero */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Impacto Financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cost_comments">Comentarios sobre Impacto en Costos</Label>
              <Textarea
                id="cost_comments"
                value={formData.cost_comments}
                onChange={(e) => handleInputChange('cost_comments', e.target.value)}
                placeholder="Descripción detallada del impacto en costos"
                rows={3}
              />
            </div>


          </CardContent>
        </Card>

        {/* Impacto en Cronograma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Impacto en Cronograma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="schedule_impact_days">Impacto en Días</Label>
              <Input
                id="schedule_impact_days"
                type="number"
                value={formData.schedule_impact_days}
                onChange={(e) => handleInputChange('schedule_impact_days', parseInt(e.target.value) || 0)}
                onFocus={() => handleNumberFocus('schedule_impact_days')}
                placeholder="0 (positivo = retraso, negativo = adelanto)"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Días de impacto: positivo = retraso, negativo = adelanto
              </p>
            </div>

            <div>
              <Label htmlFor="schedule_comments">Comentarios sobre Impacto en Cronograma</Label>
              <Textarea
                id="schedule_comments"
                value={formData.schedule_comments}
                onChange={(e) => handleInputChange('schedule_comments', e.target.value)}
                placeholder="Descripción detallada del impacto en el cronograma"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Evaluación de Calidad y Riesgos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Evaluación de Calidad y Riesgos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="quality_impact_level">Nivel de Impacto en Calidad</Label>
              <Select 
                value={formData.quality_impact_level} 
                onValueChange={(value) => handleInputChange('quality_impact_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="bajo">Bajo</SelectItem>
                   <SelectItem value="medio">Medio</SelectItem>
                   <SelectItem value="alto">Alto</SelectItem>
                 </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="risk_comments">Comentarios sobre Riesgos</Label>
              <Textarea
                id="risk_comments"
                value={formData.risk_comments}
                onChange={(e) => handleInputChange('risk_comments', e.target.value)}
                placeholder="Evaluación de riesgos asociados con esta orden de cambio"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Comentarios Adicionales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Comentarios Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="general_comments">Comentarios Generales</Label>
              <Textarea
                id="general_comments"
                value={formData.general_comments}
                onChange={(e) => handleInputChange('general_comments', e.target.value)}
                placeholder="Comentarios adicionales sobre la orden de cambio"
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
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}