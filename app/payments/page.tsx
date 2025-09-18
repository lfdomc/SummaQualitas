'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Building2,
  User,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import type { 
  ClientPayment, 
  SupplierPayment, 
  Project, 
  Client, 
  Supplier,
  CreateClientPaymentData,
  CreateSupplierPaymentData
} from '@/types/database';

// Interfaces para formularios
interface CreateClientPaymentForm {
  project_id?: string;
  client_id?: string;
  invoice_id?: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface CreateSupplierPaymentForm {
  project_id?: string;
  supplier_id?: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  description?: string;
  category?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Estados iniciales de formularios
const initialClientPaymentForm: CreateClientPaymentForm = {
  project_id: '',
  client_id: '',
  invoice_id: '',
  payment_date: new Date().toISOString().split('T')[0],
  amount: 0,
  payment_method: '',
  reference_number: '',
  notes: '',
  status: 'confirmed'
};

const initialSupplierPaymentForm: CreateSupplierPaymentForm = {
  project_id: '',
  supplier_id: '',
  payment_date: new Date().toISOString().split('T')[0],
  amount: 0,
  payment_method: '',
  reference_number: '',
  description: '',
  category: '',
  notes: '',
  status: 'confirmed'
};

// Mock data
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Construcción Edificio Central',
    description: 'Proyecto de construcción de edificio corporativo',
    status: 'active',
    client_id: '1',
    manager_id: '1',
    presupuesto_inicial: 2500000,
    costos_directos_materiales: 800000,
    costos_directos_equipos: 400000,
    costos_indirectos: 300000,
    gastos_administrativos: 200000,
    mano_obra_quincenal: 600000,
    imprevistos: 100000,
    utilidad_esperada: 100000,
    budget: 2500000,
    estimated_start_date: '2024-01-15',
    estimated_end_date: '2024-12-15',
    actual_start_date: '2024-01-20',
    location: 'Ciudad de México',
    presupuesto_original: 2500000,
    presupuesto_final: 2500000,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  },
  {
    id: '2',
    name: 'Remodelación Oficinas Norte',
    description: 'Remodelación completa de oficinas',
    status: 'active',
    client_id: '2',
    manager_id: '2',
    presupuesto_inicial: 800000,
    costos_directos_materiales: 300000,
    costos_directos_equipos: 150000,
    costos_indirectos: 100000,
    gastos_administrativos: 80000,
    mano_obra_quincenal: 120000,
    imprevistos: 30000,
    utilidad_esperada: 20000,
    budget: 800000,
    estimated_start_date: '2024-03-01',
    estimated_end_date: '2024-08-30',
    location: 'Guadalajara',
    presupuesto_original: 800000,
    presupuesto_final: 800000,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z'
  }
];

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Corporativo ABC',
    contact_name: 'Juan Pérez',
    email: 'juan.perez@abc.com',
    phone: '+52 55 1234 5678',
    address: 'Av. Reforma 123, CDMX',
    tax_id: 'ABC123456789',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Inmobiliaria XYZ',
    contact_name: 'María González',
    email: 'maria@xyz.com',
    phone: '+52 33 9876 5432',
    address: 'Av. Chapultepec 456, GDL',
    tax_id: 'XYZ987654321',
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
];

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Materiales del Norte SA',
    contact_name: 'Carlos Rodríguez',
    email: 'carlos@materialnorte.com',
    phone: '+52 81 1111 2222',
    address: 'Industrial Norte 789, MTY',
    tax_id: 'MDN111222333',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Equipos y Herramientas SA',
    contact_name: 'Ana López',
    email: 'ana@equipos.com',
    phone: '+52 55 3333 4444',
    address: 'Zona Industrial 321, CDMX',
    tax_id: 'EQH333444555',
    is_active: true,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  }
];

const mockClientPayments: ClientPayment[] = [
  {
    id: '1',
    project_id: '1',
    client_id: '1',
    payment_date: '2024-01-25',
    amount: 500000,
    payment_method: 'transferencia',
    reference_number: 'TRF-001-2024',
    notes: 'Primer pago del proyecto',
    status: 'confirmed',
    created_at: '2024-01-25T00:00:00Z',
    updated_at: '2024-01-25T00:00:00Z'
  },
  {
    id: '2',
    project_id: '1',
    client_id: '1',
    payment_date: '2024-02-15',
    amount: 750000,
    payment_method: 'cheque',
    reference_number: 'CHQ-002-2024',
    notes: 'Segundo pago según cronograma',
    status: 'confirmed',
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z'
  },
  {
    id: '3',
    project_id: '2',
    client_id: '2',
    payment_date: '2024-03-05',
    amount: 150000,
    payment_method: 'transferencia',
    reference_number: 'TRF-003-2024',
    notes: 'Anticipo del proyecto',
    status: 'pending',
    created_at: '2024-03-05T00:00:00Z',
    updated_at: '2024-03-05T00:00:00Z'
  }
];

const mockSupplierPayments: SupplierPayment[] = [
  {
    id: '1',
    project_id: '1',
    supplier_id: '1',
    payment_date: '2024-01-30',
    amount: 125000,
    payment_method: 'transferencia',
    reference_number: 'PAG-001-2024',
    description: 'Pago por materiales de construcción',
    category: 'materiales',
    notes: 'Cemento, varillas y agregados',
    status: 'confirmed',
    created_at: '2024-01-30T00:00:00Z',
    updated_at: '2024-01-30T00:00:00Z'
  },
  {
    id: '2',
    project_id: '1',
    supplier_id: '2',
    payment_date: '2024-02-10',
    amount: 85000,
    payment_method: 'cheque',
    reference_number: 'PAG-002-2024',
    description: 'Alquiler de maquinaria pesada',
    category: 'equipos',
    notes: 'Excavadora y grúa por 2 semanas',
    status: 'confirmed',
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-10T00:00:00Z'
  },
  {
    id: '3',
    project_id: '2',
    supplier_id: '1',
    payment_date: '2024-03-01',
    amount: 45000,
    payment_method: 'transferencia',
    reference_number: 'PAG-003-2024',
    description: 'Materiales para remodelación',
    category: 'materiales',
    notes: 'Pintura, pisos y acabados',
    status: 'pending',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z'
  }
];

export default function PaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const permissions = usePermissions();

  // Estados
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de diálogos
  const [isClientPaymentDialogOpen, setIsClientPaymentDialogOpen] = useState(false);
  const [isSupplierPaymentDialogOpen, setIsSupplierPaymentDialogOpen] = useState(false);
  
  // Estados de formularios
  const [clientPaymentForm, setClientPaymentForm] = useState<CreateClientPaymentForm>(initialClientPaymentForm);
  const [supplierPaymentForm, setSupplierPaymentForm] = useState<CreateSupplierPaymentForm>(initialSupplierPaymentForm);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Cargar datos
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setClientPayments(mockClientPayments);
      setSupplierPayments(mockSupplierPayments);
      setProjects(mockProjects);
      setClients(mockClients);
      setSuppliers(mockSuppliers);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Funciones utilitarias
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Cálculos de estadísticas
  const clientPaymentStats = {
    total: clientPayments.reduce((sum, payment) => sum + payment.amount, 0),
    confirmed: clientPayments.filter(p => p.status === 'confirmed').reduce((sum, payment) => sum + payment.amount, 0),
    pending: clientPayments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0),
    count: clientPayments.length
  };

  const supplierPaymentStats = {
    total: supplierPayments.reduce((sum, payment) => sum + payment.amount, 0),
    confirmed: supplierPayments.filter(p => p.status === 'confirmed').reduce((sum, payment) => sum + payment.amount, 0),
    pending: supplierPayments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0),
    count: supplierPayments.length
  };

  // Filtrar pagos
  const filteredClientPayments = clientPayments.filter(payment => {
    const matchesSearch = payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clients.find(c => c.id === payment.client_id)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         projects.find(p => p.id === payment.project_id)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesProject = projectFilter === 'all' || payment.project_id === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  const filteredSupplierPayments = supplierPayments.filter(payment => {
    const matchesSearch = payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suppliers.find(s => s.id === payment.supplier_id)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         projects.find(p => p.id === payment.project_id)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesProject = projectFilter === 'all' || payment.project_id === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Manejar creación de pago de cliente
  const handleCreateClientPayment = async () => {
    try {
      // Validaciones básicas
      if (!clientPaymentForm.project_id || !clientPaymentForm.client_id || clientPaymentForm.amount <= 0) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPayment: ClientPayment = {
        id: Date.now().toString(),
        ...clientPaymentForm,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setClientPayments(prev => [newPayment, ...prev]);
      setClientPaymentForm(initialClientPaymentForm);
      setIsClientPaymentDialogOpen(false);
      toast.success('Pago de cliente creado exitosamente');
    } catch (error) {
      console.error('Error creating client payment:', error);
      toast.error('Error al crear el pago de cliente');
    }
  };

  // Manejar creación de pago a proveedor
  const handleCreateSupplierPayment = async () => {
    try {
      // Validaciones básicas
      if (!supplierPaymentForm.project_id || !supplierPaymentForm.supplier_id || supplierPaymentForm.amount <= 0) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPayment: SupplierPayment = {
        id: Date.now().toString(),
        ...supplierPaymentForm,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setSupplierPayments(prev => [newPayment, ...prev]);
      setSupplierPaymentForm(initialSupplierPaymentForm);
      setIsSupplierPaymentDialogOpen(false);
      toast.success('Pago a proveedor creado exitosamente');
    } catch (error) {
      console.error('Error creating supplier payment:', error);
      toast.error('Error al crear el pago a proveedor');
    }
  };

  // Manejar eliminación de pagos
  const handleDeleteClientPayment = async (id: string) => {
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setClientPayments(prev => prev.filter(payment => payment.id !== id));
      toast.success('Pago de cliente eliminado');
    } catch (error) {
      console.error('Error deleting client payment:', error);
      toast.error('Error al eliminar el pago');
    }
  };

  const handleDeleteSupplierPayment = async (id: string) => {
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSupplierPayments(prev => prev.filter(payment => payment.id !== id));
      toast.success('Pago a proveedor eliminado');
    } catch (error) {
      console.error('Error deleting supplier payment:', error);
      toast.error('Error al eliminar el pago');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!permissions.canViewPayments) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
          <p className="text-muted-foreground mt-1">
            Administra los pagos de clientes y pagos a proveedores
          </p>
        </div>
        <div className="flex space-x-2">
          {permissions.canManagePayments && (
            <>
              <Dialog open={isClientPaymentDialogOpen} onOpenChange={setIsClientPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Pago Cliente
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={isSupplierPaymentDialogOpen} onOpenChange={setIsSupplierPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Pago Proveedor
                  </Button>
                </DialogTrigger>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(clientPaymentStats.total)}</p>
                <p className="text-xs text-muted-foreground">{clientPaymentStats.count} pagos</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Egresos Totales</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(supplierPaymentStats.total)}</p>
                <p className="text-xs text-muted-foreground">{supplierPaymentStats.count} pagos</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flujo Neto</p>
                <p className={`text-2xl font-bold ${
                  clientPaymentStats.total - supplierPaymentStats.total >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(clientPaymentStats.total - supplierPaymentStats.total)}
                </p>
                <p className="text-xs text-muted-foreground">Balance actual</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(clientPaymentStats.pending + supplierPaymentStats.pending)}
                </p>
                <p className="text-xs text-muted-foreground">Por confirmar</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por referencia, cliente, proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project">Proyecto</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los proyectos" />
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Período</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los períodos</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="quarter">Este trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para pagos */}
      <Tabs defaultValue="client-payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="client-payments" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Pagos de Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="supplier-payments" className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4" />
            <span>Pagos a Proveedores</span>
          </TabsTrigger>
        </TabsList>

        {/* Pagos de Clientes */}
        <TabsContent value="client-payments">
          <Card>
            <CardHeader>
              <CardTitle>Pagos de Clientes</CardTitle>
              <CardDescription>
                Gestiona los pagos recibidos de los clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredClientPayments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay pagos de clientes</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                      ? 'No se encontraron pagos con los filtros aplicados.'
                      : 'Aún no se han registrado pagos de clientes.'}
                  </p>
                  {permissions.canManagePayments && (
                    <Button onClick={() => setIsClientPaymentDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Primer Pago
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientPayments.map((payment) => {
                      const project = projects.find(p => p.id === payment.project_id);
                      const client = clients.find(c => c.id === payment.client_id);
                      
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.reference_number}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{project?.name || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{client?.name || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(payment.payment_date).toLocaleDateString('es-MX')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize">{payment.payment_method}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(payment.status)} className="flex items-center space-x-1">
                              {getStatusIcon(payment.status)}
                              <span>{getStatusLabel(payment.status)}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" title="Ver detalles">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {permissions.canManagePayments && (
                                <>
                                  <Button variant="ghost" size="sm" title="Editar">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="Eliminar"
                                    onClick={() => handleDeleteClientPayment(payment.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagos a Proveedores */}
        <TabsContent value="supplier-payments">
          <Card>
            <CardHeader>
              <CardTitle>Pagos a Proveedores</CardTitle>
              <CardDescription>
                Gestiona los pagos realizados a proveedores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSupplierPayments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay pagos a proveedores</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                      ? 'No se encontraron pagos con los filtros aplicados.'
                      : 'Aún no se han registrado pagos a proveedores.'}
                  </p>
                  {permissions.canManagePayments && (
                    <Button onClick={() => setIsSupplierPaymentDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Primer Pago
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSupplierPayments.map((payment) => {
                      const project = projects.find(p => p.id === payment.project_id);
                      const supplier = suppliers.find(s => s.id === payment.supplier_id);
                      
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.reference_number}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{project?.name || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{supplier?.name || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(payment.payment_date).toLocaleDateString('es-MX')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-red-600">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {payment.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(payment.status)} className="flex items-center space-x-1">
                              {getStatusIcon(payment.status)}
                              <span>{getStatusLabel(payment.status)}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" title="Ver detalles">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {permissions.canManagePayments && (
                                <>
                                  <Button variant="ghost" size="sm" title="Editar">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="Eliminar"
                                    onClick={() => handleDeleteSupplierPayment(payment.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para crear pago de cliente */}
      <Dialog open={isClientPaymentDialogOpen} onOpenChange={setIsClientPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Registrar Pago de Cliente</DialogTitle>
            <DialogDescription>
              Registra un nuevo pago recibido de un cliente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-project">Proyecto *</Label>
                <Select 
                  value={clientPaymentForm.project_id} 
                  onValueChange={(value) => setClientPaymentForm(prev => ({ ...prev, project_id: value }))}
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
                <Label htmlFor="client">Cliente *</Label>
                <Select 
                  value={clientPaymentForm.client_id} 
                  onValueChange={(value) => setClientPaymentForm(prev => ({ ...prev, client_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-payment-date">Fecha de Pago *</Label>
                <Input
                  id="client-payment-date"
                  type="date"
                  value={clientPaymentForm.payment_date}
                  onChange={(e) => setClientPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client-amount">Monto *</Label>
                <Input
                  id="client-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={clientPaymentForm.amount || ''}
                  onChange={(e) => setClientPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-payment-method">Método de Pago</Label>
                <Select 
                  value={clientPaymentForm.payment_method} 
                  onValueChange={(value) => setClientPaymentForm(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client-reference">Número de Referencia</Label>
                <Input
                  id="client-reference"
                  placeholder="Ej: TRF-001-2024"
                  value={clientPaymentForm.reference_number}
                  onChange={(e) => setClientPaymentForm(prev => ({ ...prev, reference_number: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-status">Estado</Label>
              <Select 
                value={clientPaymentForm.status} 
                onValueChange={(value: 'pending' | 'confirmed' | 'cancelled') => 
                  setClientPaymentForm(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-notes">Notas</Label>
              <Textarea
                id="client-notes"
                placeholder="Notas adicionales sobre el pago..."
                value={clientPaymentForm.notes}
                onChange={(e) => setClientPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 flex-shrink-0 mt-4">
            <Button variant="outline" onClick={() => setIsClientPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateClientPayment}>
              Registrar Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear pago a proveedor */}
      <Dialog open={isSupplierPaymentDialogOpen} onOpenChange={setIsSupplierPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Registrar Pago a Proveedor</DialogTitle>
            <DialogDescription>
              Registra un nuevo pago realizado a un proveedor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-project">Proyecto *</Label>
                <Select 
                  value={supplierPaymentForm.project_id} 
                  onValueChange={(value) => setSupplierPaymentForm(prev => ({ ...prev, project_id: value }))}
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
                <Label htmlFor="supplier">Proveedor *</Label>
                <Select 
                  value={supplierPaymentForm.supplier_id} 
                  onValueChange={(value) => setSupplierPaymentForm(prev => ({ ...prev, supplier_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-payment-date">Fecha de Pago *</Label>
                <Input
                  id="supplier-payment-date"
                  type="date"
                  value={supplierPaymentForm.payment_date}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplier-amount">Monto *</Label>
                <Input
                  id="supplier-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={supplierPaymentForm.amount || ''}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-payment-method">Método de Pago</Label>
                <Select 
                  value={supplierPaymentForm.payment_method} 
                  onValueChange={(value) => setSupplierPaymentForm(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplier-reference">Número de Referencia</Label>
                <Input
                  id="supplier-reference"
                  placeholder="Ej: PAG-001-2024"
                  value={supplierPaymentForm.reference_number}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, reference_number: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-category">Categoría</Label>
                <Select 
                  value={supplierPaymentForm.category} 
                  onValueChange={(value) => setSupplierPaymentForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materiales">Materiales</SelectItem>
                    <SelectItem value="servicios">Servicios</SelectItem>
                    <SelectItem value="equipos">Equipos</SelectItem>
                    <SelectItem value="mano_obra">Mano de Obra</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplier-status">Estado</Label>
                <Select 
                  value={supplierPaymentForm.status} 
                  onValueChange={(value: 'pending' | 'confirmed' | 'cancelled') => 
                    setSupplierPaymentForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier-description">Descripción</Label>
              <Input
                id="supplier-description"
                placeholder="Descripción del pago"
                value={supplierPaymentForm.description}
                onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier-notes">Notas</Label>
              <Textarea
                id="supplier-notes"
                placeholder="Notas adicionales sobre el pago..."
                value={supplierPaymentForm.notes}
                onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 flex-shrink-0 mt-4">
            <Button variant="outline" onClick={() => setIsSupplierPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSupplierPayment}>
              Registrar Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}