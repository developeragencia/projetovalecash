import { useRef, useEffect } from "react";
import { 
  LineChart, 
  BarChart, 
  PieChart,
  Line, 
  Bar, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  TooltipProps 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Common chart props
interface BaseChartProps {
  title: string;
  height?: number;
  className?: string;
}

// Line chart
interface LineChartProps extends BaseChartProps {
  data: any[];
  lines: {
    dataKey: string;
    name: string;
    stroke?: string;
    fill?: string;
  }[];
  xAxisDataKey: string;
  grid?: boolean;
}

export function LineChartComponent({
  title,
  data,
  lines,
  xAxisDataKey,
  grid = true,
  height = 300,
  className,
}: LineChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              {grid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxisDataKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {lines.map((line, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.stroke || `hsl(var(--chart-${index + 1}))`}
                  fill={line.fill || `hsl(var(--chart-${index + 1}))`}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Bar chart
interface BarChartProps extends BaseChartProps {
  data: any[];
  bars: {
    dataKey: string;
    name: string;
    fill?: string;
  }[];
  xAxisDataKey: string;
  grid?: boolean;
  stacked?: boolean;
}

export function BarChartComponent({
  title,
  data,
  bars,
  xAxisDataKey,
  grid = true,
  stacked = false,
  height = 300,
  className,
}: BarChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              {grid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxisDataKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {bars.map((bar, index) => (
                <Bar
                  key={index}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.fill || `hsl(var(--chart-${index + 1}))`}
                  stackId={stacked ? "a" : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Pie chart
interface PieChartProps extends BaseChartProps {
  data: {
    name: string;
    value: number;
    color?: string;
  }[];
  dataKey?: string;
  nameKey?: string;
  donut?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export function PieChartComponent({
  title,
  data,
  dataKey = "value",
  nameKey = "name",
  donut = false,
  innerRadius = 0,
  outerRadius = 80,
  height = 300,
  className,
}: PieChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={outerRadius}
                innerRadius={donut ? innerRadius : 0}
                fill="#8884d8"
                dataKey={dataKey}
                nameKey={nameKey}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || `hsl(var(--chart-${(index % 5) + 1}))`} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
