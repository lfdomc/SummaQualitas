'use client';

import { useMemo } from 'react';
import { useAuthContext } from '@/lib/contexts/AuthContext';

export interface UserPermissions {
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canViewAllProjects: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canCreateEquipment: boolean;
  canEditEquipment: boolean;
  canDeleteEquipment: boolean;
  canCreateRentals: boolean;
  canEditRentals: boolean;
  canDeleteRentals: boolean;

  canViewFinancials: boolean;
  canManagePayments: boolean;
  canAccessAdmin: boolean;
  canViewReports: boolean;
  canExportData: boolean;
}

export function usePermissions(): UserPermissions {
  const { profile: user } = useAuthContext();

  const permissions = useMemo((): UserPermissions => {
    if (!user) {
      return {
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewAllProjects: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canCreateEquipment: false,
        canEditEquipment: false,
        canDeleteEquipment: false,
        canCreateRentals: false,
        canEditRentals: false,
        canDeleteRentals: false,

        canViewFinancials: false,
        canManagePayments: false,
        canAccessAdmin: false,
        canViewReports: false,
        canExportData: false,
      };
    }

    // Locally widen type to allow handling of legacy roles without affecting global typing
    const role = user.role as string;

    switch (role) {
      case 'maestro':
        return {
          canCreateProjects: true,
          canEditProjects: true,
          canDeleteProjects: true,
          canViewAllProjects: true,
          canCreateUsers: true,
          canEditUsers: true,
          canDeleteUsers: true,
          canCreateEquipment: true,
          canEditEquipment: true,
          canDeleteEquipment: true,
          canCreateRentals: true,
          canEditRentals: true,
          canDeleteRentals: true,

          canViewFinancials: true,
          canManagePayments: true,
          canAccessAdmin: true,
          canViewReports: true,
          canExportData: true,
        };

      case 'admin':
        return {
          canCreateProjects: true,
          canEditProjects: true,
          canDeleteProjects: true,
          canViewAllProjects: true,
          canCreateUsers: true,
          canEditUsers: true,
          canDeleteUsers: false, // Solo maestro puede eliminar usuarios
          canCreateEquipment: true,
          canEditEquipment: true,
          canDeleteEquipment: true,
          canCreateRentals: true,
          canEditRentals: true,
          canDeleteRentals: true,

          canViewFinancials: true,
          canManagePayments: true,
          canAccessAdmin: true,
          canViewReports: true,
          canExportData: true,
        };

      case 'gerencia':
        return {
          canCreateProjects: true,
          canEditProjects: true,
          canDeleteProjects: false,
          canViewAllProjects: true,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canCreateEquipment: true,
          canEditEquipment: true,
          canDeleteEquipment: false,
          canCreateRentals: true,
          canEditRentals: true,
          canDeleteRentals: false,

          canViewFinancials: true,
          canManagePayments: true,
          canAccessAdmin: false,
          canViewReports: true,
          canExportData: true,
        };

      case 'administrativo':
        return {
          canCreateProjects: false,
          canEditProjects: true,
          canDeleteProjects: false,
          canViewAllProjects: true,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canCreateEquipment: true,
          canEditEquipment: true,
          canDeleteEquipment: false,
          canCreateRentals: true,
          canEditRentals: true,
          canDeleteRentals: false,

          canViewFinancials: true,
          canManagePayments: true,
          canAccessAdmin: false,
          canViewReports: true,
          canExportData: false,
        };

      case 'contador':
        return {
          canCreateProjects: false,
          canEditProjects: false,
          canDeleteProjects: false,
          canViewAllProjects: true,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canCreateEquipment: false,
          canEditEquipment: false,
          canDeleteEquipment: false,
          canCreateRentals: false,
          canEditRentals: false,
          canDeleteRentals: false,

          canViewFinancials: true,
          canManagePayments: true,
          canAccessAdmin: false,
          canViewReports: true,
          canExportData: true,
        };

      case 'operador':
        return {
          canCreateProjects: false,
          canEditProjects: false,
          canDeleteProjects: false,
          canViewAllProjects: false,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canCreateEquipment: false,
          canEditEquipment: true,
          canDeleteEquipment: false,
          canCreateRentals: false,
          canEditRentals: true,
          canDeleteRentals: false,

          canViewFinancials: false,
          canManagePayments: false,
          canAccessAdmin: false,
          canViewReports: false,
          canExportData: false,
        };

      case 'cliente':
        return {
          canCreateProjects: false,
          canEditProjects: false,
          canDeleteProjects: false,
          canViewAllProjects: false, // Solo sus propios proyectos
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canCreateEquipment: false,
          canEditEquipment: false,
          canDeleteEquipment: false,
          canCreateRentals: false,
          canEditRentals: false,
          canDeleteRentals: false,

          canViewFinancials: false, // Solo sus propias facturas
          canManagePayments: false,
          canAccessAdmin: false,
          canViewReports: false,
          canExportData: false,
        };

      default:
        return {
          canCreateProjects: false,
          canEditProjects: false,
          canDeleteProjects: false,
          canViewAllProjects: false,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canCreateEquipment: false,
          canEditEquipment: false,
          canDeleteEquipment: false,
          canCreateRentals: false,
          canEditRentals: false,
          canDeleteRentals: false,

          canViewFinancials: false,
          canManagePayments: false,
          canAccessAdmin: false,
          canViewReports: false,
          canExportData: false,
        };
    }
  }, [user]);

  return permissions;
}

// Hook para verificar permisos específicos
export function useHasPermission(permission: keyof UserPermissions): boolean {
  const permissions = usePermissions();
  return permissions[permission];
}

// Hook para verificar múltiples permisos
export function useHasAnyPermission(permissionList: (keyof UserPermissions)[]): boolean {
  const permissions = usePermissions();
  return permissionList.some(permission => permissions[permission]);
}

// Hook para verificar que tenga todos los permisos
export function useHasAllPermissions(permissionList: (keyof UserPermissions)[]): boolean {
  const permissions = usePermissions();
  return permissionList.every(permission => permissions[permission]);
}