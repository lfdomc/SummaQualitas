'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building,
  Users,
  Settings,
  AlertTriangle,
  TrendingUp,
  Calculator,
  DollarSign
} from 'lucide-react';
import { Project } from '@/lib/types';


interface BudgetItemsBreakdownProps {
  project: Project;
  exchangeRate?: number;
}

interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
}

export function BudgetItemsBreakdown({ project, exchangeRate = 500 }: BudgetItemsBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatUSDCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const calculateUSDAmount = (amount: number): number => {
    return exchangeRate > 0 ? amount / exchangeRate : 0;
  };

  const calculatePercentage = (amount: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((amount / total) * 100 * 10) / 10; // Redondear a 1 decimal
  };

  const totalBudget = project.presupuesto_final || project.presupuesto_inicial || project.budget || 0;



  // Crear las partidas presupuestarias basadas en los campos correctos de la tabla projects
  const budgetItems: BudgetItem[] = [
    {
      id: 'costos_directos',
      name: 'Costos Directos',
      amount: project.costos_directos || 0,
      percentage: calculatePercentage(project.costos_directos || 0, totalBudget),
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Costos directos de materiales y construcción'
    },
    {
      id: 'costos_indirectos',
      name: 'Costos Indirectos',
      amount: project.costos_indirectos || 0,
      percentage: calculatePercentage(project.costos_indirectos || 0, totalBudget),
      icon: Settings,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Costos indirectos y gastos generales'
    },
    {
      id: 'administracion',
      name: 'Administración',
      amount: project.administracion || 0,
      percentage: calculatePercentage(project.administracion || 0, totalBudget),
      icon: Calculator,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Gastos administrativos y de gestión'
    },
    {
      id: 'mano_obra',
      name: 'Mano de Obra',
      amount: project.mano_obra || 0,
      percentage: calculatePercentage(project.mano_obra || 0, totalBudget),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Costos de personal y mano de obra'
    },
    {
      id: 'imprevistos',
      name: 'Imprevistos',
      amount: project.imprevistos || 0,
      percentage: calculatePercentage(project.imprevistos || 0, totalBudget),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Contingencias e imprevistos'
    },
    {
      id: 'utilidad',
      name: 'Utilidad',
      amount: project.utilidad || 0,
      percentage: calculatePercentage(project.utilidad || 0, totalBudget),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Margen de utilidad del proyecto'
    }
  ].filter(item => item.amount > 0); // Solo mostrar partidas con valor

  const totalAssigned = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPercentage = budgetItems.reduce((sum, item) => sum + item.percentage, 0);
  const unassigned = totalBudget - totalAssigned;
  const unassignedPercentage = calculatePercentage(unassigned, totalBudget);



  if (budgetItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Resumen del Presupuesto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Partidas Presupuestarias
          </CardTitle>
          <CardDescription>
            Desglose detallado del presupuesto por categorías con porcentajes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Presupuesto Total</p>
              <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalBudget)}</p>
              <p className="text-sm text-blue-600">{formatUSDCurrency(calculateUSDAmount(totalBudget))}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Asignado</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(totalAssigned)}</p>
              <p className="text-sm text-green-600">{totalPercentage.toFixed(1)}% del presupuesto</p>
            </div>
            {unassigned > 0 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Sin Asignar</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(unassigned)}</p>
                <p className="text-sm text-gray-600">{unassignedPercentage.toFixed(1)}% restante</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Partidas Presupuestarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <IconComponent className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {item.percentage.toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monto asignado:</span>
                    <span className="font-semibold">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Equivalente USD:</span>
                    <span className="text-sm text-gray-500">{formatUSDCurrency(calculateUSDAmount(item.amount))}</span>
                  </div>
                  
                  {/* Barra de progreso visual */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Porcentaje del presupuesto</span>
                      <span>{item.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={item.percentage} 
                      className="h-2"
                      max={100}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información adicional */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Tipo de cambio utilizado:</span>
            <span>₡{exchangeRate.toLocaleString()} por USD</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}