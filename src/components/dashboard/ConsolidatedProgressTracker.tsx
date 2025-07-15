import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Calendar, Clock, Users, ChevronDown, ChevronUp, FileText, Scale, Building, UserCheck, Briefcase } from 'lucide-react';
import { UserAssignmentModal } from '@/components/deals/UserAssignmentModal';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Deal {
  id: string;
  name: string;
  company_name: string;
  project_name: string;
  target_close_date: string | null;
  created_at: string;
}

interface CategoryProgress {
  category: string;
  total: number;
  completed: number;
  percentage: number;
}

interface ConsolidatedProgressTrackerProps {
  deal: Deal;
  overallCompletionPercentage: number;
  categoryProgress: CategoryProgress[];
  onBack: () => void;
  onCategoryClick: (category: string) => void;
}

const timelineStages = [
  {
    id: 1,
    title: "LOI Signed",
    description: "The LOI lays out the key terms of the deal. After signing the LOI, Big Brand can start diligence on your business and draft the purchase agreement",
    icon: FileText,
    color: "text-blue-600"
  },
  {
    id: 2,
    title: "Complete Diligence",
    description: "We will conduct accounting, tax, environmental, legal, and operational due diligence within ~3-4 weeks after signing the LOI. This process is highly dependent on the Seller's ability to provide information in a timely fashion. To sign the APA, we must first complete our diligence",
    icon: Scale,
    color: "text-purple-600"
  },
  {
    id: 3,
    title: "APA Signed",
    description: "Once diligence is complete and the final form of the APA is agreed upon, we will proceed to signing the formal transaction purchase document",
    icon: FileText,
    color: "text-green-600"
  },
  {
    id: 4,
    title: "Announcement",
    description: "After signing the APA, the seller and the Big Brand team will announce the deal to the employees. Shortly after the announcement, we have 1-on-1 conversations with each employee to address questions",
    icon: UserCheck,
    color: "text-orange-600"
  },
  {
    id: 5,
    title: "Closing",
    description: "Closing represents the day that the transaction is officially completed with an exchange of final legal documentation. Funds are processed the day of or the day immediately following Closing",
    icon: Briefcase,
    color: "text-emerald-600"
  }
];

const categoryIcons = {
  'Financial': { icon: '💰', color: 'bg-green-100 text-green-700 border-green-200' },
  'Legal': { icon: '⚖️', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Operations': { icon: '⚙️', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  'HR': { icon: '👥', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  'IT': { icon: '💻', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  'Environmental': { icon: '🌱', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'Commercial': { icon: '📊', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  'Other': { icon: '📋', color: 'bg-gray-100 text-gray-700 border-gray-200' }
};

export const ConsolidatedProgressTracker = ({ 
  deal, 
  overallCompletionPercentage, 
  categoryProgress, 
  onBack,
  onCategoryClick
}: ConsolidatedProgressTrackerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentStage = 2; // Stage 2 - Complete Diligence
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysRemaining = () => {
    if (!deal.target_close_date) return null;
    const today = new Date();
    const targetDate = new Date(deal.target_close_date);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();
  const totalItems = categoryProgress.reduce((sum, cat) => sum + cat.total, 0);
  const completedItems = categoryProgress.reduce((sum, cat) => sum + cat.completed, 0);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deals
            </Button>
            <UserAssignmentModal 
              dealId={deal.id} 
              dealName={deal.name}
              trigger={
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              }
            />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{deal.name}</h1>
            <p className="text-muted-foreground mt-1">
              {deal.company_name} - {deal.project_name}
            </p>
            <div className="flex items-center space-x-4 mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                Stage {currentStage} of {timelineStages.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {timelineStages[currentStage - 1]?.title}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold text-primary">{overallCompletionPercentage}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
            <div className="text-xs text-muted-foreground mt-1">
              {completedItems} of {totalItems} items
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Compact Timeline */}
        <div className="mb-6">
          <TooltipProvider>
            <div className="relative">
              {/* Progress line */}
              <div className="absolute top-6 left-6 right-6 h-1 bg-border rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStage - 1) / (timelineStages.length - 1)) * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between relative z-10">
                {timelineStages.map((stage, index) => {
                  const isCompleted = stage.id < currentStage;
                  const isCurrent = stage.id === currentStage;
                  const Icon = stage.icon;
                  
                  return (
                    <Tooltip key={stage.id}>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center cursor-help">
                          <div 
                            className={cn(
                              "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-background",
                              isCompleted 
                                ? "border-primary bg-primary text-primary-foreground shadow-lg" 
                                : isCurrent 
                                ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg" 
                                : "border-border text-muted-foreground hover:border-primary/50"
                            )}
                          >
                            {isCompleted ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="text-center mt-3 max-w-20">
                            <div className={cn(
                              "text-xs font-medium",
                              isCurrent ? "text-primary" : "text-foreground"
                            )}>
                              {stage.title}
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm">{stage.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </TooltipProvider>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-3 p-4 bg-accent/50 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-medium">Current Stage</div>
              <div className="text-sm text-muted-foreground">
                {timelineStages[currentStage - 1]?.title}
              </div>
            </div>
          </div>
          
          {deal.target_close_date && (
            <div className="flex items-center space-x-3 p-4 bg-accent/50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">Target Close</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(deal.target_close_date)}
                </div>
              </div>
            </div>
          )}
          
          {daysRemaining !== null && (
            <div className="flex items-center space-x-3 p-4 bg-accent/50 rounded-lg">
              <Calendar className={cn(
                "h-5 w-5",
                daysRemaining < 30 ? "text-destructive" : 
                daysRemaining < 60 ? "text-yellow-600" : 
                "text-green-600"
              )} />
              <div>
                <div className="text-sm font-medium">Days Remaining</div>
                <div className={cn(
                  "text-sm font-medium",
                  daysRemaining < 30 ? "text-destructive" : 
                  daysRemaining < 60 ? "text-yellow-600" : 
                  "text-green-600"
                )}>
                  {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Progress - Always visible with compact design */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Progress by Category</h3>
          <div className={cn(
            "grid gap-3 transition-all duration-300",
            isExpanded ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          )}>
            {categoryProgress.map((category) => {
              const categoryStyle = categoryIcons[category.category as keyof typeof categoryIcons] || categoryIcons['Other'];
              
              return (
                <button
                  key={category.category}
                  onClick={() => onCategoryClick(category.category)}
                  className={cn(
                    "w-full p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer text-left",
                    categoryStyle.color,
                    "hover:ring-2 hover:ring-primary/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{categoryStyle.icon}</span>
                      <span className="font-medium text-sm">{category.category}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {category.percentage}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {category.completed} / {category.total} items
                      </span>
                    </div>
                    <div className="w-full bg-background/60 rounded-full h-2">
                      <div 
                        className="h-2 bg-current rounded-full transition-all duration-300"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 opacity-75">
                      Click to filter pending items
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t space-y-4">
            <h4 className="text-md font-semibold text-foreground">Detailed Timeline</h4>
            <div className="space-y-3">
              {timelineStages.map((stage) => {
                const isCompleted = stage.id < currentStage;
                const isCurrent = stage.id === currentStage;
                const Icon = stage.icon;
                
                return (
                  <div 
                    key={stage.id}
                    className={cn(
                      "flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200",
                      isCurrent ? "border-primary bg-primary/5" : 
                      isCompleted ? "border-green-200 bg-green-50 dark:bg-green-950/20" : 
                      "border-border bg-muted/30"
                    )}
                  >
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        isCompleted ? "border-green-500 bg-green-500 text-white" :
                        isCurrent ? "border-primary bg-primary text-primary-foreground" :
                        "border-border bg-background text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className={cn(
                          "font-medium",
                          isCurrent ? "text-primary" : "text-foreground"
                        )}>
                          {stage.title}
                        </h5>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          isCompleted ? "bg-green-100 text-green-700" :
                          isCurrent ? "bg-primary/10 text-primary" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {isCompleted ? "Complete" : isCurrent ? "In Progress" : "Upcoming"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};