'use client';

import { ReactNode } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LabelList,
  AreaChart,
  Area
} from 'recharts';

// Interfaces para los datos de los gráficos
interface ChartDataPoint {
  [key: string]: string | number;
}

// Props base para todos los gráficos
interface BaseChartProps {
  children?: ReactNode;
  data?: ChartDataPoint[];
  // Notas: width/height se manejan por ResponsiveContainer
  width?: number | string;
  height?: number | string;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

// Props específicos para LineChart
interface LineChartProps extends Omit<BaseChartProps, 'width' | 'height'> {
  syncId?: string;
}

// Props específicos para BarChart
interface BarChartProps extends Omit<BaseChartProps, 'width' | 'height'> {
  layout?: 'horizontal' | 'vertical';
  stackOffset?: 'expand' | 'none' | 'wiggle' | 'silhouette';
}

// Props específicos para PieChart
interface PieChartProps extends Omit<BaseChartProps, 'data' | 'width' | 'height'> {
  data?: ChartDataPoint[];
}

// Props específicos para AreaChart
interface AreaChartProps extends Omit<BaseChartProps, 'width' | 'height'> {
  stackOffset?: 'expand' | 'none' | 'wiggle' | 'silhouette';
}

// Nota: Importamos directamente los componentes de recharts para evitar problemas de Suspense/lazy
// en algunos entornos de desarrollo. Este módulo está marcado como "use client",
// por lo que todo se renderiza en el cliente.

// Wrapper para LineChart
export const LazyLineChart = ({ children, data, ...props }: LineChartProps) => {
  const anyProps: any = props;
  const { width: _w, height: _h, ...rest } = anyProps;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} {...(rest as any)}>
        {children}
      </LineChart>
    </ResponsiveContainer>
  );
};

// Wrapper para BarChart
export const LazyBarChart = ({ children, data, ...props }: BarChartProps) => {
  const anyProps: any = props;
  const { width: _w, height: _h, ...rest } = anyProps;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} {...(rest as any)}>
        {children}
      </BarChart>
    </ResponsiveContainer>
  );
};

// Wrapper para PieChart
export const LazyPieChart = ({ children, data, ...props }: PieChartProps) => {
  const anyProps: any = props;
  const { width: _w, height: _h, ...rest } = anyProps;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart {...(rest as any)}>
        {children}
      </PieChart>
    </ResponsiveContainer>
  );
};

// Wrapper para AreaChart
export const LazyAreaChart = ({ children, data, ...props }: AreaChartProps) => {
  const anyProps: any = props;
  const { width: _w, height: _h, ...rest } = anyProps;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} {...(rest as any)}>
        {children}
      </AreaChart>
    </ResponsiveContainer>
  );
};

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

// Interface para el wrapper principal
interface LazyChartProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  children: ReactNode;
  data?: ChartDataPoint[];
  [key: string]: unknown;
}

// Wrapper principal para cualquier gráfico
export const LazyChart = ({ type, children, ...props }: LazyChartProps) => {
  const ChartComponent = {
    line: LazyLineChart,
    bar: LazyBarChart,
    pie: LazyPieChart,
    area: LazyAreaChart
  }[type];

  return <ChartComponent {...props}>{children}</ChartComponent>;
};