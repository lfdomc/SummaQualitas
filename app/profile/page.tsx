'use client';

import UserProfile from '@/components/profile/UserProfile';
import { withAuth } from '@/components/auth/withAuth';
// import { UserRole } from '@/lib/types';



function ProfilePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>
        
        <UserProfile />
      </div>
    </div>
  );
}

// Protect this page - all authenticated users can access their profile
export default withAuth(ProfilePage, ['gerencia', 'administrativo', 'cliente']);