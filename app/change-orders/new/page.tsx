'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import type { Project, CreateChangeOrderData } from '@/types/database';

export default function NewChangeOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateChangeOrderData>({
    project_id: '',
    change_type: 'accion_correctiva',
    impact_type: 'positivo',
    title: '',
    description: '',
    designer: '',
    cost_impact: 0,
    currency: 'CRC',
    exchange_rate: 500.00,
    cost_impact_crc: 0,
    schedule_impact_days: 0,
    cost_impact_details: '',
    quality_impact: '',
    schedule_details: '',
    risk_assessment: '',
    additional_comments: '',
  });

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar los proyectos');
    }
  };

  const handleInputChange = (field: keyof CreateChangeOrderData, value: string | number) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Calcular automáticamente el monto en colones cuando cambie el costo o la moneda
      if (field === 'cost_impact' || field === 'currency' || field === 'exchange_rate') {
        const costImpact = field === 'cost_impact' ? value : updated.cost_impact;
        const currency = field === 'currency' ? value : updated.currency;
        const exchangeRate = field === 'exchange_rate' ? value : updated.exchange_rate;
        
        if (currency === 'USD') {
          updated.cost_impact_crc = costImpact * (exchangeRate || 500);
        } else {
          updated.cost_impact_crc = costImpact;
        }
      }
      
      return updated;
    });
  };

  const handleNumberFocus = (field: keyof CreateChangeOrderData) => {
    const currentValue = formData[field];
    if (currentValue === 0 || currentValue === '0') {
      setFormData(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    if (!formData.project_id) {
      toast.error('Por favor seleccione un proyecto');
      return false;
    }
    
    if (!formData.change_type || !formData.title || !formData.designer || !formData.currency) {
      toast.error('Por favor complete todos los campos requeridos');
      return false;
    }
    
    if (!formData.description?.trim()) {
      toast.error('Por favor ingrese una descripción');
      return false;
    }
    
    if (!formData.exchange_rate || formData.exchange_rate <= 0) {
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
      
      const response = await fetch('/api/change-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Orden de cambio creada exitosamente');
        router.push('/change-orders');
      } else {
        toast.error(result.error || 'Error al crear la orden de cambio');
      }
    } catch (error) {
      console.error('Error creating change order:', error);
      toast.error('Error al crear la orden de cambio');
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === formData.project_id);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/change-orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Órdenes de Cambio
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <FileEdit className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Nueva Orden de Cambio</h1>
        </div>
        <p className="text-gray-600">
          Crear una nueva orden de cambio que afectará el presupuesto y cronograma del proyecto
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
                {selectedProject && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Presupuesto actual: {new Intl.NumberFormat('es-GT', {
                      style: 'currency',
                      currency: 'GTQ'
                    }).format(selectedProject.presupuesto_final || selectedProject.presupuesto_original || 0)}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="change_type">Tipo de Orden *</Label>
                <Select 
                  value={formData.change_type} 
                  onValueChange={(value) => handleInputChange('change_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <Label htmlFor="impact_type">Tipo de Impacto *</Label>
              <Select 
                value={formData.impact_type} 
                onValueChange={(value) => handleInputChange('impact_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positivo">Positivo (Incrementa presupuesto)</SelectItem>
                  <SelectItem value="negativo">Negativo (Reduce presupuesto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="title">Título de la Orden *</Label>
              <Input
                id="title"
                placeholder="Título descriptivo de la orden de cambio"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="designer">Diseñador *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="designer"
                  placeholder="Nombre del diseñador responsable"
                  value={formData.designer}
                  onChange={(e) => handleInputChange('designer', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Descripción detallada de la orden de cambio"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Impacto Financiero y Cronograma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Impacto Financiero y Cronograma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Moneda *</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRC">Colones Costarricenses (₡)</SelectItem>
                    <SelectItem value="USD">Dólares Estadounidenses ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="exchange_rate">Tipo de Cambio (CRC por USD) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-muted-foreground">₡</span>
                  <Input
                    id="exchange_rate"
                    type="number"
                    step="0.01"
                    placeholder="500.00"
                    value={formData.exchange_rate}
                    onChange={(e) => handleInputChange('exchange_rate', parseFloat(e.target.value) || 500)}
                    onFocus={() => handleNumberFocus('exchange_rate')}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Cuántos colones equivalen a 1 dólar
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost_impact">Impacto en Presupuesto ({formData.currency === 'USD' ? '$' : '₡'})</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    {formData.currency === 'USD' ? '$' : '₡'}
                  </span>
                  <Input
                    id="cost_impact"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost_impact}
                    onChange={(e) => handleInputChange('cost_impact', parseFloat(e.target.value) || 0)}
                    onFocus={() => handleNumberFocus('cost_impact')}
                    className="pl-10"
                  />
                </div>
                {formData.currency === 'USD' && formData.cost_impact > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    Equivalente: ₡{new Intl.NumberFormat('es-CR').format(formData.cost_impact_crc || 0)}
                  </p>
                )}
                {formData.currency === 'CRC' && formData.cost_impact > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    Equivalente: ${new Intl.NumberFormat('en-US').format((formData.cost_impact / (formData.exchange_rate || 500)) || 0)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.impact_type === 'positivo' ? 'Aumenta el presupuesto' : 'Reduce el presupuesto'}
                </p>
              </div>
              
              <div>
                <Label htmlFor="schedule_impact_days">Impacto en Cronograma (días)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="schedule_impact_days"
                    type="number"
                    placeholder="0"
                    value={formData.schedule_impact_days}
                    onChange={(e) => handleInputChange('schedule_impact_days', parseInt(e.target.value) || 0)}
                    onFocus={() => handleNumberFocus('schedule_impact_days')}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Positivo: extiende el cronograma | Negativo: acelera el cronograma
                </p>
              </div>
            </div>
            
            {/* Resumen del impacto */}
            {(formData.cost_impact > 0 || formData.schedule_impact_days !== 0) && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Resumen del Impacto</h4>
                <div className="space-y-1 text-sm">
                  {formData.cost_impact > 0 && (
                    <p className="text-blue-700">
                      <strong>Financiero:</strong> {formData.impact_type === 'positivo' ? '+' : '-'}
                      {formData.currency === 'USD' ? '$' : '₡'}{new Intl.NumberFormat('es-CR').format(formData.cost_impact)}
                      {formData.currency === 'USD' && ` (₡${new Intl.NumberFormat('es-CR').format(formData.cost_impact_crc || 0)})`}
                    </p>
                  )}
                  {formData.schedule_impact_days !== 0 && (
                    <p className="text-blue-700">
                      <strong>Cronograma:</strong> {(formData.schedule_impact_days || 0) > 0 ? '+' : ''}{formData.schedule_impact_days || 0} días
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Características de la Orden */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Características de la Orden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cost_impact_details">Impacto en Costo</Label>
              <Textarea
                id="cost_impact_details"
                placeholder="Descripción del impacto en los costos del proyecto"
                value={formData.cost_impact_details}
                onChange={(e) => handleInputChange('cost_impact_details', e.target.value)}
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="quality_impact">Impacto en Calidad</Label>
              <Textarea
                id="quality_impact"
                placeholder="Descripción del impacto en la calidad del proyecto"
                value={formData.quality_impact}
                onChange={(e) => handleInputChange('quality_impact', e.target.value)}
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="schedule_details">Detalles del Cronograma</Label>
              <Textarea
                id="schedule_details"
                placeholder="Detalles específicos sobre el impacto en el cronograma"
                value={formData.schedule_details}
                onChange={(e) => handleInputChange('schedule_details', e.target.value)}
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="risk_assessment">Evaluación de Riesgo</Label>
              <Textarea
                id="risk_assessment"
                placeholder="Evaluación de riesgos asociados con esta orden de cambio"
                value={formData.risk_assessment}
                onChange={(e) => handleInputChange('risk_assessment', e.target.value)}
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="additional_comments">Comentarios Adicionales</Label>
              <Textarea
                id="additional_comments"
                placeholder="Comentarios adicionales o notas importantes"
                value={formData.additional_comments}
                onChange={(e) => handleInputChange('additional_comments', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/change-orders">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Crear Orden de Cambio
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}