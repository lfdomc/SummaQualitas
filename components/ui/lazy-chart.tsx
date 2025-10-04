'use client';

import { Suspense, lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Lazy load de todos los componentes de Recharts
const LineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })));
const Line = lazy(() => import('recharts').then(module => ({ default: module.Line })));
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })));
const Pie = lazy(() => import('recharts').then(module => ({ default: module.Pie })));
const Cell = lazy(() => import('recharts').then(module => ({ default: module.Cell })));
const LabelList = lazy(() => import('recharts').then(module => ({ default: module.LabelList })));
const AreaChart = lazy(() => import('recharts').then(module => ({ default: module.AreaChart })));
const Area = lazy(() => import('recharts').then(module => ({ default: module.Area })));

// Componente de loading para gráficos
const ChartLoader = () => (
  <div className="flex items-center justify-center h-80">
    <div className="flex flex-col items-center space-y-2">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm text-muted-foreground">Cargando gráfico...</p>
    </div>
  </div>
);

// Wrapper para LineChart
export const LazyLineChart = ({ children, data, ...props }: any) => (
  <Suspense fallback={<ChartLoader />}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} {...props}>
        {children}
      </LineChart>
    </ResponsiveContainer>
  </Suspense>
);

// Wrapper para BarChart
export const LazyBarChart = ({ children, data, ...props }: any) => (
  <Suspense fallback={<ChartLoader />}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} {...props}>
        {children}
      </BarChart>
    </ResponsiveContainer>
  </Suspense>
);

// Wrapper para PieChart
export const LazyPieChart = ({ children, data, ...props }: any) => (
  <Suspense fallback={<ChartLoader />}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart {...props}>
        {children}
      </PieChart>
    </ResponsiveContainer>
  </Suspense>
);

// Wrapper para AreaChart
export const LazyAreaChart = ({ children, data, ...props }: any) => (
  <Suspense fallback={<ChartLoader />}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} {...props}>
        {children}
      </AreaChart>
    </ResponsiveContainer>
  </Suspense>
);

// Exportar componentes individuales con lazy loading
export {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Pie,
  Cell,
  LabelList,
  Area
};

// Wrapper principal para cualquier gráfico
export const LazyChart = ({ type, children, ...props }: { type: 'line' | 'bar' | 'pie' | 'area'; children: React.ReactNode; [key: string]: any }) => {
  const ChartComponent = {
    line: LazyLineChart,
    bar: LazyBarChart,
    pie: LazyPieChart,
    area: LazyAreaChart
  }[type];

  return <ChartComponent {...props}>{children}</ChartComponent>;
};