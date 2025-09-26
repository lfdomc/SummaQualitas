'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  // Porcentajes
  costos_directos_porcentaje: number;
  costos_indirectos_porcentaje: number;
  mano_obra_porcentaje: number;
  administracion_porcentaje: number;
  imprevistos_porcentaje: number;
  utilidad_porcentaje: number;
  // Montos calculados
  costos_directos: number;
  costos_indirectos: number;
  mano_obra: number;
  administracion: number;
  imprevistos: number;
  utilidad: number;
}

const defaultBreakdown: BudgetBreakdownData = {
  // Porcentajes por defecto
  costos_directos_porcentaje: 40,
  costos_indirectos_porcentaje: 20,
  mano_obra_porcentaje: 25,
  administracion_porcentaje: 8,
  imprevistos_porcentaje: 5,
  utilidad_porcentaje: 2,
  // Montos se calcularán dinámicamente
  costos_directos: 0,
  costos_indirectos: 0,
  mano_obra: 0,
  administracion: 0,
  imprevistos: 0,
  utilidad: 0,
};

export function BudgetPercentageBreakdown({
  budget,
  exchangeRate,
  totalArea,
  onBreakdownChange,
  initialBreakdown = defaultBreakdown
}: BudgetPercentageBreakdownProps) {
  const [breakdown, setBreakdown] = useState<BudgetBreakdownData>(initialBreakdown);

  // Calcular el total de porcentajes usando useMemo
  const totalPercentage = useMemo(() => {
    return breakdown.costos_directos_porcentaje + breakdown.costos_indirectos_porcentaje + breakdown.mano_obra_porcentaje + 
           breakdown.administracion_porcentaje + breakdown.imprevistos_porcentaje + breakdown.utilidad_porcentaje;
  }, [breakdown.costos_directos_porcentaje, breakdown.costos_indirectos_porcentaje, breakdown.mano_obra_porcentaje, 
      breakdown.administracion_porcentaje, breakdown.imprevistos_porcentaje, breakdown.utilidad_porcentaje]);

  // Calcular el breakdown completo con montos usando useMemo
  const calculatedBreakdown = useMemo(() => {
    return {
      ...breakdown,
      costos_directos: (budget * breakdown.costos_directos_porcentaje) / 100,
      costos_indirectos: (budget * breakdown.costos_indirectos_porcentaje) / 100,
      mano_obra: (budget * breakdown.mano_obra_porcentaje) / 100,
      administracion: (budget * breakdown.administracion_porcentaje) / 100,
      imprevistos: (budget * breakdown.imprevistos_porcentaje) / 100,
      utilidad: (budget * breakdown.utilidad_porcentaje) / 100,
    };
  }, [breakdown, budget]);

  // Notificar cambios al componente padre solo cuando sea necesario
  useEffect(() => {
    onBreakdownChange(calculatedBreakdown);
  }, [calculatedBreakdown, onBreakdownChange]);

  const handlePercentageChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const percentageField = `${field}_porcentaje` as keyof BudgetBreakdownData;
    const newBreakdown = { ...breakdown, [percentageField]: numValue };
    setBreakdown(newBreakdown);
  };

  const handleFocus = (field: string) => {
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
            <Label htmlFor="costos_directos">Costos Directos (%)</Label>
            <Input
              id="costos_directos"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={breakdown.costos_directos_porcentaje === 0 ? '' : breakdown.costos_directos_porcentaje}
              onChange={(e) => handlePercentageChange('costos_directos', e.target.value)}
              onFocus={() => handleFocus('costos_directos')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.costos_directos_porcentaje).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.costos_directos_porcentaje)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.costos_directos_porcentaje)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
              )}
            </div>
          </div>

          {/* Costos Indirectos */}
          <div className="space-y-2">
            <Label htmlFor="costos_indirectos">Costos Indirectos (%)</Label>
            <Input
              id="costos_indirectos"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={breakdown.costos_indirectos_porcentaje === 0 ? '' : breakdown.costos_indirectos_porcentaje}
              onChange={(e) => handlePercentageChange('costos_indirectos', e.target.value)}
              onFocus={() => handleFocus('costos_indirectos')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.costos_indirectos_porcentaje).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.costos_indirectos_porcentaje)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.costos_indirectos_porcentaje)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
              )}
            </div>
          </div>

          {/* Mano de Obra */}
          <div className="space-y-2">
            <Label htmlFor="mano_obra">Mano de Obra (%)</Label>
            <Input
              id="mano_obra"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={breakdown.mano_obra_porcentaje === 0 ? '' : breakdown.mano_obra_porcentaje}
              onChange={(e) => handlePercentageChange('mano_obra', e.target.value)}
              onFocus={() => handleFocus('mano_obra')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.mano_obra_porcentaje).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.mano_obra_porcentaje)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.mano_obra_porcentaje)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
              )}
            </div>
          </div>

          {/* Administración */}
          <div className="space-y-2">
            <Label htmlFor="administracion">Administración (%)</Label>
            <Input
              id="administracion"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={breakdown.administracion_porcentaje === 0 ? '' : breakdown.administracion_porcentaje}
              onChange={(e) => handlePercentageChange('administracion', e.target.value)}
              onFocus={() => handleFocus('administracion')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.administracion_porcentaje).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.administracion_porcentaje)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.administracion_porcentaje)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
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
              value={breakdown.imprevistos_porcentaje === 0 ? '' : breakdown.imprevistos_porcentaje}
              onChange={(e) => handlePercentageChange('imprevistos', e.target.value)}
              onFocus={() => handleFocus('imprevistos')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.imprevistos_porcentaje).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.imprevistos_porcentaje)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.imprevistos_porcentaje)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
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
              value={breakdown.utilidad_porcentaje === 0 ? '' : breakdown.utilidad_porcentaje}
              onChange={(e) => handlePercentageChange('utilidad', e.target.value)}
              onFocus={() => handleFocus('utilidad')}
              className={!isValidTotal ? 'border-red-500' : ''}
            />
            <div className="text-sm text-gray-600">
              <div>₡{calculateAmount(breakdown.utilidad_porcentaje).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
              <div>${calculateUSDAmount(calculateAmount(breakdown.utilidad_porcentaje)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              {totalArea > 0 && (
                <div>₡{calculateCostPerM2(calculateAmount(breakdown.utilidad_porcentaje)).toLocaleString('es-CR', { minimumFractionDigits: 2 })}/m²</div>
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