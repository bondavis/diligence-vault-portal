import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionGroup {
  id: string;
  title: string;
  questions: any[];
  isCompleted: boolean;
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
        <CardContent className="space-y-2">
          {groups.map((group, index) => (
            <div
              key={group.id}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                currentGroupIndex === index 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-muted/50",
                group.isCompleted && "bg-green-50 border border-green-200"
              )}
              onClick={() => onGroupClick(index)}
            >
              <div className="flex-shrink-0">
                {group.isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : currentGroupIndex === index ? (
                  <Clock className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  currentGroupIndex === index ? "text-primary" : "text-foreground"
                )}>
                  {group.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {group.questions.length} question{group.questions.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="flex-shrink-0">
                {group.isCompleted && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    Complete
                  </Badge>
                )}
                {currentGroupIndex === index && !group.isCompleted && (
                  <Badge variant="default" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Your progress is automatically saved. You can navigate between sections and return later to complete the questionnaire.
        </p>
      </div>
    </div>
  );
};