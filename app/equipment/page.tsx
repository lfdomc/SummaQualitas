'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Equipment, EquipmentRental, Project, Client } from '@/types/database';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Filter,
  Truck,
  Calendar,
  DollarSign,
  Clock,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Menu,
  X,
  MapPin,
  Wrench,
  Star,
  Phone,
  Mail,
  Building,
  User,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from 'lucide-react';

// Interfaces
interface CreateEquipmentForm {
  name: string;
  category: string;
  description: string;
  daily_rental_rate: number;
  status: string;
  location: string;
  condition: string;
}

interface CreateRentalForm {
  equipment_id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  daily_rate: number;
  notes: string;
}

interface CreateMonthlyExpenseForm {
  equipment_id: string;
  project_id: string;
  year: number;
  month: number;
  maintenance_cost: number;
  fuel_cost: number;
  insurance_cost: number;
  other_costs: number;
  notes: string;
}

interface MonthlyExpenseByCategory {
  category: string;
  total_cost: number;
}

interface MonthlyExpenseByProject {
  project_name: string;
  total_cost: number;
}

interface MonthlyStats {
  total_monthly_cost: number;
  total_equipment: number;
  expenses_by_category: MonthlyExpenseByCategory[];
  expenses_by_project: MonthlyExpenseByProject[];
  top_rented_equipment: Array<{
    equipment_name: string;
    rental_days: number;
    total_cost: number;
  }>;
}

interface ProjectEquipmentGroup {
  project: Project;
  rentedEquipment: Array<{
    equipment: Equipment;
    rental: EquipmentRental;
    monthlyExpenses?: number;
  }>;
  totalMonthlyExpenses: number;
  totalRentalValue: number;
}

interface MobileState {
  isMobile: boolean;
  selectedEquipment: Equipment | null;
  showFilters: boolean;
  expandedCards: Set<string>;
}

// Mock data
const mockEquipment: Equipment[] = [
  {
    id: '1',
    name: 'Excavadora CAT 320',
    category: 'Maquinaria Pesada',
    description: 'Excavadora hidráulica de 20 toneladas',
    daily_rental_rate: 1500,
    status: 'available',
    location: 'Bodega Central',
    condition: 'excellent',
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Grúa Torre Liebherr',
    category: 'Grúas',
    description: 'Grúa torre de 50m de altura',
    daily_rental_rate: 2500,
    status: 'rented',
    location: 'Proyecto Residencial Norte',
    condition: 'good',
    is_active: true,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
  {
    id: '3',
    name: 'Compactador Vibratorio',
    category: 'Compactación',
    description: 'Compactador de suelos tipo rodillo',
    daily_rental_rate: 800,
    status: 'maintenance',
    location: 'Taller de Mantenimiento',
    condition: 'fair',
    is_active: true,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-25T00:00:00Z',
  },
  {
    id: '4',
    name: 'Mezcladora de Concreto',
    category: 'Concreto',
    description: 'Mezcladora autopropulsada 8m³',
    daily_rental_rate: 1200,
    status: 'available',
    location: 'Bodega Sur',
    condition: 'excellent',
    is_active: true,
    created_at: '2024-01-12T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
  },
];

const mockRentals: EquipmentRental[] = [
  {
    id: '1',
    equipment_id: '2',
    project_id: '1',
    start_date: '2024-01-20',
    end_date: '2024-02-20',
    daily_rate: 2500,
    total_cost: 77500,
    status: 'active',
    notes: 'Instalación para construcción de torre residencial',
    created_at: '2024-01-18T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
];

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Residencial Norte',
    client_id: '1',
    description: 'Complejo residencial de 200 unidades',
    location: 'Zona Norte, Ciudad',
    start_date: '2024-01-15',
    end_date: '2024-12-15',
    status: 'active',
    presupuesto_inicial: 5000000,
    presupuesto_original: 5000000,
    presupuesto_final: 5450000,
    costos_directos: 1750000,
    costos_indirectos: 300000,
    administracion: 200000,
    mano_obra: 800000,
    imprevistos: 150000,
    utilidad: 250000,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Centro Comercial Plaza',
    client_id: '2',
    description: 'Centro comercial de 3 niveles',
    location: 'Centro, Ciudad',
    start_date: '2024-02-01',
    end_date: '2024-10-01',
    status: 'active',
    presupuesto_inicial: 8000000,
    presupuesto_original: 8000000,
    presupuesto_final: 8640000,
    costos_directos: 2800000,
    costos_indirectos: 480000,
    administracion: 320000,
    mano_obra: 1200000,
    imprevistos: 240000,
    utilidad: 400000,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
];

const equipmentCategories = [
  'Maquinaria Pesada',
  'Grúas',
  'Compactación',
  'Concreto',
  'Herramientas',
  'Transporte',
  'Otros'
];

export default function EquipmentPage() {
  const router = useRouter();
  const { profile } = useRequireAuth();
  const permissions = usePermissions();

  // States
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [rentals, setRentals] = useState<EquipmentRental[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'equipment' | 'projects'>('equipment');
  const [isCreateEquipmentDialogOpen, setIsCreateEquipmentDialogOpen] = useState(false);
  const [isCreateRentalDialogOpen, setIsCreateRentalDialogOpen] = useState(false);
  const [isCreateMonthlyExpenseDialogOpen, setIsCreateMonthlyExpenseDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // Mobile states
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    selectedEquipment: null,
    showFilters: false,
    expandedCards: new Set<string>()
  });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setMobileState(prev => ({ ...prev, isMobile }));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Forms
  const [createEquipmentForm, setCreateEquipmentForm] = useState<CreateEquipmentForm>({
    name: '',
    category: '',
    description: '',
    daily_rental_rate: 0,
    status: 'available',
    location: '',
    condition: 'good',
  });

  const [createRentalForm, setCreateRentalForm] = useState<CreateRentalForm>({
    equipment_id: '',
    project_id: '',
    start_date: '',
    end_date: '',
    daily_rate: 0,
    notes: '',
  });

  const [createMonthlyExpenseForm, setCreateMonthlyExpenseForm] = useState<CreateMonthlyExpenseForm>({
    equipment_id: '',
    project_id: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    maintenance_cost: 0,
    fuel_cost: 0,
    insurance_cost: 0,
    other_costs: 0,
    notes: '',
  });

  // Permissions
  const canCreateEquipment = permissions.canCreateEquipment;
  const canEditEquipment = permissions.canEditEquipment;
  const canDeleteEquipment = permissions.canDeleteEquipment;
  const canCreateRentals = permissions.canCreateRentals;
  const canManageRentals = permissions.canEditRentals;

  // Helper functions
  const groupEquipmentByProject = (): ProjectEquipmentGroup[] => {
    const groups: ProjectEquipmentGroup[] = [];
    
    projects.forEach(project => {
      const projectRentals = rentals.filter(rental => 
        rental.project_id === project.id && rental.status === 'active'
      );
      
      const rentedEquipment = projectRentals.map(rental => {
        const equipmentItem = equipment.find(eq => eq.id === rental.equipment_id);
        // Calculate monthly expenses based on rental rate and duration
        const daysInMonth = 30;
        const monthlyExpenses = rental.daily_rate * daysInMonth;
        return {
          equipment: equipmentItem!,
          rental,
          monthlyExpenses
        };
      }).filter(item => item.equipment);
      
      if (rentedEquipment.length > 0) {
        const totalRentalValue = rentedEquipment.reduce((sum, item) => 
          sum + (item.rental.daily_rate * getDaysInRental(item.rental)), 0
        );
        
        const totalMonthlyExpenses = rentedEquipment.reduce((sum, item) => 
          sum + (item.monthlyExpenses || 0), 0
        );
        
        groups.push({
          project,
          rentedEquipment,
          totalRentalValue,
          totalMonthlyExpenses
        });
      }
    });
    
    return groups;
  };
  
  const getDaysInRental = (rental: EquipmentRental): number => {
    const start = new Date(rental.start_date);
    const end = new Date(rental.end_date || new Date());
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Load data
  useEffect(() => {
    if (profile) {
      loadEquipment();
      loadRentals();
      loadProjects();
      loadMonthlyStats();
    }
  }, [profile]);

  const loadEquipment = async (): Promise<void> => {
    try {
      setLoadingEquipment(true);
      
      const response = await fetch('/api/equipment');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Validar estructura de cada equipo
        const validEquipment = data.data.filter((item: { id?: string; name?: string; daily_rental_rate?: number }) => 
          item && 
          typeof item.id === 'string' && 
          typeof item.name === 'string' && 
          typeof item.daily_rental_rate === 'number'
        );
        setEquipment(validEquipment);
      } else {
        console.error('Error loading equipment:', data.error || 'Estructura de datos inválida');
        // Fallback a datos mock en caso de error
        setEquipment(mockEquipment);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      // Fallback a datos mock en caso de error
      setEquipment(mockEquipment);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const loadRentals = async (): Promise<void> => {
    try {
      const response = await fetch('/api/equipment/rentals');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Validar estructura de cada alquiler
        const validRentals = data.data.filter((item: { id?: string; equipment_id?: string; project_id?: string }) => 
          item && 
          typeof item.id === 'string' && 
          typeof item.equipment_id === 'string' && 
          typeof item.project_id === 'string'
        );
        setRentals(validRentals);
      } else {
        console.error('Error loading rentals:', data.error || 'Estructura de datos inválida');
        // Fallback a datos mock en caso de error
        setRentals(mockRentals);
      }
    } catch (error) {
      console.error('Error loading rentals:', error);
      // Fallback a datos mock en caso de error
      setRentals(mockRentals);
    }
  };

  const loadProjects = async (): Promise<void> => {
    try {
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Validar estructura de cada proyecto
        const validProjects = data.data.filter((item: { id?: string; name?: string }) => 
          item && 
          typeof item.id === 'string' && 
          typeof item.name === 'string'
        );
        setProjects(validProjects);
      } else {
        console.error('Error loading projects:', data.error || 'Estructura de datos inválida');
        // Fallback a datos mock en caso de error
        setProjects(mockProjects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      // Fallback a datos mock en caso de error
      setProjects(mockProjects);
    }
  };

  const loadMonthlyStats = async (): Promise<void> => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const response = await fetch(`/api/equipment/stats?year=${year}&month=${month}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Validar estructura de datos
        const statsData: MonthlyStats = {
          total_monthly_cost: data.data.total_monthly_cost || 0,
          total_equipment: data.data.total_equipment || 0,
          expenses_by_category: Array.isArray(data.data.expenses_by_category) ? data.data.expenses_by_category : [],
          expenses_by_project: Array.isArray(data.data.expenses_by_project) ? data.data.expenses_by_project : [],
          top_rented_equipment: Array.isArray(data.data.top_rented_equipment) ? data.data.top_rented_equipment : []
        };
        setMonthlyStats(statsData);
      } else {
        console.error('Error en respuesta de estadísticas:', data.error || 'Estructura de datos inválida');
        setMonthlyStats(null);
      }
    } catch (error) {
      console.error('Error loading monthly stats:', error);
      setMonthlyStats(null);
    }
  };

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'rented':
        return 'secondary';
      case 'maintenance':
        return 'destructive';
      case 'out_of_service':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'rented':
        return 'Alquilado';
      case 'maintenance':
        return 'Mantenimiento';
      case 'out_of_service':
        return 'Fuera de Servicio';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4" />;
      case 'rented':
        return <Clock className="h-4 w-4" />;
      case 'maintenance':
        return <Settings className="h-4 w-4" />;
      case 'out_of_service':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Filter equipment
  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate statistics
  const totalEquipment = equipment.length;
  const availableEquipment = equipment.filter(e => e.status === 'available').length;
  const rentedEquipment = equipment.filter(e => e.status === 'rented').length;
  const maintenanceEquipment = equipment.filter(e => e.status === 'maintenance').length;
  const totalDailyValue = equipment.reduce((sum, e) => sum + e.daily_rental_rate, 0);
  const activeRentalsValue = rentals
    .filter(r => r.status === 'active')
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  // Dialog handlers
  const openCreateEquipmentDialog = () => {
    setCreateEquipmentForm({
      name: '',
      category: '',
      description: '',
      daily_rental_rate: 0,
      status: 'available',
      location: '',
      condition: 'good',
    });
    setIsCreateEquipmentDialogOpen(true);
  };

  const openCreateRentalDialog = (equipment?: Equipment) => {
    setCreateRentalForm({
      equipment_id: equipment?.id || '',
      project_id: '',
      start_date: '',
      end_date: '',
      daily_rate: equipment?.daily_rental_rate || 0,
      notes: '',
    });
    setSelectedEquipment(equipment || null);
    setIsCreateRentalDialogOpen(true);
  };

  const openCreateMonthlyExpenseDialog = (equipment?: Equipment) => {
    setCreateMonthlyExpenseForm({
      equipment_id: equipment?.id || '',
      project_id: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      maintenance_cost: 0,
      fuel_cost: 0,
      insurance_cost: 0,
      other_costs: 0,
      notes: '',
    });
    setSelectedEquipment(equipment || null);
    setIsCreateMonthlyExpenseDialogOpen(true);
  };

  // Form handlers
  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones del formulario
    if (!createEquipmentForm.name.trim()) {
      alert('El nombre del equipo es requerido');
      return;
    }
    
    if (!createEquipmentForm.category.trim()) {
      alert('La categoría es requerida');
      return;
    }
    
    if (createEquipmentForm.daily_rental_rate <= 0) {
      alert('La tarifa diaria debe ser mayor a 0');
      return;
    }
    
    if (!createEquipmentForm.location.trim()) {
      alert('La ubicación es requerida');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createEquipmentForm,
          name: createEquipmentForm.name.trim(),
          category: createEquipmentForm.category.trim(),
          description: createEquipmentForm.description.trim(),
          location: createEquipmentForm.location.trim(),
          daily_rental_rate: Number(createEquipmentForm.daily_rental_rate)
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEquipment(prev => [data.data, ...prev]);
        setIsCreateEquipmentDialogOpen(false);
        alert('Equipo creado exitosamente');
        
        // Resetear formulario
        setCreateEquipmentForm({
          name: '',
          category: '',
          description: '',
          daily_rental_rate: 0,
          status: 'available',
          location: '',
          condition: 'good',
        });
      } else {
        alert(`Error al crear equipo: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error creating equipment:', error);
      alert('Error al crear el equipo. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones del formulario
    if (!createRentalForm.equipment_id) {
      alert('Debe seleccionar un equipo');
      return;
    }
    
    if (!createRentalForm.project_id) {
      alert('Debe seleccionar un proyecto');
      return;
    }
    
    if (!createRentalForm.start_date) {
      alert('La fecha de inicio es requerida');
      return;
    }
    
    if (!createRentalForm.end_date) {
      alert('La fecha de fin es requerida');
      return;
    }
    
    // Validar que la fecha de fin sea posterior a la de inicio
    const startDate = new Date(createRentalForm.start_date);
    const endDate = new Date(createRentalForm.end_date);
    
    if (endDate <= startDate) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }
    
    // Validar que la fecha de inicio no sea anterior a hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      alert('La fecha de inicio no puede ser anterior a hoy');
      return;
    }
    
    if (createRentalForm.daily_rate <= 0) {
      alert('La tarifa diaria debe ser mayor a 0');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const rentalData = {
        equipment_id: createRentalForm.equipment_id,
        project_id: createRentalForm.project_id,
        start_date: createRentalForm.start_date,
        planned_end_date: createRentalForm.end_date,
        daily_rate: Number(createRentalForm.daily_rate),
        notes: createRentalForm.notes.trim(),
      };
      
      const response = await fetch('/api/equipment/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rentalData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRentals(prev => [data.data, ...prev]);
        
        // Actualizar estado del equipo
        setEquipment(prev => prev.map(eq => 
          eq.id === createRentalForm.equipment_id 
            ? { ...eq, status: 'rented' as const }
            : eq
        ));
        
        setIsCreateRentalDialogOpen(false);
        alert('Alquiler creado exitosamente');
        
        // Resetear formulario
        setCreateRentalForm({
          equipment_id: '',
          project_id: '',
          start_date: '',
          end_date: '',
          daily_rate: 0,
          notes: '',
        });
      } else {
        alert(`Error al crear alquiler: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error creating rental:', error);
      alert('Error al crear el alquiler. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMonthlyExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones del formulario
    if (!createMonthlyExpenseForm.equipment_id) {
      alert('Debe seleccionar un equipo');
      return;
    }
    
    if (!createMonthlyExpenseForm.project_id) {
      alert('Debe seleccionar un proyecto');
      return;
    }
    
    if (createMonthlyExpenseForm.year < 2020 || createMonthlyExpenseForm.year > 2030) {
      alert('El año debe estar entre 2020 y 2030');
      return;
    }
    
    if (createMonthlyExpenseForm.month < 1 || createMonthlyExpenseForm.month > 12) {
      alert('El mes debe estar entre 1 y 12');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/equipment/monthly-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createMonthlyExpenseForm),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setIsCreateMonthlyExpenseDialogOpen(false);
        alert('Gasto mensual registrado exitosamente');
        
        // Resetear formulario
        setCreateMonthlyExpenseForm({
          equipment_id: '',
          project_id: '',
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          maintenance_cost: 0,
          fuel_cost: 0,
          insurance_cost: 0,
          other_costs: 0,
          notes: '',
        });
        
        // Recargar estadísticas mensuales
        loadMonthlyStats();
      } else {
        alert(`Error al registrar gasto mensual: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error creating monthly expense:', error);
      alert('Error al registrar el gasto mensual. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string): Promise<void> => {
    if (!equipmentId || typeof equipmentId !== 'string') {
      alert('ID de equipo inválido');
      return;
    }

    // Verificar si el equipo está actualmente alquilado
    const equipmentItem = equipment.find(e => e.id === equipmentId);
    if (equipmentItem?.status === 'rented') {
      alert('No se puede eliminar un equipo que está actualmente alquilado');
      return;
    }

    const confirmMessage = mobileState.isMobile 
      ? '¿Eliminar equipo?' 
      : '¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/equipment/${equipmentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEquipment(prev => prev.filter(eq => eq.id !== equipmentId));
        alert('Equipo eliminado exitosamente');
      } else {
        alert(`Error al eliminar equipo: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert('Error al eliminar el equipo. Por favor, intente nuevamente.');
    }
  };

  // Mobile handlers
  const handleMobileEquipmentSelect = (equipment: Equipment) => {
    setMobileState(prev => ({ ...prev, selectedEquipment: equipment }));
  };

  const toggleCardExpansion = (equipmentId: string) => {
    setMobileState(prev => {
      const newExpanded = new Set(prev.expandedCards);
      if (newExpanded.has(equipmentId)) {
        newExpanded.delete(equipmentId);
      } else {
        newExpanded.add(equipmentId);
      }
      return { ...prev, expandedCards: newExpanded };
    });
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto mobile-padding py-6 space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between ${mobileState.isMobile ? 'flex-col space-y-4' : ''}`}>
        <div className={mobileState.isMobile ? 'text-center' : ''}>
          <h1 className={`font-bold text-gray-900 ${mobileState.isMobile ? 'text-2xl' : 'text-3xl'}`}>
            {mobileState.isMobile ? 'Equipos' : 'Equipos por Proyecto'}
          </h1>
          <p className={`text-gray-600 mt-1 ${mobileState.isMobile ? 'text-sm' : ''}`}>
            {mobileState.isMobile 
              ? 'Gestiona equipos y alquileres'
              : 'Gestiona equipos alquilados por proyecto y sus gastos mensuales'
            }
          </p>
        </div>
        
        <div className={`flex space-x-2 ${mobileState.isMobile ? 'w-full justify-center flex-wrap gap-2' : ''}`}>
          {canCreateRentals && (
            <Button 
              onClick={() => openCreateMonthlyExpenseDialog()} 
              variant="outline"
              size={mobileState.isMobile ? 'sm' : 'default'}
              className={mobileState.isMobile ? 'flex-1 min-w-0' : ''}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {mobileState.isMobile ? 'Gastos' : 'Gastos Mensuales'}
            </Button>
          )}
          {canCreateRentals && (
            <Button 
              onClick={() => openCreateRentalDialog()} 
              variant="outline"
              size={mobileState.isMobile ? 'sm' : 'default'}
              className={mobileState.isMobile ? 'flex-1 min-w-0' : ''}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {mobileState.isMobile ? 'Alquiler' : 'Nuevo Alquiler'}
            </Button>
          )}
          {canCreateEquipment && (
            <Button 
              onClick={openCreateEquipmentDialog}
              size={mobileState.isMobile ? 'sm' : 'default'}
              className={mobileState.isMobile ? 'flex-1 min-w-0' : ''}
            >
              <Plus className="h-4 w-4 mr-2" />
              {mobileState.isMobile ? 'Equipo' : 'Agregar Equipo'}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mobile-card">
        <CardContent className="mobile-padding pt-6">
          {/* Mobile Filter Toggle */}
          {mobileState.isMobile && (
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setMobileState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                className="w-full justify-between"
              >
                <span className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </span>
                {mobileState.showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          )}
          
          {/* Search - Always visible */}
          <div className={`space-y-2 ${mobileState.isMobile ? 'mb-4' : ''}`}>
            <Label htmlFor="search" className={mobileState.isMobile ? 'text-sm font-medium' : ''}>
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={mobileState.isMobile ? "Buscar..." : "Buscar equipos..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {/* Collapsible Filters */}
          <div className={`${mobileState.isMobile && !mobileState.showFilters ? 'hidden' : ''} ${mobileState.isMobile ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4'}`}>
            <div className="space-y-2">
              <Label htmlFor="category" className={mobileState.isMobile ? 'text-sm font-medium' : ''}>
                Categoría
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {equipmentCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className={mobileState.isMobile ? 'text-sm font-medium' : ''}>
                Estado
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="rented">Alquilado</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="out_of_service">Fuera de Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="viewMode">Vista</Label>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'equipment' | 'projects')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipment">Por Equipos</SelectItem>
                  <SelectItem value="projects">Por Proyectos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {viewMode === 'projects' && (
              <div className="space-y-2">
                <Label htmlFor="project">Proyecto</Label>
                <Select value={selectedProjectId || 'all'} onValueChange={(value) => setSelectedProjectId(value === 'all' ? null : value)}>
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
            )}
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setViewMode('equipment');
                  setSelectedProjectId(null);
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
        <Card className="mobile-card">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${mobileState.isMobile ? 'pb-1' : 'pb-2'}`}>
            <CardTitle className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-medium ${mobileState.isMobile ? 'leading-tight' : ''}`}>
              {mobileState.isMobile ? 'Total' : 'Total Equipos'}
            </CardTitle>
            <Package className={`${mobileState.isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
          </CardHeader>
          <CardContent className={mobileState.isMobile ? 'pt-0 pb-3' : ''}>
            <div className={`${mobileState.isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{totalEquipment}</div>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${mobileState.isMobile ? 'pb-1' : 'pb-2'}`}>
            <CardTitle className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-medium ${mobileState.isMobile ? 'leading-tight' : ''}`}>
              Disponibles
            </CardTitle>
            <CheckCircle className={`${mobileState.isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-green-600`} />
          </CardHeader>
          <CardContent className={mobileState.isMobile ? 'pt-0 pb-3' : ''}>
            <div className={`${mobileState.isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-600`}>{availableEquipment}</div>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${mobileState.isMobile ? 'pb-1' : 'pb-2'}`}>
            <CardTitle className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-medium ${mobileState.isMobile ? 'leading-tight' : ''}`}>
              Alquilados
            </CardTitle>
            <Clock className={`${mobileState.isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-blue-600`} />
          </CardHeader>
          <CardContent className={mobileState.isMobile ? 'pt-0 pb-3' : ''}>
            <div className={`${mobileState.isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-600`}>{rentedEquipment}</div>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${mobileState.isMobile ? 'pb-1' : 'pb-2'}`}>
            <CardTitle className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-medium ${mobileState.isMobile ? 'leading-tight' : ''}`}>
              {mobileState.isMobile ? 'Mant.' : 'Mantenimiento'}
            </CardTitle>
            <Settings className={`${mobileState.isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-orange-600`} />
          </CardHeader>
          <CardContent className={mobileState.isMobile ? 'pt-0 pb-3' : ''}>
            <div className={`${mobileState.isMobile ? 'text-lg' : 'text-2xl'} font-bold text-orange-600`}>{maintenanceEquipment}</div>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${mobileState.isMobile ? 'pb-1' : 'pb-2'}`}>
            <CardTitle className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-medium ${mobileState.isMobile ? 'leading-tight' : ''}`}>
              {mobileState.isMobile ? 'Valor' : 'Valor Diario Total'}
            </CardTitle>
            <DollarSign className={`${mobileState.isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
          </CardHeader>
          <CardContent className={mobileState.isMobile ? 'pt-0 pb-3' : ''}>
            <div className={`${mobileState.isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{formatCurrency(totalDailyValue)}</div>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${mobileState.isMobile ? 'pb-1' : 'pb-2'}`}>
            <CardTitle className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-medium ${mobileState.isMobile ? 'leading-tight' : ''}`}>
              {mobileState.isMobile ? 'Activos' : 'Alquileres Activos'}
            </CardTitle>
            <Truck className={`${mobileState.isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-purple-600`} />
          </CardHeader>
          <CardContent className={mobileState.isMobile ? 'pt-0 pb-3' : ''}>
            <div className={`${mobileState.isMobile ? 'text-lg' : 'text-2xl'} font-bold text-purple-600`}>{formatCurrency(activeRentalsValue)}</div>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${mobileState.isMobile ? 'pb-1' : 'pb-2'}`}>
            <CardTitle className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-medium ${mobileState.isMobile ? 'leading-tight' : ''}`}>
              {mobileState.isMobile ? 'Gasto' : 'Gasto Mensual'}
            </CardTitle>
            <Calendar className={`${mobileState.isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-red-600`} />
          </CardHeader>
          <CardContent className={mobileState.isMobile ? 'pt-0 pb-3' : ''}>
            <div className={`${mobileState.isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-600`}>
              {monthlyStats ? formatCurrency(monthlyStats.total_monthly_cost || 0) : formatCurrency(0)}
            </div>
            <p className={`${mobileState.isMobile ? 'text-xs hidden' : 'text-xs'} text-muted-foreground`}>
              {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>
       </div>

      {/* Monthly Statistics Details */}
      {monthlyStats && (
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 ${mobileState.isMobile ? 'space-y-4' : ''}`}>
          {/* Gastos por Categoría */}
          <Card className="mobile-card">
            <CardHeader className="mobile-padding">
              <CardTitle className={`${mobileState.isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                {mobileState.isMobile ? 'Por Categoría' : 'Gastos por Categoría'}
              </CardTitle>
            </CardHeader>
            <CardContent className="mobile-padding">
              {monthlyStats.expenses_by_category && monthlyStats.expenses_by_category.length > 0 ? (
                <div className={`${mobileState.isMobile ? 'space-y-2' : 'space-y-3'}`}>
                  {monthlyStats.expenses_by_category.map((item: { category: string; total_cost: number }, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{item.category}</span>
                      <span className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-bold text-red-600`}>
                        {formatCurrency(item.total_cost)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>No hay gastos registrados este mes</p>
              )}
            </CardContent>
          </Card>

          {/* Gastos por Proyecto */}
          <Card className="mobile-card">
            <CardHeader className="mobile-padding">
              <CardTitle className={`${mobileState.isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                {mobileState.isMobile ? 'Por Proyecto' : 'Gastos por Proyecto'}
              </CardTitle>
            </CardHeader>
            <CardContent className="mobile-padding">
              {monthlyStats.expenses_by_project && monthlyStats.expenses_by_project.length > 0 ? (
                <div className={`${mobileState.isMobile ? 'space-y-2' : 'space-y-3'}`}>
                  {monthlyStats.expenses_by_project.map((item: { project_name: string; total_cost: number }, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{item.project_name}</span>
                      <span className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} font-bold text-red-600`}>
                        {formatCurrency(item.total_cost)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`${mobileState.isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>No hay gastos registrados este mes</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Equipment Content - Vista por Equipos o Proyectos */}
      {viewMode === 'equipment' ? (
        <Card className="mobile-card">
          <CardHeader className="mobile-padding">
            <CardTitle className={mobileState.isMobile ? 'text-lg' : ''}>
              {mobileState.isMobile ? 'Equipos' : 'Lista de Equipos'}
            </CardTitle>
          </CardHeader>
          <CardContent className="mobile-padding">
            {loadingEquipment ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className={`${mobileState.isMobile ? 'h-6 w-6' : 'h-8 w-8'} animate-spin`} />
                <span className={`ml-2 ${mobileState.isMobile ? 'text-sm' : ''}`}>Cargando equipos...</span>
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="text-center py-8">
                <Package className={`${mobileState.isMobile ? 'h-8 w-8' : 'h-12 w-12'} text-gray-400 mx-auto mb-4`} />
                <h3 className={`${mobileState.isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>
                  {equipment.length === 0 ? 'No hay equipos registrados' : 'No se encontraron equipos'}
                </h3>
                <p className={`text-gray-500 mb-4 ${mobileState.isMobile ? 'text-sm' : ''}`}>
                  {equipment.length === 0 
                    ? 'Comienza agregando tu primer equipo al inventario'
                    : 'Intenta ajustar los filtros de búsqueda'
                  }
                </p>
                {equipment.length === 0 && canCreateEquipment && (
                  <Button onClick={openCreateEquipmentDialog} size={mobileState.isMobile ? 'sm' : 'default'}>
                    <Plus className="h-4 w-4 mr-2" />
                    {mobileState.isMobile ? 'Agregar' : 'Agregar Primer Equipo'}
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                {mobileState.isMobile ? (
                  <div className="space-y-3">
                    {filteredEquipment.map((item) => (
                      <Card key={item.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(item.status)} className="ml-2 text-xs">
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(item.status)}
                                <span>{getStatusLabel(item.status)}</span>
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                            <div>
                              <span className="text-gray-500">Categoría:</span>
                              <div className="font-medium">{item.category}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Tarifa:</span>
                              <div className="font-medium text-green-600">{formatCurrency(item.daily_rental_rate)}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center mb-3 text-xs">
                            <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-gray-600">{item.location}</span>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            {item.status === 'available' && canCreateRentals && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openCreateRentalDialog(item)}
                                className="text-xs px-2 py-1 h-7"
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Alquilar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/equipment/${item.id}`)}
                              className="text-xs px-2 py-1 h-7"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            {canEditEquipment && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/equipment/${item.id}/edit`)}
                                className="text-xs px-2 py-1 h-7"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {canDeleteEquipment && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteEquipment(item.id)}
                                className="text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Desktop View - Table */
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipo</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Tarifa Diaria</TableHead>
                          <TableHead>Especificaciones</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEquipment.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-gray-500">{item.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(item.status)}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(item.status)}
                                  <span>{getStatusLabel(item.status)}</span>
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(item.daily_rental_rate)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600 max-w-xs truncate" title={item.description}>
                                {item.description}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {item.status === 'available' && canCreateRentals && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openCreateRentalDialog(item)}
                                    title="Crear alquiler"
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </Button>
                                )}
                                {canEditEquipment && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/equipment/${item.id}/edit`)}
                                    title="Editar equipo"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/equipment/${item.id}`)}
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canDeleteEquipment && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteEquipment(item.id)}
                                    title="Eliminar equipo"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Vista por Proyectos */
        <div className={`space-y-${mobileState.isMobile ? '4' : '6'}`}>
          {(() => {
            const projectGroups = groupEquipmentByProject();
            
            if (loadingEquipment) {
              return (
                <Card className="mobile-card">
                  <CardContent className={`py-8 ${mobileState.isMobile ? 'mobile-padding' : ''}`}>
                    <div className="flex items-center justify-center">
                      <Loader2 className={`${mobileState.isMobile ? 'h-6 w-6' : 'h-8 w-8'} animate-spin`} />
                      <span className={`ml-2 ${mobileState.isMobile ? 'text-sm' : ''}`}>Cargando datos...</span>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            
            if (projectGroups.length === 0) {
              return (
                <Card className="mobile-card">
                  <CardContent className={`py-8 ${mobileState.isMobile ? 'mobile-padding' : ''}`}>
                    <div className="text-center">
                      <Package className={`${mobileState.isMobile ? 'h-8 w-8' : 'h-12 w-12'} text-gray-400 mx-auto mb-4`} />
                      <h3 className={`${mobileState.isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>
                        No hay equipos alquilados
                      </h3>
                      <p className={`text-gray-500 mb-4 ${mobileState.isMobile ? 'text-sm' : ''}`}>
                        {selectedProjectId 
                          ? 'Este proyecto no tiene equipos alquilados actualmente'
                          : 'No hay equipos alquilados en ningún proyecto actualmente'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            
            return projectGroups.map((group) => (
              <Card key={group.project.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{group.project.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{group.project.description}</p>
                      <p className="text-sm text-gray-500">{group.project.location}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Valor Total Alquileres</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(group.totalRentalValue)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Gastos Mensuales</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatCurrency(group.totalMonthlyExpenses)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipo</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Período de Alquiler</TableHead>
                          <TableHead>Tarifa Diaria</TableHead>
                          <TableHead>Días Alquilados</TableHead>
                          <TableHead>Valor Total</TableHead>
                          <TableHead>Gastos Mensuales</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.rentedEquipment.map((item) => {
                          const daysRented = getDaysInRental(item.rental);
                          return (
                            <TableRow key={`${item.equipment.id}-${item.rental.id}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.equipment.name}</div>
                                  <div className="text-sm text-gray-500">{item.equipment.description}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.equipment.category}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{new Date(item.rental.start_date).toLocaleDateString('es-ES')}</div>
                                  <div className="text-gray-500">
                                    {item.rental.end_date 
                                      ? `hasta ${new Date(item.rental.end_date).toLocaleDateString('es-ES')}`
                                      : 'En curso'
                                    }
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(item.rental.daily_rate)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{daysRented} días</Badge>
                              </TableCell>
                              <TableCell className="font-medium text-blue-600">
                                {formatCurrency(item.rental.daily_rate * daysRented)}
                              </TableCell>
                              <TableCell className="font-medium text-red-600">
                                {formatCurrency(item.monthlyExpenses || 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/equipment/${item.equipment.id}`)}
                                    title="Ver detalles del equipo"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {canCreateRentals && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setCreateMonthlyExpenseForm({
                                          equipment_id: item.equipment.id,
                                          project_id: group.project.id,
                                          year: new Date().getFullYear(),
                                          month: new Date().getMonth() + 1,
                                          maintenance_cost: 0,
                                          fuel_cost: 0,
                                          insurance_cost: 0,
                                          other_costs: 0,
                                          notes: ''
                                        });
                                        setIsCreateMonthlyExpenseDialogOpen(true);
                                      }}
                                      title="Agregar gastos mensuales"
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <DollarSign className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ));
          })()}
        </div>
      )}

      {/* Create Equipment Dialog */}
      <Dialog open={isCreateEquipmentDialogOpen} onOpenChange={setIsCreateEquipmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Equipo</DialogTitle>
            <DialogDescription>
              Registra un nuevo equipo en el inventario
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateEquipment} className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment-name">Nombre del Equipo *</Label>
                <Input
                  id="equipment-name"
                  value={createEquipmentForm.name}
                  onChange={(e) => setCreateEquipmentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Excavadora CAT 320"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="equipment-category">Categoría *</Label>
                <Select
                  value={createEquipmentForm.category}
                  onValueChange={(value) => setCreateEquipmentForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="equipment-description">Descripción</Label>
              <Textarea
                id="equipment-description"
                value={createEquipmentForm.description}
                onChange={(e) => setCreateEquipmentForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del equipo"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment-rate">Tarifa Diaria (₡)</Label>
                <Input
                  id="equipment-rate"
                  type="number"
                  value={createEquipmentForm.daily_rental_rate}
                  onChange={(e) => setCreateEquipmentForm(prev => ({ ...prev, daily_rental_rate: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="equipment-status">Estado</Label>
                <Select
                  value={createEquipmentForm.status}
                  onValueChange={(value: 'available' | 'rented' | 'maintenance' | 'out_of_service') => 
                    setCreateEquipmentForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="rented">Alquilado</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    <SelectItem value="out_of_service">Fuera de Servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="equipment-location">Ubicación</Label>
              <Input
                id="equipment-location"
                value={createEquipmentForm.location}
                onChange={(e) => setCreateEquipmentForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ej: Bodega Central"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="equipment-condition">Condición</Label>
              <Select
                value={createEquipmentForm.condition}
                onValueChange={(value) => setCreateEquipmentForm(prev => ({ ...prev, condition: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar condición" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excelente</SelectItem>
                  <SelectItem value="good">Buena</SelectItem>
                  <SelectItem value="fair">Regular</SelectItem>
                  <SelectItem value="poor">Mala</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
            
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateEquipmentDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={handleCreateEquipment}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Equipo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Rental Dialog */}
      <Dialog open={isCreateRentalDialogOpen} onOpenChange={setIsCreateRentalDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Alquiler</DialogTitle>
            <DialogDescription>
              {selectedEquipment 
                ? `Crear alquiler para: ${selectedEquipment.name}`
                : 'Registra un nuevo alquiler de equipo'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateRental} className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rental-equipment">Equipo *</Label>
                <Select
                  value={createRentalForm.equipment_id}
                  onValueChange={(value) => {
                    const equipment = mockEquipment.find(e => e.id === value);
                    setCreateRentalForm(prev => ({ 
                      ...prev, 
                      equipment_id: value,
                      daily_rate: equipment?.daily_rental_rate || 0
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment
                      .filter(e => e.status === 'available')
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {formatCurrency(item.daily_rental_rate)}/día
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rental-project">Proyecto *</Label>
                <Select
                  value={createRentalForm.project_id}
                  onValueChange={(value) => setCreateRentalForm(prev => ({ ...prev, project_id: value }))}
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rental-start">Fecha Inicio *</Label>
                <Input
                  id="rental-start"
                  type="date"
                  value={createRentalForm.start_date}
                  onChange={(e) => setCreateRentalForm(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rental-end">Fecha Fin *</Label>
                <Input
                  id="rental-end"
                  type="date"
                  value={createRentalForm.end_date}
                  onChange={(e) => setCreateRentalForm(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rental-rate">Tarifa Diaria (₡)</Label>
                <Input
                  id="rental-rate"
                  type="number"
                  value={createRentalForm.daily_rate}
                  onChange={(e) => setCreateRentalForm(prev => ({ ...prev, daily_rate: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
            </div>
            
            {createRentalForm.start_date && createRentalForm.end_date && createRentalForm.daily_rate > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div>Días de alquiler: {Math.ceil((new Date(createRentalForm.end_date).getTime() - new Date(createRentalForm.start_date).getTime()) / (1000 * 60 * 60 * 24))}</div>
                  <div className="font-medium text-lg mt-1">
                    Total estimado: {formatCurrency(
                      Math.ceil((new Date(createRentalForm.end_date).getTime() - new Date(createRentalForm.start_date).getTime()) / (1000 * 60 * 60 * 24)) * createRentalForm.daily_rate
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="rental-notes">Notas</Label>
              <Textarea
                id="rental-notes"
                value={createRentalForm.notes}
                onChange={(e) => setCreateRentalForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales sobre el alquiler"
                rows={3}
              />
            </div>
          </form>
            
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateRentalDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={handleCreateRental}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Alquiler'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Monthly Expense Dialog */}
      <Dialog open={isCreateMonthlyExpenseDialogOpen} onOpenChange={setIsCreateMonthlyExpenseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Registrar Gastos Mensuales</DialogTitle>
            <DialogDescription>
              {selectedEquipment 
                ? `Registrar gastos mensuales para: ${selectedEquipment.name}`
                : 'Registra los gastos mensuales de un equipo'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateMonthlyExpense} className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-equipment">Equipo *</Label>
                <Select
                  value={createMonthlyExpenseForm.equipment_id}
                  onValueChange={(value) => setCreateMonthlyExpenseForm(prev => ({ ...prev, equipment_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - {item.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expense-project">Proyecto *</Label>
                <Select
                  value={createMonthlyExpenseForm.project_id}
                  onValueChange={(value) => setCreateMonthlyExpenseForm(prev => ({ ...prev, project_id: value }))}
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
              <div className="space-y-2">
                <Label htmlFor="expense-year">Año *</Label>
                <Input
                  id="expense-year"
                  type="number"
                  value={createMonthlyExpenseForm.year}
                  onChange={(e) => setCreateMonthlyExpenseForm(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  min="2020"
                  max="2030"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expense-month">Mes *</Label>
                <Select
                  value={createMonthlyExpenseForm.month.toString()}
                  onValueChange={(value) => setCreateMonthlyExpenseForm(prev => ({ ...prev, month: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2024, month - 1, 1).toLocaleDateString('es-ES', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance-cost">Costo de Mantenimiento</Label>
                <Input
                  id="maintenance-cost"
                  type="number"
                  value={createMonthlyExpenseForm.maintenance_cost}
                  onChange={(e) => setCreateMonthlyExpenseForm(prev => ({ ...prev, maintenance_cost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fuel-cost">Costo de Combustible</Label>
                <Input
                  id="fuel-cost"
                  type="number"
                  value={createMonthlyExpenseForm.fuel_cost}
                  onChange={(e) => setCreateMonthlyExpenseForm(prev => ({ ...prev, fuel_cost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance-cost">Costo de Seguro</Label>
                <Input
                  id="insurance-cost"
                  type="number"
                  value={createMonthlyExpenseForm.insurance_cost}
                  onChange={(e) => setCreateMonthlyExpenseForm(prev => ({ ...prev, insurance_cost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="other-costs">Otros Costos</Label>
                <Input
                  id="other-costs"
                  type="number"
                  value={createMonthlyExpenseForm.other_costs}
                  onChange={(e) => setCreateMonthlyExpenseForm(prev => ({ ...prev, other_costs: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">
                <div className="font-medium text-lg">
                  Total de gastos: {formatCurrency(
                    createMonthlyExpenseForm.maintenance_cost + 
                    createMonthlyExpenseForm.fuel_cost + 
                    createMonthlyExpenseForm.insurance_cost + 
                    createMonthlyExpenseForm.other_costs
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expense-notes">Notas</Label>
              <Textarea
                id="expense-notes"
                value={createMonthlyExpenseForm.notes}
                onChange={(e) => setCreateMonthlyExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales sobre los gastos"
                rows={3}
              />
            </div>
          </form>
            
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateMonthlyExpenseDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={handleCreateMonthlyExpense}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Gastos'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}