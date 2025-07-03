
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  inProgress: number;
  incomplete: number;
}

interface CategoryProgressChartProps {
  categories: CategoryStats[];
  onCategoryClick: (category: string) => void;
  selectedCategory: string | null;
}

const CATEGORY_COLORS = {
  'Financial': '#10b981',
  'Legal': '#3b82f6', 
  'Operations': '#f97316',
  'HR': '#8b5cf6',
  'IT': '#06b6d4',
  'Environmental': '#059669',
  'Commercial': '#ef4444',
  'Other': '#6b7280'
};

export const CategoryProgressChart = ({ 
  categories, 
  onCategoryClick, 
  selectedCategory 
}: CategoryProgressChartProps) => {
  
  const chartData = categories.map(cat => ({
    name: cat.category,
    value: cat.total,
    completed: cat.completed,
    inProgress: cat.inProgress,
    incomplete: cat.incomplete,
    completionRate: cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0,
    fill: CATEGORY_COLORS[cat.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Other
  }));

  const chartConfig = categories.reduce((config, cat) => {
    config[cat.category] = {
      label: cat.category,
      color: CATEGORY_COLORS[cat.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Other
    };
    return config;
  }, {} as any);

  const handlePieClick = (data: any) => {
    onCategoryClick(data.name);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">Total: {data.value}</p>
          <p className="text-sm text-green-600">Completed: {data.completed}</p>
          <p className="text-sm text-blue-600">In Progress: {data.inProgress}</p>
          <p className="text-sm text-gray-500">Incomplete: {data.incomplete}</p>
          <p className="text-sm font-medium">Completion: {data.completionRate}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const data = chartData.find(d => d.name === entry.value);
          const isSelected = selectedCategory === entry.value;
          return (
            <div 
              key={index}
              className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-all ${
                isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
              }`}
              onClick={() => onCategoryClick(entry.value)}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <div className="text-sm">
                <div className="font-medium">{entry.value}</div>
                <div className="text-gray-500">
                  {data?.completionRate}% complete ({data?.value} total)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Progress Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, completionRate }) => `${name}: ${completionRate}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                onClick={handlePieClick}
                className="cursor-pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    stroke={selectedCategory === entry.name ? '#1f2937' : 'none'}
                    strokeWidth={selectedCategory === entry.name ? 3 : 0}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
