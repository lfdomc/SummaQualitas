'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/lib/types';

const supabase = createClient();

export default function DebugProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = 'cdcaf418-56ee-462a-ae27-43e481126633';

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setProject(data);
      console.log('Project data:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const presupuesto_original = project?.presupuesto_inicial || project?.budget || 0;
      const presupuesto_final = project?.presupuesto_inicial || project?.budget || 0;
      
      const { data, error } = await supabase
        .from('projects')
        .update({
          presupuesto_original,
          presupuesto_final,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select('*')
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setProject(data);
      console.log('Updated project data:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Debug Project Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={fetchProject} disabled={loading}>
              {loading ? 'Cargando...' : 'Recargar Proyecto'}
            </Button>
            <Button onClick={updateProject} disabled={loading || !project}>
              Actualizar Presupuestos
            </Button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {error}
            </div>
          )}
          
          {project && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Datos del Proyecto:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>ID:</strong> {project.id}
                </div>
                <div>
                  <strong>Nombre:</strong> {project.name}
                </div>
                <div>
                  <strong>Budget:</strong> {project.budget || 'null'}
                </div>
                <div>
                  <strong>Presupuesto Inicial:</strong> {project.presupuesto_inicial || 'null'}
                </div>
                <div>
                  <strong>Presupuesto Original:</strong> {project.presupuesto_original || 'null'}
                </div>
                <div>
                  <strong>Presupuesto Final:</strong> {project.presupuesto_final || 'null'}
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold">JSON Completo:</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(project, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}