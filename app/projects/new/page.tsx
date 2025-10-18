'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { withAuth } from '@/lib/auth/withAuth';
import { Project } from '@/lib/types';
import ProjectForm from '@/components/projects/ProjectForm';

function NewProjectPage() {
  const router = useRouter();

  const handleSuccess = (project: Project) => {
    router.push('/projects');
  };

  const handleCancel = () => {
     router.push('/projects');
   };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/projects">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Nuevo Proyecto</h1>
        </div>
      </div>

      <ProjectForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default withAuth(NewProjectPage, ['gerencia', 'administrativo']);