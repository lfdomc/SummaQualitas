'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { projectService, incomeService, expenseService } from '@/lib/supabase/database';
import { BudgetItem, UserRole, Income, Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Edit, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  FileText,
  Building,
  Wrench,
  Users,
  Truck
} from 'lucide-react';

interface BudgetBreakdownProps {
  projectId: string;
  totalBudget: number;
  exchangeRate?: number;
  onBudgetUpdate?: () => void;
}

const BUDGET_CATEGORIES = [
  { value: 'costos_directos', label: 'Costos Directos', icon: Building },
  { value: 'costos_indirectos', label: 'Costos Indirectos', icon: Calculator },
  { value: 'administracion', label: 'Administración', icon: FileText },
  { value: 'mano_obra', label: 'Mano de Obra', icon: Users },
  { value: 'imprevistos', label: 'Imprevistos', icon: Truck },
  { value: 'utilidad', label: 'Utilidad', icon: TrendingUp }
];

export function BudgetBreakdown({ projectId, totalBudget, exchangeRate = 500, onBudgetUpdate }: BudgetBreakdownProps) {
  const { hasRole } = useAuthContext();
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const canEdit = hasRole(UserRole.GERENCIA) || hasRole(UserRole.ADMINISTRATIVO);

  useEffect(() => {
    loadFinancialData();
  }, [projectId]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [budgetItemsData, incomesData, expensesData] = await Promise.all([
        projectService.getBudgetItems(projectId),
        incomeService.getProjectIncomes(projectId),
        expenseService.getProjectExpenses(projectId)
      ]);
      
      setBudgetItems(budgetItemsData);
      setIncomes(incomesData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Error al cargar los datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetItems = async () => {
    await loadFinancialData();
  };

  const handleDelete = async (itemId: string) => {
    try {
      await projectService.deleteBudgetItem(itemId);
      toast.success('Partida presupuestaria eliminada');
      await loadBudgetItems();
      onBudgetUpdate?.();
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast.error('Error al eliminar la partida presupuestaria');
    }
  };

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

  const getCategoryIcon = (category: string) => {
    const categoryConfig = BUDGET_CATEGORIES.find(cat => cat.value === category);
    return categoryConfig?.icon || Calculator;
  };

  const getCategoryLabel = (category: string) => {
    const categoryConfig = BUDGET_CATEGORIES.find(cat => cat.value === category);
    return categoryConfig?.label || category;
  };

  const getTotalEstimated = () => {
    // Usar directamente el presupuesto total del proyecto
    return totalBudget;
  };

  const getTotalActual = () => {
    // Calcular gastos reales del proyecto
    return expenses.reduce((sum, expense) => {
      // Convertir a CRC si está en USD
      const amountInCRC = expense.currency === 'USD' 
        ? expense.amount * exchangeRate 
        : expense.amount;
      return sum + amountInCRC;
    }, 0);
  };

  const getTotalIncomes = () => {
    // Calcular ingresos confirmados del proyecto
    return incomes
      .filter(income => income.status === 'confirmed')
      .reduce((sum, income) => {
        // Convertir a CRC si está en USD
        const amountInCRC = income.currency === 'USD' 
          ? income.amount * exchangeRate 
          : income.amount;
        return sum + amountInCRC;
      }, 0);
  };

  const getVariance = () => {
    // Variación = Gastos Reales - Presupuesto Estimado
    return getTotalActual() - getTotalEstimated();
  };

  const getActualProfit = () => {
    // Ganancia Real = Ingresos Confirmados - Gastos Reales
    return getTotalIncomes() - getTotalActual();
  };

  const getBudgetUtilization = () => {
    if (totalBudget === 0) return 0;
    return Math.round((getTotalEstimated() / totalBudget) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Presupuesto Total</p>
                <p className="text-lg font-bold">{formatCurrency(totalBudget)}</p>
                <p className="text-sm text-gray-600">{formatUSDCurrency(calculateUSDAmount(totalBudget))}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estimado</p>
                <p className="text-lg font-bold">{formatCurrency(getTotalEstimated())}</p>
                <p className="text-sm text-gray-600">{formatUSDCurrency(calculateUSDAmount(getTotalEstimated()))}</p>
              </div>
              <Calculator className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actual</p>
                <p className="text-lg font-bold">{formatCurrency(getTotalActual())}</p>
                <p className="text-sm text-gray-600">{formatUSDCurrency(calculateUSDAmount(getTotalActual()))}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Variación</p>
                <p className={`text-lg font-bold ${
                  getVariance() >= 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {formatCurrency(Math.abs(getVariance()))}
                </p>
                <p className={`text-sm ${
                  getVariance() >= 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {formatUSDCurrency(Math.abs(calculateUSDAmount(getVariance())))}
                </p>
              </div>
              {getVariance() >= 0 ? (
                <TrendingUp className="h-8 w-8 text-red-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}