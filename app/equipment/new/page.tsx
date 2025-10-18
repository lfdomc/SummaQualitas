'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { withAuth } from '@/components/auth/withAuth';
import { Button } from '@/components/ui/button';

function NewEquipmentPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/equipment">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Equipos
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nuevo Equipo de Construcción
        </h1>
        <p className="text-gray-600">
          Registra un nuevo equipo en el inventario del sistema.
        </p>
      </div>
      
      <div className="max-w-4xl">
        <EquipmentForm 
          onSuccess={() => router.push('/equipment')}
          onCancel={() => router.push('/equipment')}
        />
      </div>
    </div>
  );
}

export default withAuth(NewEquipmentPage, ['gerencia', 'administrativo']);