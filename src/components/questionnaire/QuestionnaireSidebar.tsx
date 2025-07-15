import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, HelpCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionGroup {
  id: string;
  title: string;
  questions: any[];
  isCompleted: boolean;
  description?: string;
  estimatedTime?: number;
  icon?: string;
}

interface QuestionnaireSidebarProps {
  groups: QuestionGroup[];
  currentGroupIndex: number;
  onGroupClick: (index: number) => void;
  overallProgress: number;
  completedGroups: number;
  totalGroups: number;
}

export const QuestionnaireSidebar = ({
  groups,
  currentGroupIndex,
  onGroupClick,
  overallProgress,
  completedGroups,
  totalGroups
}: QuestionnaireSidebarProps) => {
  return (
    <div className="w-80 border-r bg-muted/30 p-6 min-h-screen">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Progress Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{completedGroups} of {totalGroups} sections</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          {groups.map((group, index) => (
            <div
              key={group.id}
              className={cn(
                "relative flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm",
                currentGroupIndex === index 
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm" 
                  : "hover:bg-muted/50 border border-transparent",
                group.isCompleted && "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
              )}
              onClick={() => onGroupClick(index)}
            >
              <div className="flex-shrink-0 mt-1">
                {group.icon ? (
                  <div className="text-lg">{group.icon}</div>
                ) : group.isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : currentGroupIndex === index ? (
                  <Clock className="h-5 w-5 text-blue-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={cn(
                    "text-sm font-semibold truncate",
                    currentGroupIndex === index ? "text-blue-900" : "text-foreground",
                    group.isCompleted && "text-green-900"
                  )}>
                    {group.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    {group.isCompleted && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-2 py-0.5">
                        ✓ Done
                      </Badge>
                    )}
                    {currentGroupIndex === index && !group.isCompleted && (
                      <Badge variant="default" className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {group.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{group.questions.length} question{group.questions.length !== 1 ? 's' : ''}</span>
                    {group.estimatedTime && (
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>~{group.estimatedTime}m</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-900 mb-1">Need Help?</p>
              <p className="text-xs text-blue-700">
                Your progress auto-saves every 30 seconds. You can switch between sections anytime.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-900 mb-1">Pro Tip</p>
              <p className="text-xs text-amber-700">
                Have supporting documents ready. You can reference them while answering questions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};