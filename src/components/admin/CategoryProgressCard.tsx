
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  inProgress: number;
  incomplete: number;
}

interface CategoryProgressCardProps {
  stats: CategoryStats;
  onClick: (category: string) => void;
  isSelected: boolean;
}

export const CategoryProgressCard = ({ stats, onClick, isSelected }: CategoryProgressCardProps) => {
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const progressPercentage = stats.total > 0 ? Math.round(((stats.completed + stats.inProgress) / stats.total) * 100) : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Financial': return '💰';
      case 'Legal': return '⚖️';
      case 'Operations': return '🔧';
      case 'HR': return '👥';
      case 'IT': return '💻';
      case 'Environmental': return '🌱';
      case 'Commercial': return '📈';
      default: return '📋';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Financial': return 'border-l-green-500';
      case 'Legal': return 'border-l-blue-500';
      case 'Operations': return 'border-l-orange-500';
      case 'HR': return 'border-l-purple-500';
      case 'IT': return 'border-l-cyan-500';
      case 'Environmental': return 'border-l-emerald-500';
      case 'Commercial': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${getCategoryColor(stats.category)} ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => onClick(stats.category)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getCategoryIcon(stats.category)}</span>
            <span>{stats.category}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats.total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{completionPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2">
          <div 
            className="bg-green-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </Progress>
        <div className="flex justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{stats.completed} Done</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{stats.inProgress} In Progress</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>{stats.incomplete} Pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
