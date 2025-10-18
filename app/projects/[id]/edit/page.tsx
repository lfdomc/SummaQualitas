'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { ProjectService } from '@/lib/supabase/database';

const projectService = new ProjectService();
import { Project } from '@/lib/types';
import ProjectForm from '@/components/projects/ProjectForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { withAuth } from '@/lib/contexts/AuthContext';

function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthContext();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar permisos
    if (profile && !['gerencia', 'administrativo'].includes(profile.role)) {
      toast.error('No tienes permisos para editar proyectos');
      router.push('/projects');
      return;
    }

    const loadProject = async () => {
      try {
        setLoading(true);
        const projectId = params.id as string;
        
        if (!projectId) {
          throw new Error('ID de proyecto no válido');
        }

        const projectData = await projectService.getProjectById(projectId);
        
        if (!projectData) {
          throw new Error('Proyecto no encontrado');
        }

        setProject(projectData);
      } catch (error) {
      toast.error('Error al cargar el proyecto');
      router.push('/projects');
    } finally {
        setLoading(false);
      }
    };

    if (profile) {
      loadProject();
    }
  }, [params.id, profile, router]);



  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Proyecto no encontrado'}</p>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Proyectos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/projects" className="hover:text-gray-700">
            Proyectos
          </Link>
          <span>/</span>
          <Link href={`/projects/${project.id}`} className="hover:text-gray-700">
            {project.name}
          </Link>
          <span>/</span>
          <span>Editar</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Building2 className="mr-3 h-8 w-8 text-blue-600" />
              Editar Proyecto
            </h1>
            <p className="text-gray-600 mt-1">
              Modifica la información del proyecto {project.name}
            </p>
          </div>
          
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </Link>
        </div>
      </div>

      <ProjectForm
        project={project}
        onSuccess={(updatedProject) => {
          router.push(`/projects/${updatedProject.id}`);
        }}
        onCancel={() => router.push(`/projects/${project.id}`)}
      />
    </div>
  );
}

export default withAuth(EditProjectPage, ['gerencia', 'administrativo']);