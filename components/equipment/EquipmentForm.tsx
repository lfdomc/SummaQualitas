'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { projectService, equipmentService } from '@/lib/supabase/database';
import { Equipment, Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { CalendarIcon, Loader2 } from 'lucide-react';
// Removed date-fns imports due to TypeScript issues
import { cn } from '@/lib/utils';

const equipmentSchema = z.object({
  name: z.string().min(1, 'El nombre del equipo es requerido'),
  code: z.string().min(1, 'El código del equipo es requerido'),
  type: z.string().min(1, 'El tipo de equipo es requerido'),
  model: z.string().optional(),
  brand: z.string().optional(),
  serial_number: z.string().optional(),
  description: z.string().optional(),
  purchase_date: z.date().optional(),
  purchase_price: z.number().min(0, 'El precio no puede ser negativo').optional(),
  current_location: z.string().optional(),
  status: z.enum(['disponible', 'en_uso', 'mantenimiento', 'fuera_servicio']).default('disponible'),
  project_id: z.string().optional(),
  last_maintenance_date: z.date().optional(),
  next_maintenance_date: z.date().optional(),
  maintenance_notes: z.string().optional(),
  specifications: z.string().optional(),
  warranty_expiry: z.date().optional(),
  supplier: z.string().optional(),
  operating_hours: z.number().min(0, 'Las horas de operación no pueden ser negativas').optional(),
  fuel_type: z.string().optional(),
  capacity: z.string().optional()
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  equipment?: Equipment | null;
  projectId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EquipmentForm({ equipment, projectId, onSuccess, onCancel }: EquipmentFormProps) {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: equipment?.name || '',
      code: equipment?.code || '',
      type: equipment?.type || '',
      model: equipment?.model || '',
      brand: equipment?.brand || '',
      serial_number: equipment?.serial_number || '',
      description: equipment?.description || '',
      purchase_date: equipment?.purchase_date ? new Date(equipment.purchase_date) : undefined,
      purchase_price: equipment?.purchase_price || undefined,
      current_location: equipment?.current_location || '',
      status: equipment?.status || 'disponible',
      project_id: equipment?.project_id || projectId || '',
      last_maintenance_date: equipment?.last_maintenance_date ? new Date(equipment.last_maintenance_date) : undefined,
      next_maintenance_date: equipment?.next_maintenance_date ? new Date(equipment.next_maintenance_date) : undefined,
      maintenance_notes: equipment?.maintenance_notes || '',
      specifications: equipment?.specifications || '',
      warranty_expiry: equipment?.warranty_expiry ? new Date(equipment.warranty_expiry) : undefined,
      supplier: equipment?.supplier || '',
      operating_hours: equipment?.operating_hours || undefined,
      fuel_type: equipment?.fuel_type || '',
      capacity: equipment?.capacity || ''
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
  
      const projectsData = await projectService.getProjects();
      setProjects(projectsData.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar los datos iniciales');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      setLoading(true);

      
      const equipmentData = {
        ...data,
        purchase_date: data.purchase_date?.toISOString(),
        last_maintenance_date: data.last_maintenance_date?.toISOString(),
        next_maintenance_date: data.next_maintenance_date?.toISOString(),
        warranty_expiry: data.warranty_expiry?.toISOString(),
        created_by: user?.id
      };

      if (equipment) {
        await equipmentService.updateEquipment(equipment.id, equipmentData);
        toast.success('Equipo actualizado exitosamente');
      } else {
        await equipmentService.createEquipment(equipmentData);
        toast.success('Equipo creado exitosamente');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast.error(equipment ? 'Error al actualizar el equipo' : 'Error al crear el equipo');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando datos...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Información Básica</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Equipment Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Equipo *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: Excavadora CAT 320"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Equipment Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Código *</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="Ej: EQ-001"
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Equipment Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select
              value={watchedValues.type}
              onValueChange={(value) => setValue('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heavy_machinery">Maquinaria Pesada</SelectItem>
                <SelectItem value="tools">Herramientas</SelectItem>
                <SelectItem value="vehicles">Vehículos</SelectItem>
                <SelectItem value="safety">Seguridad</SelectItem>
                <SelectItem value="measuring">Medición</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              {...register('brand')}
              placeholder="Ej: Caterpillar"
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Input
              id="model"
              {...register('model')}
              placeholder="Ej: 320D"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Serial Number */}
          <div className="space-y-2">
            <Label htmlFor="serial_number">Número de Serie</Label>
            <Input
              id="serial_number"
              {...register('serial_number')}
              placeholder="Número de serie del fabricante"
            />
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor</Label>
            <Input
              id="supplier"
              {...register('supplier')}
              placeholder="Nombre del proveedor"
            />
          </div>
        </div>
      </div>

      {/* Status and Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Estado y Ubicación</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={watchedValues.status}
              onValueChange={(value: 'disponible' | 'en_uso' | 'mantenimiento' | 'fuera_servicio') => setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="in_use">En Uso</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="out_of_service">Fuera de Servicio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Current Location */}
          <div className="space-y-2">
            <Label htmlFor="current_location">Ubicación Actual</Label>
            <Input
              id="current_location"
              {...register('current_location')}
              placeholder="Ej: Almacén Central, Obra A"
            />
          </div>

          {/* Project Assignment */}
          <div className="space-y-2">
            <Label htmlFor="project_id">Proyecto Asignado</Label>
            <Select
              value={watchedValues.project_id}
              onValueChange={(value) => setValue('project_id', value)}
              disabled={!!projectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Purchase Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Información de Compra</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Purchase Date */}
          <div className="space-y-2">
            <Label>Fecha de Compra</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchedValues.purchase_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedValues.purchase_date ? (
                    watchedValues.purchase_date.toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watchedValues.purchase_date}
                  onSelect={(date) => setValue('purchase_date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Purchase Price */}
          <div className="space-y-2">
            <Label htmlFor="purchase_price">Precio de Compra</Label>
            <Input
              id="purchase_price"
              type="number"
              step="0.01"
              {...register('purchase_price', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.purchase_price && (
              <p className="text-sm text-destructive">{errors.purchase_price.message}</p>
            )}
          </div>

          {/* Warranty Expiry */}
          <div className="space-y-2">
            <Label>Vencimiento de Garantía</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchedValues.warranty_expiry && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedValues.warranty_expiry ? (
                    watchedValues.warranty_expiry.toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watchedValues.warranty_expiry}
                  onSelect={(date) => setValue('warranty_expiry', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Especificaciones Técnicas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidad</Label>
            <Input
              id="capacity"
              {...register('capacity')}
              placeholder="Ej: 20 toneladas, 500 litros"
            />
          </div>

          {/* Fuel Type */}
          <div className="space-y-2">
            <Label htmlFor="fuel_type">Tipo de Combustible</Label>
            <Select
              value={watchedValues.fuel_type}
              onValueChange={(value) => setValue('fuel_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar combustible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No aplica</SelectItem>
                <SelectItem value="diesel">Diésel</SelectItem>
                <SelectItem value="gasoline">Gasolina</SelectItem>
                <SelectItem value="electric">Eléctrico</SelectItem>
                <SelectItem value="hybrid">Híbrido</SelectItem>
                <SelectItem value="gas">Gas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operating Hours */}
          <div className="space-y-2">
            <Label htmlFor="operating_hours">Horas de Operación</Label>
            <Input
              id="operating_hours"
              type="number"
              step="0.1"
              {...register('operating_hours', { valueAsNumber: true })}
              placeholder="0.0"
            />
            {errors.operating_hours && (
              <p className="text-sm text-destructive">{errors.operating_hours.message}</p>
            )}
          </div>
        </div>

        {/* Specifications */}
        <div className="space-y-2">
          <Label htmlFor="specifications">Especificaciones Detalladas</Label>
          <Textarea
            id="specifications"
            {...register('specifications')}
            placeholder="Especificaciones técnicas detalladas del equipo..."
            rows={3}
          />
        </div>
      </div>

      {/* Maintenance Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Información de Mantenimiento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Last Maintenance Date */}
          <div className="space-y-2">
            <Label>Último Mantenimiento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchedValues.last_maintenance_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedValues.last_maintenance_date ? (
                    watchedValues.last_maintenance_date.toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watchedValues.last_maintenance_date}
                  onSelect={(date) => setValue('last_maintenance_date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Next Maintenance Date */}
          <div className="space-y-2">
            <Label>Próximo Mantenimiento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchedValues.next_maintenance_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedValues.next_maintenance_date ? (
                    watchedValues.next_maintenance_date.toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watchedValues.next_maintenance_date}
                  onSelect={(date) => setValue('next_maintenance_date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Maintenance Notes */}
        <div className="space-y-2">
          <Label htmlFor="maintenance_notes">Notas de Mantenimiento</Label>
          <Textarea
            id="maintenance_notes"
            {...register('maintenance_notes')}
            placeholder="Historial y notas de mantenimiento..."
            rows={3}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción General</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descripción general del equipo, uso previsto, características especiales..."
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {equipment ? 'Actualizar' : 'Crear'} Equipo
        </Button>
      </div>
    </form>
  );
}