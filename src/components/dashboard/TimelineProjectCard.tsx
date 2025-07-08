import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Calendar, Clock, Users } from 'lucide-react';
import { UserAssignmentModal } from '@/components/deals/UserAssignmentModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Deal {
  id: string;
  name: string;
  company_name: string;
  project_name: string;
  target_close_date: string | null;
  created_at: string;
}

interface TimelineProjectCardProps {
  deal: Deal;
  overallCompletionPercentage: number;
  onBack: () => void;
}

const timelineStages = [
  {
    id: 1,
    title: "LOI Signed",
    description: "The LOI lays out the key terms of the deal. After signing the LOI, Big Brand can start diligence on your business and draft the purchase agreement"
  },
  {
    id: 2,
    title: "Complete Diligence",
    description: "We will conduct accounting, tax, environmental, legal, and operational due diligence within ~3-4 weeks after signing the LOI. This process is highly dependent on the Seller's ability to provide information in a timely fashion. To sign the APA, we must first complete our diligence"
  },
  {
    id: 3,
    title: "APA Signed",
    description: "Once diligence is complete and the final form of the APA is agreed upon, we will proceed to signing the formal transaction purchase document"
  },
  {
    id: 4,
    title: "Announcement",
    description: "After signing the APA, the seller and the Big Brand team will announce the deal to the employees. Shortly after the announcement, we have 1-on-1 conversations with each employee to address questions"
  },
  {
    id: 5,
    title: "Closing",
    description: "Closing represents the day that the transaction is officially completed with an exchange of final legal documentation. Funds are processed the day of or the day immediately following Closing"
  },
  {
    id: 6,
    title: "Go-Live",
    description: "The store(s) will open under Big Brand ownership the day following Closing. Our integrations team will be on-site to support with the transition"
  }
];

export const TimelineProjectCard = ({ deal, overallCompletionPercentage, onBack }: TimelineProjectCardProps) => {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
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
            <div>
              <CardTitle className="text-2xl">{deal.name}</CardTitle>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-muted-foreground">
                  {deal.company_name} - {deal.project_name}
                </span>
                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  Stage {currentStage} of {timelineStages.length}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{overallCompletionPercentage}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Timeline */}
        <div className="relative">
          <TooltipProvider>
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-border z-0">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentStage - 1) / (timelineStages.length - 1)) * 100}%` }}
                />
              </div>
              
              {timelineStages.map((stage, index) => {
                const isCompleted = stage.id < currentStage;
                const isCurrent = stage.id === currentStage;
                const isFuture = stage.id > currentStage;
                
                return (
                  <Tooltip key={stage.id}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center relative z-10 cursor-help">
                        <div 
                          className={`
                            w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300
                            ${isCompleted 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : isCurrent 
                              ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20' 
                              : 'bg-background border-border text-muted-foreground'
                            }
                          `}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-medium">{stage.id}</span>
                          )}
                        </div>
                        <div className="text-center mt-2 max-w-16">
                          <div className={`text-xs font-medium ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
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
          </TooltipProvider>
        </div>

        {/* Key Info Bar */}
        <div className="bg-accent rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">Current Stage</div>
                <div className="text-sm text-muted-foreground">
                  {timelineStages[currentStage - 1]?.title} (Stage {currentStage})
                </div>
              </div>
            </div>
            
            {deal.target_close_date && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Target Close</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(deal.target_close_date)}
                  </div>
                </div>
              </div>
            )}
            
            {daysRemaining !== null && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Days Remaining</div>
                  <div className={`text-sm font-medium ${
                    daysRemaining < 30 ? 'text-destructive' : 
                    daysRemaining < 60 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};