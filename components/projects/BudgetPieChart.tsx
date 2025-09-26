'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Project } from '@/lib/types';

interface BudgetPieChartProps {
  project: Project;
  exchangeRate?: number;
}

interface ChartDataItem {
  name: string;
  value: number;
  amount: number;
  color: string;
}

export function BudgetPieChart({ project, exchangeRate = 500 }: BudgetPieChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculatePercentage = (amount: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((amount / total) * 100 * 10) / 10; // Redondear a 1 decimal
  };

  const totalBudget = project.presupuesto_final || project.presupuesto_inicial || project.budget || 0;

  // Colores para cada categoría (usando los campos correctos de la tabla projects)
  const categoryColors = {
    costos_directos: '#3B82F6',      // blue-500
    costos_indirectos: '#8B5CF6',    // violet-500
    administracion: '#F59E0B',       // amber-500
    mano_obra: '#10B981',            // emerald-500
    imprevistos: '#EF4444',          // red-500
    utilidad: '#06B6D4'              // cyan-500
  };

  // Crear las partidas presupuestarias basadas en los campos correctos de la tabla projects
  const budgetItems = [
    {
      id: 'costos_directos',
      name: 'Costos Directos',
      amount: project.costos_directos || 0,
      percentage: calculatePercentage(project.costos_directos || 0, totalBudget)
    },
    {
      id: 'costos_indirectos',
      name: 'Costos Indirectos',
      amount: project.costos_indirectos || 0,
      percentage: calculatePercentage(project.costos_indirectos || 0, totalBudget)
    },
    {
      id: 'administracion',
      name: 'Administración',
      amount: project.administracion || 0,
      percentage: calculatePercentage(project.administracion || 0, totalBudget)
    },
    {
      id: 'mano_obra',
      name: 'Mano de Obra',
      amount: project.mano_obra || 0,
      percentage: calculatePercentage(project.mano_obra || 0, totalBudget)
    },
    {
      id: 'imprevistos',
      name: 'Imprevistos',
      amount: project.imprevistos || 0,
      percentage: calculatePercentage(project.imprevistos || 0, totalBudget)
    },
    {
      id: 'utilidad',
      name: 'Utilidad',
      amount: project.utilidad || 0,
      percentage: calculatePercentage(project.utilidad || 0, totalBudget)
    }
  ].filter(item => item.amount > 0); // Solo mostrar partidas con valor

  // Datos para el pie chart
  const chartData: ChartDataItem[] = budgetItems.map(item => ({
    name: item.name,
    value: item.percentage,
    amount: item.amount,
    color: categoryColors[item.id as keyof typeof categoryColors] || '#6B7280'
  }));

  // Componente de tooltip personalizado para el pie chart
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; amount: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(data.amount)} ({data.value.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Distribución del Presupuesto
          </CardTitle>
          <CardDescription>
            Visualización gráfica de las partidas presupuestarias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <PieChartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay datos suficientes para mostrar el gráfico.</p>
            <p className="text-sm mt-2">Se requieren partidas presupuestarias con valores asignados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Distribución del Presupuesto
        </CardTitle>
        <CardDescription>
          Visualización gráfica de las partidas presupuestarias por porcentaje
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}