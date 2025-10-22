'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { ProjectService } from '@/lib/supabase/database';
import { Project, ProjectStatus, CreateProjectDTO, UpdateProjectDTO, Client, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { CalendarIcon, Loader2, Save, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { BudgetPercentageBreakdown, BudgetBreakdownData } from './BudgetPercentageBreakdown';

const projectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo'),
  description: z.string().optional(),
  client_id: z.string().uuid('Selecciona un cliente válido'),
  manager_id: z.string().uuid('Selecciona un gerente válido').optional(),
  status: z.enum(['planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado']),
  location: z.string().optional(),
  exchange_rate_usd: z.number().min(0, 'El tipo de cambio debe ser mayor a 0').default(500),
  total_area: z.number().min(0, 'El área total debe ser mayor a 0').optional(),
  // Presupuesto
  presupuesto_inicial: z.number().min(0, 'El presupuesto debe ser mayor a 0').default(0),
  presupuesto_original: z.number().min(0, 'El presupuesto original debe ser mayor a 0').default(0),
  presupuesto_final: z.number().min(0, 'El presupuesto final debe ser mayor a 0').default(0),
  // Campos de desglose presupuestario (usando nombres reales de la BD)
  costos_directos: z.number().min(0, 'Los costos directos deben ser mayor o igual a 0').default(0),
  costos_indirectos: z.number().min(0, 'Los costos indirectos deben ser mayor o igual a 0').default(0),
  administracion: z.number().min(0, 'Los gastos de administración deben ser mayor o igual a 0').default(0),
  mano_obra: z.number().min(0, 'La mano de obra debe ser mayor o igual a 0').default(0),
  imprevistos: z.number().min(0, 'Los imprevistos deben ser mayor o igual a 0').default(0),
  utilidad: z.number().min(0, 'La utilidad debe ser mayor o igual a 0').default(0),
  // Campos de porcentajes
  costos_directos_porcentaje: z.number().min(0).max(100).default(0),
  costos_indirectos_porcentaje: z.number().min(0).max(100).default(0),
  mano_obra_porcentaje: z.number().min(0).max(100).default(0),
  administracion_porcentaje: z.number().min(0).max(100).default(0),
  imprevistos_porcentaje: z.number().min(0).max(100).default(0),
  utilidad_porcentaje: z.number().min(0).max(100).default(0),
  // Fechas usando nombres de la base de datos
  estimated_start_date: z.date().optional(),
  estimated_end_date: z.date().optional(),
  actual_start_date: z.date().optional(),
  actual_end_date: z.date().optional()
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
  onSuccess?: (project: Project) => void;
  onCancel?: () => void;
}

export default function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const { user } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdownData | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Estados para controlar los popovers de fechas
  const [datePopovers, setDatePopovers] = useState({
    estimated_start_date: false,
    estimated_end_date: false,
    actual_start_date: false,
    actual_end_date: false
  });

  const isEditing = !!project;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      client_id: project?.client_id || undefined,
      manager_id: project?.manager_id || undefined,
      status: project?.status || 'planificacion',
      location: project?.location || '',
      exchange_rate_usd: project?.exchange_rate_usd || 500,
      total_area: project?.total_area || undefined,
      // Presupuesto
      presupuesto_inicial: project?.presupuesto_inicial || 0,
      presupuesto_original: project?.presupuesto_original || 0,
      presupuesto_final: project?.presupuesto_final || 0,
      // Campos de desglose presupuestario (usando nombres reales de la BD)
      costos_directos: project?.costos_directos || 0,
    costos_indirectos: project?.costos_indirectos || 0,
    administracion: project?.administracion || 0,
    mano_obra: project?.mano_obra || 0,
    imprevistos: project?.imprevistos || 0,
    utilidad: project?.utilidad || 0,
      // Campos de porcentajes
      costos_directos_porcentaje: project?.costos_directos_porcentaje || 0,
      costos_indirectos_porcentaje: project?.costos_indirectos_porcentaje || 0,
      mano_obra_porcentaje: project?.mano_obra_porcentaje || 0,
      administracion_porcentaje: project?.administracion_porcentaje || 0,
      imprevistos_porcentaje: project?.imprevistos_porcentaje || 0,
      utilidad_porcentaje: project?.utilidad_porcentaje || 0,
      // Fechas usando nombres de la base de datos
      estimated_start_date: project?.estimated_start_date ? new Date(project.estimated_start_date) : undefined,
      estimated_end_date: project?.estimated_end_date ? new Date(project.estimated_end_date) : undefined,
      actual_start_date: project?.actual_start_date ? new Date(project.actual_start_date) : undefined,
      actual_end_date: project?.actual_end_date ? new Date(project.actual_end_date) : undefined
    }
  });

  useEffect(() => {
    loadFormData();
  }, []);

  // Initialize budget breakdown when editing an existing project
  useEffect(() => {
    const finalBudget = project?.presupuesto_final || project?.presupuesto_inicial || 0;
    if (project && finalBudget > 0) {
      const budget = finalBudget;
      
      // Calculate percentages from absolute values
      const initialBreakdown: BudgetBreakdownData = {
        costos_directos_porcentaje: budget > 0 ? Math.round((project.costos_directos || 0) / budget * 100 * 100) / 100 : 0,
        costos_indirectos_porcentaje: budget > 0 ? Math.round((project.costos_indirectos || 0) / budget * 100 * 100) / 100 : 0,
        mano_obra_porcentaje: budget > 0 ? Math.round((project.mano_obra || 0) / budget * 100 * 100) / 100 : 0,
        administracion_porcentaje: budget > 0 ? Math.round((project.administracion || 0) / budget * 100 * 100) / 100 : 0,
        imprevistos_porcentaje: budget > 0 ? Math.round((project.imprevistos || 0) / budget * 100 * 100) / 100 : 0,
        utilidad_porcentaje: budget > 0 ? Math.round((project.utilidad || 0) / budget * 100 * 100) / 100 : 0,
        // Absolute values
        costos_directos: project.costos_directos || 0,
        costos_indirectos: project.costos_indirectos || 0,
        mano_obra: project.mano_obra || 0,
        administracion: project.administracion || 0,
        imprevistos: project.imprevistos || 0,
        utilidad: project.utilidad || 0,
      };
      
      setBudgetBreakdown(initialBreakdown);
      setShowBreakdown(true);
    }
  }, [project]);

  // Watch budget changes to show/hide breakdown
  const watchedBudgetInicial = form.watch('presupuesto_inicial');
  const watchedBudgetFinal = form.watch('presupuesto_final');
  useEffect(() => {
    const budget = watchedBudgetFinal || watchedBudgetInicial;
    if (budget && budget > 0) {
      setShowBreakdown(true);
    } else {
      setShowBreakdown(false);
    }
  }, [watchedBudgetInicial, watchedBudgetFinal]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      
      const projectServiceInstance = new ProjectService(false); // false = client-side
      
      const clientsData = await projectServiceInstance.getClients();
      const managersData = await projectServiceInstance.getManagers();
      
      setClients(clientsData);
      setManagers(managersData);
    } catch (error) {
      toast.error(`Error al cargar los datos del formulario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    console.log('ProjectForm onSubmit triggered with data:', data);
    const projectData = {
      ...data,
      // No ajustar 'budget' durante edición: evita violar constraints.
      // Para creación, se calculará explícitamente más abajo.
      estimated_start_date: data.estimated_start_date?.toISOString().split('T')[0],
      estimated_end_date: data.estimated_end_date?.toISOString().split('T')[0],
      actual_start_date: data.actual_start_date?.toISOString().split('T')[0],
      actual_end_date: data.actual_end_date?.toISOString().split('T')[0],
      // El presupuesto se calcula automáticamente desde los campos de desglose cuando corresponde.
    };

    try {
      setLoading(true);

      let result: Project;
      
      if (isEditing && project) {
        // Para edición, usar API route con PATCH para obtener datos frescos y mejores errores
        const updateData: UpdateProjectDTO = {
          ...projectData,
        } as UpdateProjectDTO;

        // No enviar 'budget' en edición para no resetearlo a 0 accidentalmente
        // (Si existe en el objeto por alguna razón, elimínalo)
        delete (updateData as any).budget;

        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        console.log('ProjectForm PATCH response status:', response.status);
        const responseData = await response.json();
        console.log('ProjectForm PATCH response data:', responseData);

        if (!response.ok || !responseData.success) {
          throw new Error(responseData.error || 'Error al actualizar el proyecto');
        }

        result = responseData.data;
        toast.success('Proyecto actualizado correctamente');
      } else {
        // Para creación, usar la API route
        const createData: CreateProjectDTO = {
          ...projectData,
          // En creación sí establecemos budget desde presupuesto_inicial
          budget: data.presupuesto_inicial || 0,
        } as CreateProjectDTO;
        
        const response = await fetch('/api/projects?debug=1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createData),
        });

        console.log('ProjectForm submit response status:', response.status);
        const responseData = await response.json();
        console.log('ProjectForm submit response data:', responseData);

        if (!response.ok) {
          throw new Error(responseData.error || 'Error al crear el proyecto');
        }

        if (!responseData.success) {
          throw new Error(responseData.error || 'Error al crear el proyecto');
        }

        result = responseData.data;
        toast.success('Proyecto creado correctamente');
      }

      // Tras guardar, asegura que la UI revalide y muestre datos actualizados
      if (onSuccess) {
        onSuccess(result);
      } else {
        // Navega al detalle del proyecto para forzar lectura fresca
        router.push(`/projects/${result.id}`);
      }
      // Fuerza revalidación del router para evitar valores en caché
      router.refresh();
    } catch (error) {
      // Error details handled by toast message
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar el proyecto';
      toast.error(isEditing ? `Error al actualizar el proyecto: ${errorMessage}` : `Error al crear el proyecto: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  if (loadingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Cargando formulario...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Modifica la información del proyecto'
            : 'Completa la información para crear un nuevo proyecto'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log('ProjectForm validation errors:', errors);
            toast.error('Por favor revisa los campos requeridos');
          })} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Proyecto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Construcción Edificio Residencial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planificacion">Planificación</SelectItem>
                        <SelectItem value="en_progreso">En Progreso</SelectItem>
                        <SelectItem value="pausado">Pausado</SelectItem>
                        <SelectItem value="completado">Completado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Manager */}
              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gerente del Proyecto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un gerente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name || manager.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />



              {/* Exchange Rate USD */}
              <FormField
                control={form.control}
                name="exchange_rate_usd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cambio USD</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="500"
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        onFocus={() => {
                          if (field.value === 0) {
                            field.onChange('');
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                        Tipo de cambio de colones costarricenses a dólares americanos (CRC a USD)
                      </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total Area */}
              <FormField
                control={form.control}
                name="total_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Total</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={field.value === 0 ? '' : field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        onFocus={() => {
                          if (field.value === 0) {
                            field.onChange('');
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Área total del proyecto en m²
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Initial Budget */}
              <FormField
                control={form.control}
                name="presupuesto_inicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presupuesto Inicial *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        onFocus={() => {
                          if (field.value === 0) {
                            // mostrar vacío para facilitar edición
                            field.onChange('');
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                        Presupuesto inicial del proyecto en colones costarricenses (CRC)
                      </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />



              {/* Fecha Inicio Estimada */}
              <FormField
                control={form.control}
                name="estimated_start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Inicio Estimada</FormLabel>
                    <Popover 
                      open={datePopovers.estimated_start_date} 
                      onOpenChange={(open) => setDatePopovers(prev => ({ ...prev, estimated_start_date: open }))}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                                new Date(field.value).toLocaleDateString('es-CR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setDatePopovers(prev => ({ ...prev, estimated_start_date: false }));
                          }}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha Fin Estimada */}
              <FormField
                control={form.control}
                name="estimated_end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Fin Estimada</FormLabel>
                    <Popover 
                      open={datePopovers.estimated_end_date} 
                      onOpenChange={(open) => setDatePopovers(prev => ({ ...prev, estimated_end_date: open }))}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                                new Date(field.value).toLocaleDateString('es-CR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setDatePopovers(prev => ({ ...prev, estimated_end_date: false }));
                          }}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha Inicio Real */}
              <FormField
                control={form.control}
                name="actual_start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Inicio Real</FormLabel>
                    <Popover 
                      open={datePopovers.actual_start_date} 
                      onOpenChange={(open) => setDatePopovers(prev => ({ ...prev, actual_start_date: open }))}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                                new Date(field.value).toLocaleDateString('es-CR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setDatePopovers(prev => ({ ...prev, actual_start_date: false }));
                          }}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha Fin Real */}
              <FormField
                control={form.control}
                name="actual_end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Fin Real</FormLabel>
                    <Popover 
                      open={datePopovers.actual_end_date} 
                      onOpenChange={(open) => setDatePopovers(prev => ({ ...prev, actual_end_date: open }))}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                                new Date(field.value).toLocaleDateString('es-CR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setDatePopovers(prev => ({ ...prev, actual_end_date: false }));
                          }}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Guanacaste, Costa Rica" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el proyecto, objetivos, alcance, etc."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget Breakdown Section with Dynamic Percentages */}
            {(form.watch('presupuesto_final') > 0 || form.watch('presupuesto_inicial') > 0) && (form.watch('exchange_rate_usd') || 0) > 0 && (form.watch('total_area') || 0) > 0 && (
              <div className="space-y-4">
                <BudgetPercentageBreakdown 
                  budget={form.watch('presupuesto_final') || form.watch('presupuesto_inicial')}
                  exchangeRate={form.watch('exchange_rate_usd') || 500}
                  totalArea={form.watch('total_area') || 0}
                  onBreakdownChange={(breakdown) => {
                    // Actualizar los campos del formulario con los valores calculados
                    // Mapear los campos del breakdown a los campos reales de la base de datos
                    const budget = form.watch('presupuesto_final') || form.watch('presupuesto_inicial');
                    
                    // Guardar los montos calculados (usando nombres de columnas correctos de la BD)
                    form.setValue('costos_directos', Math.round((budget * breakdown.costos_directos_porcentaje) / 100));
                    form.setValue('costos_indirectos', Math.round((budget * breakdown.costos_indirectos_porcentaje) / 100));
                    form.setValue('administracion', Math.round((budget * breakdown.administracion_porcentaje) / 100));
                    form.setValue('mano_obra', Math.round((budget * breakdown.mano_obra_porcentaje) / 100));
                    form.setValue('imprevistos', Math.round((budget * breakdown.imprevistos_porcentaje) / 100));
                    form.setValue('utilidad', Math.round((budget * breakdown.utilidad_porcentaje) / 100));
                    
                    // Guardar los porcentajes
                    form.setValue('costos_directos_porcentaje', breakdown.costos_directos_porcentaje);
                    form.setValue('costos_indirectos_porcentaje', breakdown.costos_indirectos_porcentaje);
                    form.setValue('mano_obra_porcentaje', breakdown.mano_obra_porcentaje);
                    form.setValue('administracion_porcentaje', breakdown.administracion_porcentaje);
                    form.setValue('imprevistos_porcentaje', breakdown.imprevistos_porcentaje);
                    form.setValue('utilidad_porcentaje', breakdown.utilidad_porcentaje);
                    
                    setBudgetBreakdown(breakdown);
                  }}
                  initialBreakdown={budgetBreakdown || undefined}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Actualizar' : 'Crear'} Proyecto
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}