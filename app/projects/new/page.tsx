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
    // Forzar revalidación tras navegar, para asegurar datos frescos
    setTimeout(() => {
      try { router.refresh(); } catch {}
    }, 200);
  };

  const handleCancel = () => {
     router.push('/projects');
     setTimeout(() => {
       try { router.refresh(); } catch {}
     }, 200);
   };

  return (
    <div className="container mx-auto py-6 px-2 sm:px-4">
      <div className="flex items-center gap-4 mb-6 max-[350px]:flex-wrap max-[350px]:gap-2">
        <Link href="/projects">
          <Button variant="outline" size="sm" className="max-[350px]:h-8 max-[350px]:px-2 max-[350px]:text-xs">
            <ArrowLeft className="h-4 w-4 mr-2 max-[350px]:hidden" />
            <span className="max-[350px]:leading-4">Volver</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2 max-[350px]:gap-1">
          <Building2 className="h-6 w-6 max-[350px]:h-5 max-[350px]:w-5" />
          <h1 className="text-2xl font-bold max-[350px]:text-lg">Nuevo Proyecto</h1>
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