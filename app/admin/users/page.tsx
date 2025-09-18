'use client';

// =====================================================
// PÁGINA DE ADMINISTRACIÓN DE USUARIOS
// =====================================================

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { User, UserRole } from '@/types/database';
import { useHasPermission } from '@/hooks/usePermissions';
import { toast } from 'sonner';

interface CreateUserForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_id: string;
  is_active: boolean;
}

interface MobileState {
  isMobile: boolean;
  showPassword: boolean;
  selectedUserId: string | null;
}

const initialForm: CreateUserForm = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role_id: '',
  is_active: true
};

const mockRoles: UserRole[] = [
  { id: '1', name: 'admin', description: 'Acceso completo al sistema', permissions: [], created_at: '', updated_at: '' },
{ id: '2', name: 'project_manager', description: 'Gestión de proyectos', permissions: [], created_at: '', updated_at: '' },
{ id: '3', name: 'accountant', description: 'Gestión financiera', permissions: [], created_at: '', updated_at: '' },
{ id: '4', name: 'operator', description: 'Operaciones básicas', permissions: [], created_at: '', updated_at: '' }
];

const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@summaqualitas.com',
    first_name: 'Admin',
    last_name: 'Principal',
    role_id: '1',
    role: mockRoles[0],
    is_active: true,
    is_master: true,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    email: 'gerente@summaqualitas.com',
    first_name: 'Carlos',
    last_name: 'Rodríguez',
    role_id: '2',
    role: mockRoles[1],
    is_active: true,
    is_master: false,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    email: 'contador@summaqualitas.com',
    first_name: 'María',
    last_name: 'González',
    role_id: '3',
    role: mockRoles[2],
    is_active: true,
    is_master: false,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function AdminUsersPage() {
  // Requiere permisos de administración
  const { user, loading } = useAuthContext();
  const canManageUsers = useHasPermission('canEditUsers');
  
  // Estados principales
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [roles, setRoles] = useState<UserRole[]>(mockRoles);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Estados para móvil
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    showPassword: false,
    selectedUserId: null
  });
  
  // Detectar dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setMobileState(prev => ({
        ...prev,
        isMobile: window.innerWidth < 768
      }));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Verificar permisos de acceso
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">No tienes permisos para gestionar usuarios del sistema.</p>
        </div>
      </div>
    );
  }

  // Cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        // Aquí se cargarían los usuarios reales desde la API
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular carga
        setUsers(mockUsers);
        setRoles(mockRoles);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Error al cargar usuarios');
      } finally {
        setLoadingUsers(false);
      }
    };

    if (user) {
      loadUsers();
    }
  }, [user]);

  // Filtrar usuarios
  const filteredUsers = users.filter(user => 
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validaciones básicas
      if (!createForm.email || !createForm.password || !createForm.first_name || !createForm.last_name || !createForm.role_id) {
        toast.error('Todos los campos son obligatorios');
        return;
      }

      // Verificar email único
      if (users.some(u => u.email === createForm.email)) {
        toast.error('El email ya está en uso');
        return;
      }

      // Simular creación de usuario
      await new Promise(resolve => setTimeout(resolve, 1500));

      const selectedRole = roles.find(r => r.id === createForm.role_id);
      const newUser: User = {
        id: Date.now().toString(),
        email: createForm.email,
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        role_id: createForm.role_id,
        role: selectedRole,
        is_active: createForm.is_active,
        is_master: false,
        last_login: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setUsers(prev => [...prev, newUser]);
      setCreateForm(initialForm);
      setIsCreateDialogOpen(false);
      setMobileState(prev => ({ ...prev, showPassword: false }));
      toast.success('Usuario creado exitosamente');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) return;

      // Simular actualización
      await new Promise(resolve => setTimeout(resolve, 500));

      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, is_active: !u.is_active, updated_at: new Date().toISOString() }
          : u
      ));

      toast.success(`Usuario ${userToUpdate.is_active ? 'desactivado' : 'activado'} exitosamente`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error al actualizar estado del usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmMessage = mobileState.isMobile 
      ? '¿Eliminar usuario?' 
      : '¿Estás seguro de que quieres eliminar este usuario?';
      
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) return;

      if (userToDelete.is_master) {
        toast.error('No se puede eliminar el usuario maestro');
        return;
      }

      // Simular eliminación
      await new Promise(resolve => setTimeout(resolve, 500));

      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  // Función para manejar selección de usuario en móvil
  const handleMobileUserSelect = (userId: string) => {
    setMobileState(prev => ({
      ...prev,
      selectedUserId: prev.selectedUserId === userId ? null : userId
    }));
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'admin': return 'default';
      case 'project_manager': return 'secondary';
      case 'accountant': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando usuarios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Administra los usuarios del sistema y sus permisos
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Usuario</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col mx-4 w-[calc(100vw-2rem)]">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Crear Nuevo Usuario
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Completa la información para crear un nuevo usuario del sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-medium flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Nombre *
                  </Label>
                  <Input
                    id="first_name"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Ingresa el nombre"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-medium flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Apellido *
                  </Label>
                  <Input
                    id="last_name"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Ingresa el apellido"
                    className="h-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo Electrónico *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@summaqualitas.com"
                  className="h-10"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Contraseña Temporal *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={mobileState.showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className="h-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setMobileState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  >
                    {mobileState.showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Rol del Usuario *
                </Label>
                <Select 
                  value={createForm.role_id} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, role_id: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
              
            <DialogFooter className="flex-shrink-0 mt-4 flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setMobileState(prev => ({ ...prev, showPassword: false }));
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-10"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !createForm.email || !createForm.password || !createForm.first_name || !createForm.last_name || !createForm.role_id}
                onClick={handleCreateUser}
                className="w-full sm:w-auto h-10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando Usuario...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Card className="mobile-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">
              {mobileState.isMobile ? 'Total' : 'Total Usuarios'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {mobileState.isMobile ? 'Registrados' : 'Usuarios registrados'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">
              {mobileState.isMobile ? 'Activos' : 'Usuarios Activos'}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {users.filter(u => u.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {mobileState.isMobile ? 'Con acceso' : 'Con acceso al sistema'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">
              {mobileState.isMobile ? 'Inactivos' : 'Usuarios Inactivos'}
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {users.filter(u => !u.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {mobileState.isMobile ? 'Sin acceso' : 'Sin acceso al sistema'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">
              {mobileState.isMobile ? 'Admins' : 'Administradores'}
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {users.filter(u => u.role?.name === 'admin' || u.is_master).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {mobileState.isMobile ? 'Permisos' : 'Con permisos completos'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="mobile-padding">
          <CardTitle className="text-base sm:text-lg">Buscar Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="mobile-padding">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={mobileState.isMobile ? "Buscar..." : "Buscar por nombre, email o rol..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 mobile-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader className="mobile-padding">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Usuarios
          </CardTitle>
          <CardDescription className="text-sm">
            {mobileState.isMobile ? 'Gestiona usuarios y permisos' : 'Gestiona los usuarios del sistema y sus permisos'}
          </CardDescription>
        </CardHeader>
        <CardContent className="mobile-padding">
          {/* Vista de escritorio - Tabla */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          {user.is_master && (
                            <div className="flex items-center space-x-1">
                              <Shield className="h-3 w-3 text-yellow-600" />
                              <span className="text-xs text-yellow-600">Usuario Maestro</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role?.name || '')}>
                        {user.role?.name || 'Sin rol'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('es-ES')
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id)}
                          className="h-8 w-8 p-0"
                          disabled={user.is_master}
                          title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {user.is_active ? (
                            <UserX className="h-4 w-4 text-red-600" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                          title="Editar usuario"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          disabled={user.is_master}
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Vista móvil - Tarjetas */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((user) => {
              const isSelected = mobileState.selectedUserId === user.id;
              
              return (
                <Card key={user.id} className="mobile-card border-l-4 border-l-primary/20">
                  <CardContent className="p-4">
                    {/* Header del usuario */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.is_master && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Shield className="h-3 w-3 text-yellow-600" />
                              <span className="text-xs text-yellow-600">Usuario Maestro</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMobileUserSelect(user.id)}
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Información del usuario */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Rol</div>
                        <Badge variant={getRoleBadgeVariant(user.role?.name || '')} className="text-xs">
                          {user.role?.name || 'Sin rol'}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Estado</div>
                        <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Último acceso */}
                    <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Último acceso
                      </div>
                      <div className="text-sm">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString('es-ES')
                          : 'Nunca'
                        }
                      </div>
                    </div>
                    
                    {/* Acciones - Solo visible cuando está seleccionado */}
                    {isSelected && (
                      <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id)}
                          className="flex items-center gap-2 text-xs"
                          disabled={user.is_master}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="h-3 w-3" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3" />
                              Activar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}
                          className="flex items-center gap-2 text-xs"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700"
                          disabled={user.is_master}
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Mensaje cuando no hay usuarios */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron usuarios</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primer usuario'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="mobile-padding">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}