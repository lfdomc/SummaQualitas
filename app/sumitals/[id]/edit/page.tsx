'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { Sumital, Project, UpdateSumitalData, SumitalAttachment } from '@/lib/types';
import FileUpload from '@/components/sumitals/FileUpload';

type ProjectOption = Pick<Project, 'id' | 'name' | 'status'>;

export default function EditSumitalPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  
  const [sumital, setSumital] = useState<Sumital | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para adjuntos
  const [documentAttachments, setDocumentAttachments] = useState<SumitalAttachment[]>([]);
  const [signedAttachments, setSignedAttachments] = useState<SumitalAttachment[]>([]);
  
  const [formData, setFormData] = useState<UpdateSumitalData>({
    project_id: '',
    project_date: '',
    equipment_description: '',
    supplier_name: '',
    supplier_phone: '',
    country_of_origin: '',
    brand: '',
    model: '',
    warranty_period: '',
    useful_life: '',
    total_price: 0,
    maintenance: '',
    training: '',
    observations: '',
    is_approved: null
  });

  useEffect(() => {
    fetchSumital();
    fetchProjects();
    fetchAttachments();
  }, [params.id]);

  const fetchSumital = async () => {
    try {
      const response = await fetch(`/api/sumitals/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar sumital');
      }

      const sumitalData = result.sumital;
      setSumital(sumitalData);
      
      // Populate form with existing data
      setFormData({
        project_id: sumitalData.project_id,
        project_date: sumitalData.project_date.split('T')[0], // Format for date input
        equipment_description: sumitalData.equipment_description,
        supplier_name: sumitalData.supplier_name,
        supplier_phone: sumitalData.supplier_phone || '',
        country_of_origin: sumitalData.country_of_origin || '',
        brand: sumitalData.brand || '',
        model: sumitalData.model || '',
        warranty_period: sumitalData.warranty_period || '',
        useful_life: sumitalData.useful_life || '',
        total_price: sumitalData.total_price,
        maintenance: sumitalData.maintenance || '',
        training: sumitalData.training || '',
        observations: sumitalData.observations || '',
        is_approved: sumitalData.is_approved
      });
    } catch (error) {
      console.error('Error fetching sumital:', error);
      toast.error('Error al cargar sumital');
      router.push('/sumitals');
    }
  };

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .order('name');

      if (error) throw error;
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      // Cargar adjuntos de documentos
      const documentsResponse = await fetch(`/api/sumitals/attachments?sumital_id=${params.id}&attachment_type=document`);
      if (documentsResponse.ok) {
        const documentsResult = await documentsResponse.json();
        setDocumentAttachments(documentsResult.attachments || []);
      }

      // Cargar adjuntos de sumital firmado
      const signedResponse = await fetch(`/api/sumitals/attachments?sumital_id=${params.id}&attachment_type=signed_sumital`);
      if (signedResponse.ok) {
        const signedResult = await signedResponse.json();
        setSignedAttachments(signedResult.attachments || []);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast.error('Error al cargar adjuntos');
    }
  };

  const handleInputChange = (field: keyof UpdateSumitalData, value: string | number | boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.equipment_description || !formData.supplier_name) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/sumitals/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar sumital');
      }

      toast.success('Sumital actualizado exitosamente');
      router.push(`/sumitals/${params.id}`);
    } catch (error) {
      console.error('Error updating sumital:', error);
      toast.error('Error al actualizar sumital');
    } finally {
      setSaving(false);
    }
  };

  // Funciones de callback para adjuntos
  const handleDocumentUploadSuccess = (attachment: SumitalAttachment) => {
    setDocumentAttachments(prev => [...prev, attachment]);
    toast.success('Documento subido exitosamente');
  };

  const handleDocumentDeleteSuccess = (attachmentId: string) => {
    setDocumentAttachments(prev => prev.filter(att => att.id !== attachmentId));
    toast.success('Documento eliminado exitosamente');
  };

  const handleSignedUploadSuccess = (attachment: SumitalAttachment) => {
    setSignedAttachments(prev => [...prev, attachment]);
    toast.success('Sumital firmado subido exitosamente');
  };

  const handleSignedDeleteSuccess = (attachmentId: string) => {
    setSignedAttachments(prev => prev.filter(att => att.id !== attachmentId));
    toast.success('Sumital firmado eliminado exitosamente');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6 animate-spin" />
          <span>Cargando sumital...</span>
        </div>
      </div>
    );
  }

  if (!sumital) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sumital no encontrado</h3>
          <Button onClick={() => router.push('/sumitals')}>
            Volver a sumitals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Package className="w-8 h-8" />
              Editar Sumital #{sumital.sumital_number}
            </h1>
            <p className="text-muted-foreground">
              Modifica la información del sumital
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Proyecto</CardTitle>
                <CardDescription>
                  Selecciona el proyecto y fecha asociados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project_id">Proyecto *</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => handleInputChange('project_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proyecto" />
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
                  <Label htmlFor="project_date">Fecha del Proyecto *</Label>
                  <Input
                    id="project_date"
                    type="date"
                    value={formData.project_date}
                    onChange={(e) => handleInputChange('project_date', e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Equipment/Material Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Equipo/Material</CardTitle>
                <CardDescription>
                  Detalles técnicos del equipo o material
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="equipment_description">Descripción del Equipo/Material *</Label>
                  <Textarea
                    id="equipment_description"
                    value={formData.equipment_description}
                    onChange={(e) => handleInputChange('equipment_description', e.target.value)}
                    placeholder="Describe el equipo o material..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Marca del equipo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="Modelo del equipo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country_of_origin">País de Origen</Label>
                    <Input
                      id="country_of_origin"
                      value={formData.country_of_origin}
                      onChange={(e) => handleInputChange('country_of_origin', e.target.value)}
                      placeholder="País de origen"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_price">Precio Total *</Label>
                    <Input
                      id="total_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.total_price}
                      onChange={(e) => handleInputChange('total_price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warranty_period">Período de Garantía</Label>
                    <Input
                      id="warranty_period"
                      value={formData.warranty_period}
                      onChange={(e) => handleInputChange('warranty_period', e.target.value)}
                      placeholder="ej: 2 años, 24 meses"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="useful_life">Vida Útil</Label>
                    <Input
                      id="useful_life"
                      value={formData.useful_life}
                      onChange={(e) => handleInputChange('useful_life', e.target.value)}
                      placeholder="ej: 10 años, 120 meses"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Supplier Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Proveedor</CardTitle>
                <CardDescription>
                  Datos de contacto del proveedor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_name">Nombre del Proveedor *</Label>
                  <Input
                    id="supplier_name"
                    value={formData.supplier_name}
                    onChange={(e) => handleInputChange('supplier_name', e.target.value)}
                    placeholder="Nombre de la empresa proveedora"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier_phone">Teléfono del Proveedor</Label>
                  <Input
                    id="supplier_phone"
                    value={formData.supplier_phone}
                    onChange={(e) => handleInputChange('supplier_phone', e.target.value)}
                    placeholder="Número de teléfono"
                  />
                </div>


              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
                <CardDescription>
                  Mantenimiento, capacitación, estado y observaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="is_approved">Estado del Sumital</Label>
                  <Select
                    value={formData.is_approved === null ? 'pending' : formData.is_approved ? 'approved' : 'rejected'}
                    onValueChange={(value) => {
                      let approvalValue: boolean | null;
                      if (value === 'pending') approvalValue = null;
                      else if (value === 'approved') approvalValue = true;
                      else approvalValue = false;
                      handleInputChange('is_approved', approvalValue);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance">Mantenimiento</Label>
                  <Textarea
                    id="maintenance"
                    value={formData.maintenance}
                    onChange={(e) => handleInputChange('maintenance', e.target.value)}
                    placeholder="Información sobre mantenimiento requerido..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training">Capacitación</Label>
                  <Textarea
                    id="training"
                    value={formData.training}
                    onChange={(e) => handleInputChange('training', e.target.value)}
                    placeholder="Información sobre capacitación requerida..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => handleInputChange('observations', e.target.value)}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Archivos Adjuntos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Archivos Adjuntos</CardTitle>
              <CardDescription>
                Documentos, imágenes y otros archivos relacionados con el sumital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                sumitalId={params.id as string}
                attachmentType="document"
                title="Archivos del Sumital"
                description="Sube documentos, imágenes y otros archivos relacionados con el sumital"
                multiple={true}
                disabled={saving}
                existingAttachments={documentAttachments}
                onUploadSuccess={handleDocumentUploadSuccess}
                onDeleteSuccess={handleDocumentDeleteSuccess}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sumital Firmado</CardTitle>
              <CardDescription>
                Documento final firmado por el cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                sumitalId={params.id as string}
                attachmentType="signed_sumital"
                title="Sumital Firmado por el Cliente"
                description="Sube el documento final firmado por el cliente"
                multiple={false}
                disabled={saving}
                existingAttachments={signedAttachments}
                onUploadSuccess={handleSignedUploadSuccess}
                onDeleteSuccess={handleSignedDeleteSuccess}
              />
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}