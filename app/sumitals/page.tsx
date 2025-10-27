'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  FileText
} from 'lucide-react';
import { Sumital, Project, SumitalFilters } from '@/lib/types';

type ProjectOption = Pick<Project, 'id' | 'name'>;

export default function SumitalsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [sumitals, setSumitals] = useState<Sumital[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SumitalFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sumitalToDelete, setSumitalToDelete] = useState<Sumital | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchSumitals();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchSumitals();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filters]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar proyectos');
    }
  };

  const fetchSumitals = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (filters.project_id) params.append('project_id', filters.project_id);
      if (filters.supplier_name) params.append('supplier_name', filters.supplier_name);
      if (filters.is_approved !== undefined) params.append('is_approved', String(filters.is_approved));
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.country_of_origin) params.append('country_of_origin', filters.country_of_origin);
      if (filters.price_min) params.append('price_min', String(filters.price_min));
      if (filters.price_max) params.append('price_max', String(filters.price_max));
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/sumitals?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar sumitals');
      }

      setSumitals(result.sumitals || []);
    } catch (error) {
      console.error('Error fetching sumitals:', error);
      toast.error('Error al cargar sumitals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sumital: Sumital) => {
    try {
      const response = await fetch(`/api/sumitals/${sumital.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al eliminar sumital');
      }

      toast.success('Sumital eliminado exitosamente');
      fetchSumitals();
      setDeleteDialogOpen(false);
      setSumitalToDelete(null);
    } catch (error) {
      console.error('Error deleting sumital:', error);
      toast.error('Error al eliminar sumital');
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

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const exportToExcel = async () => {
    try {
      if (sumitals.length === 0) {
        toast.error('No hay sumitals para exportar');
        return;
      }

      // Importar la librería de forma perezosa para evitar problemas de SSR y reducir el bundle inicial
      const XLSX = await import('xlsx');

      // Obtener attachments de la tabla sumital_attachments para todos los sumitals
      const sumitalAttachments: { [key: string]: any[] } = {};
      
      for (const sumital of sumitals) {
        try {
          const response = await fetch(`/api/sumitals/attachments?sumital_id=${sumital.id}`);
          if (response.ok) {
            const result = await response.json();
            sumitalAttachments[sumital.id] = result.attachments || [];
          } else {
            sumitalAttachments[sumital.id] = [];
          }
        } catch (error) {
          console.error(`Error fetching attachments for sumital ${sumital.id}:`, error);
          sumitalAttachments[sumital.id] = [];
        }
      }

      // Preparar los datos para exportar
      const exportData = sumitals.map((sumital, index) => {
        // Combinar attachments del campo JSON y de la tabla
        const jsonAttachments = sumital.attached_documents || [];
        const tableAttachments = sumitalAttachments[sumital.id] || [];
        
        // Formatear attachments del campo JSON
        const jsonAttachmentLinks = jsonAttachments.map((doc: any) => `${doc.name}: ${doc.url}`);
        
        // Formatear attachments de la tabla (crear URLs de descarga)
        const tableAttachmentLinks = tableAttachments.map((attachment: any) => {
          const stableUrl = `/api/sumitals/attachments/${attachment.id}/open`;
          return `${attachment.file_name}: ${window.location.origin}${stableUrl}`;
        });
        
        // Combinar todos los enlaces
        const allAttachmentLinks = [...jsonAttachmentLinks, ...tableAttachmentLinks];
        const attachmentLinks = allAttachmentLinks.length > 0 
          ? allAttachmentLinks.join('\n') 
          : 'Sin documentos adjuntos';

        return {
          'No.': index + 1,
          'Número Sumital': sumital.sumital_number,
          'Proyecto': sumital.project?.name || 'N/A',
          'Fecha Proyecto': new Date(sumital.project_date).toLocaleDateString('es-CR'),
          'Descripción Equipo': sumital.equipment_description,
          'Proveedor': sumital.supplier_name,
          'Teléfono Proveedor': sumital.supplier_phone || 'N/A',
          'País de Origen': sumital.country_of_origin || 'N/A',
          'Marca': sumital.brand || 'N/A',
          'Modelo': sumital.model || 'N/A',
          'Período Garantía': sumital.warranty_period || 'N/A',
          'Vida Útil': sumital.useful_life || 'N/A',
          'Precio Total (₡)': sumital.total_price.toLocaleString('es-CR'),
          'Mantenimiento': sumital.maintenance || 'N/A',
          'Capacitación': sumital.training || 'N/A',
          'Estado': sumital.is_approved === null ? 'Pendiente' : 
                   sumital.is_approved ? 'Aprobado' : 'Rechazado',
          'Observaciones': sumital.observations || 'N/A',
          'Aprobado por': sumital.approver_name || 'N/A',
          'Fecha Revisión': sumital.review_date ? 
                           new Date(sumital.review_date).toLocaleDateString('es-CR') : 'N/A',
          'Fecha Creación': new Date(sumital.created_at).toLocaleDateString('es-CR'),
          'Enlaces de Documentos': attachmentLinks
        };
      });

      // Crear el libro de trabajo
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Configurar el ancho de las columnas
      const columnWidths = [
        { wch: 5 },   // No.
        { wch: 15 },  // Número Sumital
        { wch: 25 },  // Proyecto
        { wch: 15 },  // Fecha Proyecto
        { wch: 40 },  // Descripción Equipo
        { wch: 25 },  // Proveedor
        { wch: 15 },  // Teléfono Proveedor
        { wch: 15 },  // País de Origen
        { wch: 15 },  // Marca
        { wch: 15 },  // Modelo
        { wch: 15 },  // Período Garantía
        { wch: 15 },  // Vida Útil
        { wch: 18 },  // Precio Total
        { wch: 30 },  // Mantenimiento
        { wch: 30 },  // Capacitación
        { wch: 12 },  // Estado
        { wch: 30 },  // Observaciones
        { wch: 20 },  // Aprobado por
        { wch: 15 },  // Fecha Revisión
        { wch: 15 },  // Fecha Creación
        { wch: 60 }   // Enlaces de Documentos (más ancho para URLs)
      ];
      worksheet['!cols'] = columnWidths;

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sumitals');

      // Generar el nombre del archivo con fecha y hora
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `sumitals_export_${dateStr}_${timeStr}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Archivo exportado exitosamente: ${fileName}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error al exportar a Excel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6 animate-spin" />
          <span>Cargando sumitals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sumitals</h1>
          <p className="text-muted-foreground">
            Gestión de materiales, productos y equipamiento para proyectos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => exportToExcel()} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={sumitals.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
          <Button onClick={() => router.push('/sumitals/new')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Sumital
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por descripción, proveedor, marca o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <Select
                  value={filters.project_id || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, project_id: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Proveedor"
                  value={filters.supplier_name || ''}
                  onChange={(e) => setFilters({ ...filters, supplier_name: e.target.value || undefined })}
                />

                <Select
                  value={filters.is_approved === null ? 'pending' : filters.is_approved === undefined ? 'all' : String(filters.is_approved)}
                  onValueChange={(value) => {
                    let approvalValue: boolean | null | undefined;
                    if (value === 'pending') approvalValue = null;
                    else if (value === 'true') approvalValue = true;
                    else if (value === 'false') approvalValue = false;
                    else if (value === 'all') approvalValue = undefined;
                    else approvalValue = undefined;
                    setFilters({ ...filters, is_approved: approvalValue });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="true">Aprobado</SelectItem>
                    <SelectItem value="false">Rechazado</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Marca"
                  value={filters.brand || ''}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value || undefined })}
                />

                <Input
                  placeholder="País de origen"
                  value={filters.country_of_origin || ''}
                  onChange={(e) => setFilters({ ...filters, country_of_origin: e.target.value || undefined })}
                />

                <Input
                  type="number"
                  placeholder="Precio mínimo"
                  value={filters.price_min || ''}
                  onChange={(e) => setFilters({ ...filters, price_min: e.target.value ? Number(e.target.value) : undefined })}
                />

                <Input
                  type="number"
                  placeholder="Precio máximo"
                  value={filters.price_max || ''}
                  onChange={(e) => setFilters({ ...filters, price_max: e.target.value ? Number(e.target.value) : undefined })}
                />

                <Button variant="outline" onClick={clearFilters} className="col-span-1">
                  Limpiar Filtros
                </Button>
                <Button 
                  onClick={() => exportToExcel()} 
                  variant="outline" 
                  className="col-span-1 flex items-center gap-2"
                  disabled={sumitals.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Exportar Filtrados
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-4">
        {sumitals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron sumitals</h3>
              <p className="text-muted-foreground text-center mb-4">
                No hay sumitals que coincidan con los criterios de búsqueda.
              </p>
              <Button onClick={() => router.push('/sumitals/new')}>
                Crear primer sumital
              </Button>
            </CardContent>
          </Card>
        ) : (
          sumitals.map((sumital) => (
            <Card key={sumital.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Sumital #{sumital.sumital_number}
                      {getApprovalBadge(sumital.is_approved)}
                    </CardTitle>
                    <CardDescription>
                      {sumital.project?.name} • {new Date(sumital.project_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/sumitals/${sumital.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/sumitals/${sumital.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSumitalToDelete(sumital);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Descripción</p>
                    <p className="text-sm">{sumital.equipment_description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Proveedor</p>
                    <p className="text-sm">{sumital.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Marca/Modelo</p>
                    <p className="text-sm">{sumital.brand || 'N/A'} {sumital.model || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Precio Total</p>
                    <p className="text-sm font-semibold">₡{sumital.total_price.toLocaleString()}</p>
                  </div>
                </div>
                
                {sumital.attached_documents && sumital.attached_documents.length > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {sumital.attached_documents.length} documento(s) adjunto(s)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el sumital #{sumitalToDelete?.sumital_number}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => sumitalToDelete && handleDelete(sumitalToDelete)}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}