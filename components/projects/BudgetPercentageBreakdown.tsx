'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calculator } from 'lucide-react';

interface BudgetPercentageBreakdownProps {
  budget: number;
  exchangeRate: number;
  totalArea: number;
  onBreakdownChange: (breakdown: BudgetBreakdownData) => void;
  initialBreakdown?: BudgetBreakdownData;
}

export interface BudgetBreakdownData {
  costosDirectos: number;
  manoObra: number;
  costosIndirectos: number;
  utilidad: number;
  gastosAdministrativos: number;
  imprevistos: number;
}

const defaultBreakdown: BudgetBreakdownData = {
  costosDirectos: 40,
  manoObra: 25,
  costosIndirectos: 15,
  utilidad: 10,
  gastosAdministrativos: 5,
  imprevistos: 5,
};

export function BudgetPercentageBreakdown({
  budget,
  exchangeRate,
  totalArea,
  onBreakdownChange,
  initialBreakdown = defaultBreakdown
}: BudgetPercentageBreakdownProps) {
  const [breakdown, setBreakdown] = useState<BudgetBreakdownData>(initialBreakdown);
  const [totalPercentage, setTotalPercentage] = useState(100);

  useEffect(() => {
    const total = Object.values(breakdown).reduce((sum, value) => {
      const numValue = typeof value === 'number' ? value : 0;
      return sum + numValue;
    }, 0);
    setTotalPercentage(total);
    onBreakdownChange(breakdown);
  }, [breakdown, onBreakdownChange]);

  const handlePercentageChange = (field: keyof BudgetBreakdownData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBreakdown(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleFocus = (field: keyof BudgetBreakdownData) => {
    // No modificamos el valor en focus para evitar problemas de tipo
    // El input manejará la visualización del valor vacío
  };

  const calculateAmount = (percentage: number): number => {
    return (budget * percentage) / 100;
  };

  const calculateUSDAmount = (amount: number): number => {
    return exchangeRate > 0 ? amount / exchangeRate : 0;
  };

  const calculateCostPerM2 = (amount: number): number => {
    return totalArea > 0 ? amount / totalArea : 0;
  };

  const isValidTotal = Math.abs(totalPercentage - 100) < 0.01;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Desglose Presupuestario por Porcentajes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isValidTotal && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Los porcentajes deben sumar exactamente 100%. Total actual: {totalPercentage.toFixed(2)}%
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Costos Directos */}
          <div className="space-y-2">
            <Label htmlFor="costosDirectos">Costos Directos (%)</Label>
            <Input
              id="costosDirectos"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={breakdown.costosDirectos === 0 ? '' : breakdown.costosDirectos}
              onChange={(e) => handlePercentageChange('costosDirectos', e.target.value)}
              onFocus={() => handleFocus('costosDirectos')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.costosDirectos).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.costosDirectos)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.costosDirectos)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
              )}
            </div>
          </div>

          {/* Mano de Obra */}
          <div className="space-y-2">
            <Label htmlFor="manoObra">Mano de Obra (%)</Label>
            <Input
              id="manoObra"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={breakdown.manoObra === 0 ? '' : breakdown.manoObra}
              onChange={(e) => handlePercentageChange('manoObra', e.target.value)}
              onFocus={() => handleFocus('manoObra')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.manoObra).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.manoObra)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.manoObra)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
              )}
            </div>
          </div>

          {/* Costos Indirectos */}
          <div className="space-y-2">
            <Label htmlFor="costosIndirectos">Costos Indirectos (%)</Label>
            <Input
              id="costosIndirectos"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={breakdown.costosIndirectos === 0 ? '' : breakdown.costosIndirectos}
              onChange={(e) => handlePercentageChange('costosIndirectos', e.target.value)}
              onFocus={() => handleFocus('costosIndirectos')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.costosIndirectos).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.costosIndirectos)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.costosIndirectos)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
              )}
            </div>
          </div>

          {/* Utilidad */}
          <div className="space-y-2">
            <Label htmlFor="utilidad">Utilidad (%)</Label>
            <Input
              id="utilidad"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={breakdown.utilidad === 0 ? '' : breakdown.utilidad}
              onChange={(e) => handlePercentageChange('utilidad', e.target.value)}
              onFocus={() => handleFocus('utilidad')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.utilidad).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.utilidad)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.utilidad)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
              )}
            </div>
          </div>

          {/* Gastos Administrativos */}
          <div className="space-y-2">
            <Label htmlFor="gastosAdministrativos">Gastos Administrativos (%)</Label>
            <Input
              id="gastosAdministrativos"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={breakdown.gastosAdministrativos === 0 ? '' : breakdown.gastosAdministrativos}
              onChange={(e) => handlePercentageChange('gastosAdministrativos', e.target.value)}
              onFocus={() => handleFocus('gastosAdministrativos')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.gastosAdministrativos).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.gastosAdministrativos)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.gastosAdministrativos)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
              )}
            </div>
          </div>

          {/* Imprevistos */}
          <div className="space-y-2">
            <Label htmlFor="imprevistos">Imprevistos (%)</Label>
            <Input
              id="imprevistos"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={breakdown.imprevistos === 0 ? '' : breakdown.imprevistos}
              onChange={(e) => handlePercentageChange('imprevistos', e.target.value)}
              onFocus={() => handleFocus('imprevistos')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.imprevistos).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.imprevistos)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.imprevistos)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
              )}
            </div>
          </div>
        </div>

        {/* Resumen Total */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Porcentajes</div>
              <div className={`text-lg font-semibold ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
                {totalPercentage.toFixed(2)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Presupuesto</div>
              <div className="text-lg font-semibold">
                ₡{budget.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-600">
                ${calculateUSDAmount(budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            {totalArea > 0 && (
              <div className="text-center">
                <div className="text-sm text-gray-600">Costo por m²</div>
                <div className="text-lg font-semibold">
                  ₡{calculateCostPerM2(budget).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²
                </div>
                <div className="text-sm text-gray-600">
                  ${calculateCostPerM2(calculateUSDAmount(budget)).toLocaleString('en-US', { minimumFractionDigits: 2 })}/m²
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}