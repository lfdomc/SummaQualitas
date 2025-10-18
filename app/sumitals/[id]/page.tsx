'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package, 
  User, 
  Calendar, 
  DollarSign,
  Phone,
  MapPin,
  Shield,
  Wrench,
  FileText,
  Download
} from 'lucide-react';
import { Sumital, UserProfile } from '@/lib/types';
import AttachmentViewer from '@/components/sumitals/AttachmentViewer';

export default function SumitalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  
  const [sumital, setSumital] = useState<Sumital | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [observations, setObservations] = useState('');
  const [approverName, setApproverName] = useState('');

  useEffect(() => {
    fetchSumital();
    fetchCurrentUser();
  }, [params.id]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCurrentUser(profile);
          setApproverName(profile.name || '');
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchSumital = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/sumitals/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar sumital');
      }

      setSumital(result.sumital);
      setObservations(result.sumital.observations || '');
    } catch (error) {
      console.error('Error fetching sumital:', error);
      toast.error('Error al cargar sumital');
      router.push('/sumitals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (isApproved: boolean) => {
    if (!sumital) return;

    try {
      setActionLoading(true);

      const updateData = {
        is_approved: isApproved,
        observations: observations.trim() || undefined,
        approver_name: approverName.trim() || undefined
      };

      const response = await fetch(`/api/sumitals/${sumital.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar sumital');
      }

      toast.success(isApproved ? 'Sumital aprobado exitosamente' : 'Sumital rechazado exitosamente');
      setSumital(result.sumital);
      setApprovalDialogOpen(false);
      setRejectionDialogOpen(false);
    } catch (error) {
      console.error('Error updating sumital:', error);
      toast.error('Error al actualizar sumital');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!sumital) return;

    try {
      setPdfLoading(true);
      toast.info('Generando PDF completo...');

      const response = await fetch(`/api/sumitals/${sumital.id}/pdf`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar PDF');
      }

      // Crear blob del PDF
      const blob = await response.blob();
      
      // Crear URL temporal para descarga
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento de descarga
      const a = document.createElement('a');
      a.href = url;
      
      // Generar nombre descriptivo del archivo
      const sumitalNumber = sumital.sumital_number || 'N/A';
      const projectName = sumital.project?.name || 'Proyecto';
      const createdDate = sumital.created_at ? new Date(sumital.created_at).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
      
      // Limpiar el nombre del proyecto para que sea válido como nombre de archivo
      const cleanProjectName = projectName
        .replace(/[<>:"/\\|?*]/g, '') // Remover caracteres no válidos para nombres de archivo
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim()
        .substring(0, 50); // Limitar longitud
      
      const filename = `Sumital #${sumitalNumber} - ${cleanProjectName} - ${createdDate}.pdf`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const getApprovalBadge = (isApproved: boolean | null) => {
    if (isApproved === null) {
      return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pendiente</Badge>;
    } else if (isApproved) {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="w-3 h-3" />Aprobado</Badge>;
    } else {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Rechazado</Badge>;
    }
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
              Sumital #{sumital.sumital_number}
              {getApprovalBadge(sumital.is_approved)}
            </h1>
            <p className="text-muted-foreground">
              {sumital.project?.name} • {new Date(sumital.project_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {sumital.is_approved === null && (
            <>
              <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50">
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rechazar Sumital</DialogTitle>
                    <DialogDescription>
                      ¿Estás seguro de que deseas rechazar este sumital? Puedes agregar observaciones.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="approver_name">Nombre del revisor</Label>
                      <Input
                        id="approver_name"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observations">Observaciones</Label>
                      <Textarea
                        id="observations"
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Motivo del rechazo o comentarios adicionales"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleApprovalAction(false)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Rechazando...' : 'Rechazar'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4" />
                    Aprobar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Aprobar Sumital</DialogTitle>
                    <DialogDescription>
                      ¿Estás seguro de que deseas aprobar este sumital? Puedes agregar observaciones.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="approver_name">Nombre del revisor</Label>
                      <Input
                        id="approver_name"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observations">Observaciones</Label>
                      <Textarea
                        id="observations"
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Comentarios adicionales (opcional)"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleApprovalAction(true)}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading ? 'Aprobando...' : 'Aprobar'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {pdfLoading ? 'Generando...' : 'Descargar PDF'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push(`/sumitals/${sumital.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Equipment/Material Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Equipo/Material</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                <p className="text-sm mt-1">{sumital.equipment_description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Marca</Label>
                  <p className="text-sm mt-1">{sumital.brand || 'No especificada'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Modelo</Label>
                  <p className="text-sm mt-1">{sumital.model || 'No especificado'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">País de Origen</Label>
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {sumital.country_of_origin || 'No especificado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Precio Total</Label>
                  <p className="text-sm mt-1 flex items-center gap-2 font-semibold">
                    <DollarSign className="w-4 h-4" />
                    ₡{sumital.total_price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Garantía</Label>
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {sumital.warranty_period || 'No especificada'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Vida Útil</Label>
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {sumital.useful_life || 'No especificada'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Proveedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nombre del Proveedor</Label>
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {sumital.supplier_name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {sumital.supplier_phone || 'No especificado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(sumital.maintenance || sumital.training) && (
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sumital.maintenance && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Mantenimiento
                    </Label>
                    <p className="text-sm mt-1">{sumital.maintenance}</p>
                  </div>
                )}
                
                {sumital.training && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Capacitación
                    </Label>
                    <p className="text-sm mt-1">{sumital.training}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attached Documents */}
          {sumital.attached_documents && sumital.attached_documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos Adjuntos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sumital.attached_documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Archivos Adjuntos */}
          <AttachmentViewer
            sumitalId={params.id as string}
            attachmentType="document"
            title="Archivos Adjuntos"
            description="Documentos, imágenes y otros archivos relacionados con el sumital"
          />

          {/* Sumital Firmado */}
          <AttachmentViewer
            sumitalId={params.id as string}
            attachmentType="signed_sumital"
            title="Sumital Firmado"
            description="Documento final firmado por el cliente"
          />
        </div>

        {/* Right Column - Status and Metadata */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Sumital</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {getApprovalBadge(sumital.is_approved)}
              </div>
              
              {sumital.is_approved !== null && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Revisado por</Label>
                    <p className="text-sm">{sumital.approver_name || 'No especificado'}</p>
                  </div>
                  
                  {sumital.review_date && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">Fecha de revisión</Label>
                      <p className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(sumital.review_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Proyecto</Label>
                <p className="text-sm mt-1">{sumital.project?.name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Fecha del Proyecto</Label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(sumital.project_date).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          {sumital.observations && (
            <Card>
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{sumital.observations}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Creado</Label>
                <p className="text-sm mt-1">
                  {new Date(sumital.created_at).toLocaleDateString()} a las{' '}
                  {new Date(sumital.created_at).toLocaleTimeString()}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Última actualización</Label>
                <p className="text-sm mt-1">
                  {new Date(sumital.updated_at).toLocaleDateString()} a las{' '}
                  {new Date(sumital.updated_at).toLocaleTimeString()}
                </p>
              </div>
              
              {sumital.created_by_user && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Creado por</Label>
                  <p className="text-sm mt-1">{sumital.created_by_user.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}