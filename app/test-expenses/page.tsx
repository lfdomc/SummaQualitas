'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  suppliers?: {
    name: string;
  }[];
}

export default function TestExpensesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const supabase = createClient();
  const projectId = '4ab0d3ba-1266-4c6b-b75e-dbdac5efce41';

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setError(`Error de autenticación: ${authError.message}`);
        return;
      }
      
      if (!user) {
        setError('Usuario no autenticado');
        return;
      }
      
      setUser(user);
      
      // 2. Cargar expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          description,
          amount,
          currency,
          expense_date,
          suppliers (
            name
          )
        `)
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false });
      
      if (expensesError) {
        setError(`Error al cargar expenses: ${expensesError.message}`);
        return;
      }
      
      setExpenses(expensesData || []);
      
    } catch (err: unknown) {
      setError(`Error general: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@summaqualitas.com',
        password: 'admin123'
      });
      
      if (error) {
        setError(`Error de login: ${error.message}`);
        return;
      }
      
      // Recargar datos después del login
      checkAuthAndLoadData();
    } catch (err: unknown) {
      setError(`Error de login: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setExpenses([]);
      setError('');
      
      // Forzar refresh completo después del logout manual
      setTimeout(() => {
        window.location.href = '/?reason=manual_logout';
      }, 100);
    } catch (error) {
      // Forzar refresh incluso si hay error
      setTimeout(() => {
        window.location.href = '/?reason=manual_logout';
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test de Expenses</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Expenses</h1>
      
      {/* Estado de autenticación */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Estado de Autenticación</h2>
        {user ? (
          <div>
            <p className="text-green-600">✅ Usuario autenticado: {user.email}</p>
            <button 
              onClick={handleLogout}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div>
            <p className="text-red-600">❌ Usuario no autenticado</p>
            <button 
              onClick={handleLogin}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Iniciar Sesión (admin@summaqualitas.com)
            </button>
          </div>
        )}
      </div>

      {/* Errores */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      )}

      {/* Expenses */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Expenses del Proyecto</h2>
        <p className="mb-4">Project ID: {projectId}</p>
        
        {expenses.length > 0 ? (
          <div>
            <p className="text-green-600 mb-4">✅ {expenses.length} expense(s) found</p>
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div key={expense.id} className="p-3 bg-gray-50 rounded">
                  <div className="font-medium">{expense.description}</div>
                  <div className="text-sm text-gray-600">
                    {expense.amount.toLocaleString()} {expense.currency} - {expense.expense_date}
                  </div>
                  {expense.suppliers && (
                    <div className="text-sm text-blue-600">
                      Supplier: {expense.suppliers.map((s) => s.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-yellow-600">⚠️ No expenses found</p>
        )}
      </div>
    </div>
  );
}