'use client';

import { Expense, Project, Income } from '@/types/database';

interface ExpenseChartProps {
  costSections: { title: string; expenses: Expense[] }[];
  convertCurrency: (amount: number, from: string, to: string) => number;
  formatCurrency: (amount: number, currency: string) => string;
  incomes: Income[];
  expenses: Expense[];
  project: Project;
}

export function ExpenseChartHTML({ costSections, convertCurrency, formatCurrency, incomes, expenses, project }: ExpenseChartProps) {
  // Calcular totales por categoría en USD
  const chartData = costSections.map(section => {
    const total = section.expenses.reduce((sum, expense) => {
      return sum + convertCurrency(expense.amount, expense.currency, 'USD');
    }, 0);
    return {
      title: section.title,
      amount: total,
      shortTitle: section.title.replace('COSTOS ', '').replace('GASTOS ', '').replace('DIRECTOS', 'DIRECTOS').replace('INDIRECTOS', 'INDIRECTOS').replace('ADMINISTRATIVOS', 'ADMIN.').replace('IMPREVISTOS', 'IMPREVISTOS')
    };
  }).filter(item => item.amount > 0);

  const maxAmount = Math.max(...chartData.map(item => item.amount));
  const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0);

  // Paleta de colores en escalas de azul
  const colorSets = [
    { main: '#1e40af', light: '#3b82f6', dark: '#1e3a8a' }, // Blue 700
    { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8' }, // Blue 600
    { main: '#3b82f6', light: '#93c5fd', dark: '#2563eb' }, // Blue 500
    { main: '#60a5fa', light: '#bfdbfe', dark: '#3b82f6' }, // Blue 400
    { main: '#93c5fd', light: '#dbeafe', dark: '#60a5fa' }  // Blue 300
  ];

  return (
    <div className="component-container w-full">
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-lg">
        <h2 className="text-xl font-semibold text-center mb-2 text-gray-800">
          Expense Analysis by Category
        </h2>
        
        {/* Gráfico de barras verticales usando HTML/CSS */}
        <div className="mb-8">
          {/* Título del gráfico */}
          <h3 className="text-lg font-semibold mb-28 text-center text-gray-700">
            Expense Distribution (USD)
          </h3>
          
          {/* Contenedor del gráfico vertical */}
          <div className="flex justify-center mb-6 mt-8">
            <div className="w-full max-w-5xl">
              
              {/* Escala vertical */}
              <div className="flex">
                {/* Eje Y con valores */}
                <div className="flex flex-col justify-between h-80 w-16 text-right pr-2 text-xs text-gray-500">
                  <span>${(maxAmount / 1000).toFixed(0)}K</span>
                  <span>${(maxAmount * 3 / 4 / 1000).toFixed(0)}K</span>
                  <span>${(maxAmount / 2 / 1000).toFixed(0)}K</span>
                  <span>${(maxAmount / 4 / 1000).toFixed(0)}K</span>
                  <span>$0</span>
                </div>
                
                {/* Área del gráfico */}
                <div className="flex-1 relative">
                  {/* Líneas de referencia horizontales */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="border-t border-gray-200 w-full"></div>
                    ))}
                  </div>
                  
                  {/* Barras verticales */}
                  <div className="flex items-end justify-center h-80 space-x-6 relative z-10">
                    {chartData.map((item, index) => {
                      const percentage = (item.amount / maxAmount) * 100;
                      const colorSet = colorSets[index % colorSets.length];
                      
                      return (
                        <div key={item.title} className="flex flex-col items-center space-y-2">
                          {/* Etiqueta de categoría arriba */}
                          <div className="text-center mb-1">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: colorSet.main }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-800 leading-tight block max-w-32">
                              {item.shortTitle.split(' ').map((word, i) => (
                                <span key={i} className="block">{word}</span>
                              ))}
                            </span>
                          </div>
                          
                          {/* Valor encima de la barra */}
                          <div className="text-xs font-semibold text-gray-700 text-center mb-1">
                            {formatCurrency(item.amount, 'USD')}
                          </div>
                          
                          {/* Porcentaje */}
                          <div className="text-xs font-medium text-gray-600">
                            {((item.amount / totalAmount) * 100).toFixed(1)}%
                          </div>
                          
                          {/* Barra vertical */}
                          <div className="relative">
                            <div className="w-32 bg-gray-200 rounded-t-lg relative overflow-hidden" style={{ height: '300px' }}>
                              <div 
                                className="w-full rounded-t-lg transition-all duration-500 absolute bottom-0"
                                style={{ 
                                  height: `${percentage}%`,
                                  backgroundColor: colorSet.main,
                                  background: `linear-gradient(to top, ${colorSet.main}, ${colorSet.light})`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Etiqueta del eje X */}
              <div className="text-center mt-4">
                <span className="text-sm font-medium text-gray-600">Expense Categories</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabla de resumen */}
        <div className="mt-6 flex justify-center">
          <div className="w-full max-w-2xl">
            <h3 className="text-base font-semibold mb-4 text-center text-gray-700">Financial Summary</h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Category</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount (USD)</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">%</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => {
                    const percentage = (item.amount / totalAmount) * 100;
                    const colorSet = colorSets[index % colorSets.length];
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50" style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                        <td className="px-3 py-2 border-b border-gray-200">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: colorSet.main }}
                            ></div>
                            <span className="font-medium text-gray-800">{item.shortTitle}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-gray-800 border-b border-gray-200">
                          {formatCurrency(item.amount, 'USD')}
                        </td>
                        <td className="px-3 py-2 text-right border-b border-gray-200">
                          <span className="font-semibold text-gray-700">{percentage.toFixed(1)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="px-3 py-2 font-semibold text-gray-800">TOTAL</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800">
                      {formatCurrency(totalAmount, 'USD')}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}