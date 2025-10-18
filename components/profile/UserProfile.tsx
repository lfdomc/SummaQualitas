'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { UserService } from '@/lib/supabase/database';
import { UserProfile as UserProfileType, UserRoleType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

interface UserProfileProps {
  userId?: string;
  isEditable?: boolean;
}

export default function UserProfile({ userId, isEditable = true }: UserProfileProps) {
  const { user, hasRole, hasAnyRole } = useAuthContext();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    role: 'administrativo' as UserRoleType,
    department: '',
    bio: ''
  });

  const targetUserId = userId || user?.id;
  const canEdit = isEditable && (targetUserId === user?.id || hasAnyRole(['gerencia']));
  const canChangeRole = hasAnyRole(['gerencia']) && targetUserId !== user?.id;

  useEffect(() => {
    if (targetUserId) {
      loadProfile();
    }
  }, [targetUserId]);

  const loadProfile = async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      const userService = new UserService();
      const profileData = await userService.getUserProfile(targetUserId);
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          // phone: profileData.phone || '', // Campo removido del esquema
          address: profileData.address || '',
          role: profileData.role,
          department: profileData.department || '',
          bio: profileData.bio || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!targetUserId) return;
    
    try {
      setSaving(true);
      const userService = new UserService();
      
      const updateData: Partial<UserProfileType> = {
        name: formData.name,
        // phone: formData.phone, // Campo removido del esquema
        address: formData.address,
        department: formData.department,
        bio: formData.bio
      };

      // Only management can change roles
      if (canChangeRole) {
        updateData.role = formData.role;
      }

      await userService.updateUserProfile(targetUserId, updateData);
      await loadProfile();
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        // phone: profile.phone || '', // Campo removido del esquema
        address: profile.address || '',
        role: profile.role,
        department: profile.department || '',
        bio: profile.bio || ''
      });
    }
    setIsEditing(false);
  };

  const getRoleLabel = (role: UserRoleType) => {
    switch (role) {
      case 'gerencia':
        return 'Gerencia';
      case 'administrativo':
        return 'Administrativo';
      case 'cliente':
        return 'Cliente';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Cargando perfil...</span>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No se pudo cargar el perfil</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil de Usuario
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Editando información del perfil' : 'Información del perfil de usuario'}
            </CardDescription>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Guardar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              El email no se puede modificar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nombre Completo
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              placeholder="Ingrese su nombre completo"
            />
          </div>

          {/* Campo phone removido del esquema de base de datos
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Teléfono
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="Ingrese su teléfono"
            />
          </div>
          */}

          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Rol
            </Label>
            {canChangeRole && isEditing ? (
              <Select
                value={formData.role}
                onValueChange={(value: UserRoleType) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={'gerencia'}>Gerencia</SelectItem>
                  <SelectItem value={'administrativo'}>Administrativo</SelectItem>
                  <SelectItem value={'cliente'}>Cliente</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="role"
                value={getRoleLabel(profile.role)}
                disabled
                className="bg-muted"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">
              Departamento
            </Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              disabled={!isEditing}
              placeholder="Departamento o área"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Dirección
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            disabled={!isEditing}
            placeholder="Ingrese su dirección"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">
            Biografía
          </Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            disabled={!isEditing}
            placeholder="Información adicional sobre el usuario"
            rows={3}
          />
        </div>

        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <strong>Creado:</strong> {new Date(profile.created_at).toLocaleDateString('es-ES')}
            </div>
            <div>
              <strong>Última actualización:</strong> {new Date(profile.updated_at).toLocaleDateString('es-ES')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}