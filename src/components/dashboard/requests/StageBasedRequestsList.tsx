import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Lock, Users, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EnhancedRequestCard } from './EnhancedRequestCard';
import { RequestCard } from './RequestCard';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

type DiligenceStage = Database['public']['Tables']['diligence_stages']['Row'];

interface StageBasedRequestsListProps {
  requests: DiligenceRequest[];
  filteredRequests: DiligenceRequest[];
  loading: boolean;
  onRequestClick: (request: DiligenceRequest) => void;
  onRequestsUpdated: () => void;
  onDeleteRequest: (requestId: string) => void;
  isAdmin?: boolean;
  selectedRequests: string[];
  onSelectRequest: (requestId: string, checked: boolean) => void;
  viewMode?: 'grid' | 'list';
}

export const StageBasedRequestsList = ({
  requests,
  filteredRequests,
  loading,
  onRequestClick,
  onRequestsUpdated,
  onDeleteRequest,
  isAdmin = false,
  selectedRequests,
  onSelectRequest,
  viewMode = 'grid'
}: StageBasedRequestsListProps) => {
  const [stages, setStages] = useState<DiligenceStage[]>([]);
  const [openStages, setOpenStages] = useState<Record<string, boolean>>({});
  const [stageProgress, setStageProgress] = useState<Record<string, { completed: number; total: number; percentage: number }>>({});

  useEffect(() => {
    loadStages();
  }, []);

  useEffect(() => {
    if (stages.length > 0 && filteredRequests.length > 0) {
      calculateStageProgress();
      // Auto-open stages with active requests
      const activeStages: Record<string, boolean> = {};
      stages.forEach(stage => {
        const stageRequests = getRequestsForStage(stage.id);
        if (stageRequests.length > 0) {
          activeStages[stage.id] = true;
        }
      });
      setOpenStages(activeStages);
    }
  }, [stages, filteredRequests]);

  const loadStages = async () => {
    try {
      const { data, error } = await supabase
        .from('diligence_stages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error loading stages:', error);
    }
  };

  const getRequestsForStage = (stageId: string) => {
    return filteredRequests.filter(request => request.stage_id === stageId);
  };

  const getUnstagedRequests = () => {
    return filteredRequests.filter(request => !request.stage_id);
  };

  const calculateStageProgress = () => {
    const progress: Record<string, { completed: number; total: number; percentage: number }> = {};
    
    stages.forEach(stage => {
      const stageRequests = getRequestsForStage(stage.id);
      const completed = stageRequests.filter(request => 
        request.computed_status === 'completed' || 
        request.status === 'approved'
      ).length;
      const total = stageRequests.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      progress[stage.id] = { completed, total, percentage };
    });
    
    setStageProgress(progress);
  };

  const isStageUnlocked = (stage: DiligenceStage, stageIndex: number) => {
    if (stageIndex === 0) return true; // First stage is always unlocked
    
    const previousStage = stages[stageIndex - 1];
    if (!previousStage) return true;
    
    const previousProgress = stageProgress[previousStage.id];
    if (!previousProgress) return true;
    
    return previousProgress.percentage >= (previousStage.completion_threshold || 80);
  };

  const toggleStage = (stageId: string) => {
    setOpenStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  const getStageIcon = (stage: DiligenceStage, stageIndex: number) => {
    const progress = stageProgress[stage.id];
    const unlocked = isStageUnlocked(stage, stageIndex);
    
    if (!unlocked) {
      return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
    
    if (progress && progress.percentage === 100) {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    
    if (progress && progress.total > 0 && progress.completed > 0) {
      return <Clock className="h-4 w-4 text-warning" />;
    }
    
    return <Users className="h-4 w-4 text-muted-foreground" />;
  };

  const renderStageRequests = (stageRequests: DiligenceRequest[]) => {
    if (stageRequests.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No requests in this stage
        </div>
      );
    }

    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-3'}>
        {stageRequests.map((request) =>
          viewMode === 'grid' ? (
            <EnhancedRequestCard
              key={request.id}
              request={request}
              isSelected={selectedRequests.includes(request.id)}
              isAdmin={isAdmin}
              onSelectRequest={onSelectRequest}
              onRequestClick={onRequestClick}
              onDeleteRequest={onDeleteRequest}
            />
          ) : (
            <RequestCard
              key={request.id}
              request={request}
              isSelected={selectedRequests.includes(request.id)}
              isAdmin={isAdmin}
              onSelectRequest={onSelectRequest}
              onRequestClick={onRequestClick}
              onDeleteRequest={onDeleteRequest}
            />
          )
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading stages...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stage Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">Due Diligence Progress</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stages.map((stage, index) => {
              const progress = stageProgress[stage.id] || { completed: 0, total: 0, percentage: 0 };
              const unlocked = isStageUnlocked(stage, index);
              
              return (
                <div key={stage.id} className={`text-center p-4 rounded-lg border ${unlocked ? 'bg-background' : 'bg-muted/50'}`}>
                  <div className="flex items-center justify-center mb-2">
                    {getStageIcon(stage, index)}
                  </div>
                  <div className="text-sm font-medium mb-1">{stage.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {progress.completed}/{progress.total} complete
                  </div>
                  <Progress value={progress.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {progress.percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage-based Request Lists */}
      {stages.map((stage, index) => {
        const stageRequests = getRequestsForStage(stage.id);
        const progress = stageProgress[stage.id] || { completed: 0, total: 0, percentage: 0 };
        const unlocked = isStageUnlocked(stage, index);
        const isOpen = openStages[stage.id];

        return (
          <Card key={stage.id} className={!unlocked ? 'opacity-60' : ''}>
            <Collapsible open={isOpen} onOpenChange={() => toggleStage(stage.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {getStageIcon(stage, index)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{stage.name}</h3>
                          {!unlocked && (
                            <Badge variant="secondary">
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {progress.completed}/{progress.total} requests
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {progress.percentage}% complete
                        </div>
                      </div>
                      <div className="w-24">
                        <Progress value={progress.percentage} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {renderStageRequests(stageRequests)}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Unstaged Requests */}
      {getUnstagedRequests().length > 0 && (
        <Card>
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ChevronDown className="h-4 w-4" />
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">Unassigned Requests</h3>
                      <p className="text-sm text-muted-foreground">
                        Requests not yet assigned to a stage
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {getUnstagedRequests().length} requests
                  </Badge>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                {renderStageRequests(getUnstagedRequests())}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
};