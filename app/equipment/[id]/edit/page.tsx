'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { withAuth } from '@/components/auth/withAuth';
import { Equipment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EquipmentService } from '@/lib/supabase/database';
import { toast } from 'sonner';

function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const equipmentId = params.id as string;

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const equipmentService = new EquipmentService();
        const equipmentList = await equipmentService.getAllEquipment();
        const foundEquipment = equipmentList.find((eq: Equipment) => eq.id === equipmentId);
        
        if (foundEquipment) {
          setEquipment(foundEquipment);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching equipment:', error);
        toast.error('Error al cargar el equipo');
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (equipmentId) {
      fetchEquipment();
    }
  }, [equipmentId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-40 mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="max-w-4xl">
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Equipo no encontrado
          </h1>
          <p className="text-gray-600 mb-8">
            El equipo que buscas no existe o ha sido eliminado.
          </p>
          <Link href="/equipment">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Equipos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/equipment`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Equipos
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Editar Equipo: {equipment?.name}
        </h1>
        <p className="text-gray-600">
          Modifica los detalles del equipo de construcción.
        </p>
      </div>
      
      <div className="max-w-4xl">
        <EquipmentForm 
          equipment={equipment}
          onSuccess={() => router.push('/equipment')}
          onCancel={() => router.push('/equipment')}
        />
      </div>
    </div>
  );
}

export default withAuth(EditEquipmentPage, ['gerencia', 'administrativo']);