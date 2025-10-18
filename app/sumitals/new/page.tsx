'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { CreateSumitalData, Project } from '@/lib/types';
import FileUpload from '@/components/sumitals/FileUpload';

type ProjectOption = Pick<Project, 'id' | 'name' | 'status'>;

export default function NewSumitalPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSumitalData>({
    project_id: '',
    project_date: new Date().toISOString().split('T')[0],
    equipment_description: '',
    supplier_name: '',
    // supplier_phone: '', // Comentado temporalmente hasta agregar columna a DB
    country_of_origin: '',
    brand: '',
    model: '',
    warranty_period: '',
    useful_life: '',
    total_price: 0,
    maintenance: '',
    training: '',
    observations: ''
  });

  const [totalPriceDisplay, setTotalPriceDisplay] = useState<string>('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .in('status', ['planificacion', 'en_progreso'])
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar proyectos');
    }
  };

  const handleInputChange = (field: keyof CreateSumitalData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTotalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTotalPriceDisplay(value);
    
    // Actualizar el valor numérico en formData
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      total_price: numericValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 handleSubmit iniciado');
    console.log('📋 formData:', formData);
    
    // Validaciones
    if (!formData.project_id) {
      console.log('❌ Error: project_id no seleccionado');
      toast.error('Debe seleccionar un proyecto');
      return;
    }
    
    if (!formData.equipment_description.trim()) {
      console.log('❌ Error: equipment_description vacío');
      toast.error('La descripción del equipo/material es requerida');
      return;
    }
    
    if (!formData.supplier_name.trim()) {
      console.log('❌ Error: supplier_name vacío');
      toast.error('El nombre del proveedor es requerido');
      return;
    }
    
    if (formData.total_price <= 0) {
      console.log('❌ Error: total_price inválido:', formData.total_price);
      toast.error('El precio total debe ser mayor a 0');
      return;
    }
    
    console.log('✅ Todas las validaciones pasaron');

    try {
      console.log('🔄 Iniciando proceso de creación...');
      setLoading(true);
      
      console.log('📡 Enviando request a /api/sumitals');
      console.log('📦 Datos a enviar:', JSON.stringify(formData, null, 2));
      
      const response = await fetch('/api/sumitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📨 Response recibido:', response.status, response.statusText);
      console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('📄 Result completo:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        console.log('❌ Response no OK:', result);
        throw new Error(result.error || 'Error al crear sumital');
      }

      console.log('✅ Sumital creado exitosamente');
      toast.success('Sumital creado exitosamente');
      // Redirigir a la página de edición para permitir subir archivos adjuntos
      console.log('🔄 Redirigiendo a:', `/sumitals/${result.sumital.id}/edit`);
      router.push(`/sumitals/${result.sumital.id}/edit`);
    } catch (error) {
      console.error('❌ Error creating sumital:', error);
      toast.error('Error al crear sumital');
    } finally {
      console.log('🏁 Finalizando proceso');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Sumital</h1>
          <p className="text-muted-foreground">
            Crear un nuevo sumital de material, producto o equipamiento
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Proyecto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Información del Proyecto
            </CardTitle>
            <CardDescription>
              Seleccione el proyecto y configure la fecha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_id">Proyecto *</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => handleInputChange('project_id', value)}
                  required
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
              
              <div className="space-y-2">
                <Label htmlFor="project_date">Fecha del Sumital *</Label>
                <Input
                  id="project_date"
                  type="date"
                  value={formData.project_date}
                  onChange={(e) => handleInputChange('project_date', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Equipo/Material */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Equipo/Material</CardTitle>
            <CardDescription>
              Detalles del material, producto o equipamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_description">Descripción del Equipo/Material *</Label>
              <Textarea
                id="equipment_description"
                placeholder="Descripción detallada del equipo, material o producto"
                value={formData.equipment_description}
                onChange={(e) => handleInputChange('equipment_description', e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  placeholder="Marca del producto"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  placeholder="Modelo del producto"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country_of_origin">País de Origen</Label>
                <Input
                  id="country_of_origin"
                  placeholder="País de origen del producto"
                  value={formData.country_of_origin}
                  onChange={(e) => handleInputChange('country_of_origin', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_price">Precio Total *</Label>
                <Input
                  id="total_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ingrese el precio total"
                  value={totalPriceDisplay}
                  onChange={handleTotalPriceChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warranty_period">Período de Garantía</Label>
                <Input
                  id="warranty_period"
                  placeholder="Ej: 12 meses, 2 años"
                  value={formData.warranty_period}
                  onChange={(e) => handleInputChange('warranty_period', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="useful_life">Vida Útil</Label>
                <Input
                  id="useful_life"
                  placeholder="Ej: 10 años, 5000 horas"
                  value={formData.useful_life}
                  onChange={(e) => handleInputChange('useful_life', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Proveedor */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Proveedor</CardTitle>
            <CardDescription>
              Datos de contacto del proveedor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Nombre del Proveedor *</Label>
                <Input
                  id="supplier_name"
                  placeholder="Nombre de la empresa proveedora"
                  value={formData.supplier_name}
                  onChange={(e) => handleInputChange('supplier_name', e.target.value)}
                  required
                />
              </div>
              
              {/* Temporalmente comentado hasta agregar columna supplier_phone a la DB
              <div className="space-y-2">
                <Label htmlFor="supplier_phone">Teléfono del Proveedor</Label>
                <Input
                  id="supplier_phone"
                  placeholder="Número de teléfono"
                  value={formData.supplier_phone}
                  onChange={(e) => handleInputChange('supplier_phone', e.target.value)}
                />
              </div>
              */}
            </div>
          </CardContent>
        </Card>

        {/* Información Adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
            <CardDescription>
              Detalles sobre mantenimiento, capacitación y observaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance">Mantenimiento</Label>
              <Textarea
                id="maintenance"
                placeholder="Información sobre mantenimiento requerido"
                value={formData.maintenance}
                onChange={(e) => handleInputChange('maintenance', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="training">Capacitación</Label>
              <Textarea
                id="training"
                placeholder="Información sobre capacitación necesaria"
                value={formData.training}
                onChange={(e) => handleInputChange('training', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                placeholder="Observaciones adicionales"
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Archivos Adjuntos */}
        <Card>
          <CardHeader>
            <CardTitle>Archivos Adjuntos</CardTitle>
            <CardDescription>
              Documentos, imágenes y otros archivos relacionados con el sumital
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              sumitalId={undefined} // Se asignará después de crear el sumital
              attachmentType="document"
              title="Archivos del Sumital"
              description="Sube documentos, imágenes y otros archivos relacionados con el sumital"
              multiple={true}
              disabled={loading}
            />
          </CardContent>
        </Card>

        {/* Sumital Firmado por el Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Sumital Firmado</CardTitle>
            <CardDescription>
              Documento final firmado por el cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              sumitalId={undefined} // Se asignará después de crear el sumital
              attachmentType="signed_sumital"
              title="Sumital Firmado por el Cliente"
              description="Sube el documento final firmado por el cliente"
              multiple={false}
              disabled={loading}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex items-center gap-2">
            {loading ? (
              <>
                <Package className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Crear Sumital
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}