'use client';

import { useState, useEffect } from 'react';
import ProjectKPIs from '@/components/analytics/ProjectKPIs';
import { withAuth } from '@/components/auth/withAuth';
import { UserRoleType, Project } from '@/lib/types';
import { projectService } from '@/lib/supabase/database';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart3, ArrowLeft, TrendingUp, Building2 } from 'lucide-react';
import { toast } from 'sonner';

function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const allProjects = await projectService.getAllProjects();
        setProjects(allProjects);
        
        // Seleccionar el primer proyecto por defecto si hay proyectos disponibles
        if (allProjects.length > 0) {
          setSelectedProject(allProjects[0]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Error al cargar los proyectos');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando proyectos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex gap-2">
            <Link href="/reports">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </Link>
            <Link href="/dashboard/executive">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard Ejecutivo
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Análisis y KPIs por Proyecto</h1>
        </div>
        <p className="text-gray-600">
          Análisis detallado de rendimiento con métricas EVM, tendencias financieras y KPIs específicos por proyecto
        </p>
      </div>
      
      {/* Selector de Proyecto */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Seleccionar Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Cargando proyectos...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No hay proyectos disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Select value={selectedProject?.id || ''} onValueChange={(value) => {
                const project = projects.find(p => p.id === value);
                setSelectedProject(project || null);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un proyecto para analizar" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-sm text-gray-500">
                          {typeof project.client === 'object' ? project.client?.name : project.client} • Estado: {project.status}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedProject && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{selectedProject.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Cliente:</span>
                      <p className="font-medium">{typeof selectedProject.client === 'object' ? selectedProject.client?.name : selectedProject.client || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <p className="font-medium capitalize">{selectedProject.status}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Presupuesto:</span>
                      <p className="font-medium">
                        ${(selectedProject.presupuesto_final || selectedProject.budget || selectedProject.presupuesto_inicial || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Progreso:</span>
                      <p className="font-medium">{selectedProject.progress || 0}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* KPIs del Proyecto Seleccionado */}
      {selectedProject && (
        <ProjectKPIs 
          project={selectedProject}
        />
      )}
      
      {!selectedProject && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Selecciona un proyecto
            </h3>
            <p className="text-gray-500">
              Elige un proyecto de la lista para ver sus análisis y KPIs detallados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withAuth(AnalyticsPage, ['gerencia', 'administrativo', 'cliente'] as UserRoleType[]);