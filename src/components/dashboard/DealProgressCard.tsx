
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CategoryProgress {
  category: string;
  total: number;
  completed: number;
  percentage: number;
}

interface DealProgressCardProps {
  categoryProgress: CategoryProgress[];
}

export const DealProgressCard = ({ categoryProgress }: DealProgressCardProps) => {
  if (categoryProgress.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress by Category</CardTitle>
        <CardDescription>
          Completion status across different request categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryProgress.map((category) => (
            <div key={category.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{category.category}</span>
                <span className="text-sm text-gray-500">
                  {category.completed} / {category.total} ({category.percentage}%)
                </span>
              </div>
              <Progress value={category.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
