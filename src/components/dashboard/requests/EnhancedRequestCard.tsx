import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, Eye, Trash2, CheckCircle, Clock, AlertTriangle, Calendar, Info } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { useState } from 'react';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

type RequestPriority = Database['public']['Enums']['request_priority'];

interface EnhancedRequestCardProps {
  request: DiligenceRequest;
  isSelected: boolean;
  isAdmin: boolean;
  onSelectRequest: (requestId: string, checked: boolean) => void;
  onRequestClick: (request: DiligenceRequest) => void;
  onDeleteRequest: (requestId: string) => void;
}

const getPriorityBadge = (priority: RequestPriority) => {
  switch (priority) {
    case 'high': 
      return <Badge className="bg-red-500 text-white border-red-500 font-medium px-2 py-1">HIGH</Badge>;
    case 'medium': 
      return <Badge className="bg-amber-500 text-white border-amber-500 font-medium px-2 py-1">MEDIUM</Badge>;
    case 'low': 
      return <Badge className="bg-green-500 text-white border-green-500 font-medium px-2 py-1">LOW</Badge>;
    default: 
      return <Badge variant="outline">{String(priority).toUpperCase()}</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Accepted':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 font-medium px-3 py-1">
          <CheckCircle className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      );
    case 'Review Pending':
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium px-3 py-1">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    case 'Incomplete':
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 font-medium px-3 py-1">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="font-medium px-3 py-1">
          {status}
        </Badge>
      );
  }
};

const getCategoryBadge = (category: string) => {
  const categoryColors: Record<string, string> = {
    'Financial': 'bg-blue-100 text-blue-700 border-blue-200',
    'Legal': 'bg-purple-100 text-purple-700 border-purple-200',
    'Operations': 'bg-orange-100 text-orange-700 border-orange-200',
    'HR': 'bg-pink-100 text-pink-700 border-pink-200',
    'IT': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Environmental': 'bg-green-100 text-green-700 border-green-200',
    'Commercial': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Other': 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <Badge className={`${categoryColors[category] || categoryColors['Other']} font-medium px-2 py-1`}>
      {category}
    </Badge>
  );
};

const formatPeriod = (request: DiligenceRequest) => {
  // Priority: period_text > parsed description > period_start/end > default
  if (request.period_text) {
    return request.period_text;
  }

  // Try to extract from description
  if (request.description) {
    const desc = request.description.toLowerCase();
    if (desc.includes('fy23') && desc.includes('fy24') && desc.includes('ytd25')) return 'FY23, FY24, YTD25';
    if (desc.includes('last two years')) return 'Last 2 Years';
    if (desc.includes('thirteen months')) return '13 Months';
    if (desc.includes('monthly')) return 'Monthly';
    if (desc.includes('quarterly')) return 'Quarterly';
    if (desc.includes('current year')) return 'Current Year';
  }

  // Fallback to date range
  if (request.period_start && request.period_end) {
    const start = new Date(request.period_start);
    const end = new Date(request.period_end);
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    
    if (startYear === endYear) {
      return `${startMonth} - ${endMonth} ${startYear}`;
    } else {
      return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
    }
  }
  
  return 'Period TBD';
};

const calculateProgress = (request: DiligenceRequest) => {
  const hasDocuments = (request.document_count || 0) > 0;
  const hasResponse = request.has_response;
  
  if (request.computed_status === 'Accepted') return 100;
  if (hasDocuments && hasResponse) return 80;
  if (hasDocuments || hasResponse) return 50;
  return 0;
};

const getDaysRemaining = (dueDate: string | null) => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const EnhancedRequestCard = ({ 
  request, 
  isSelected, 
  isAdmin, 
  onSelectRequest, 
  onRequestClick, 
  onDeleteRequest 
}: EnhancedRequestCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isCompleted = request.computed_status === 'Accepted';
  const progress = calculateProgress(request);
  const daysRemaining = getDaysRemaining(request.due_date);
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const period = formatPeriod(request);

  return (
    <TooltipProvider>
      <div 
        className={`border rounded-xl p-6 transition-all duration-200 bg-white cursor-pointer transform hover:shadow-lg hover:-translate-y-1 ${
          isCompleted ? 'ring-2 ring-green-200 bg-green-50/30' : ''
        } ${isOverdue ? 'ring-2 ring-red-200 bg-red-50/30' : ''}`}
        onClick={() => onRequestClick(request)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {isAdmin && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectRequest(request.id, checked as boolean)}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            <div className="flex-1 space-y-4">
              {/* Header with title and period */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg text-gray-900 flex-1 mr-4">{request.title}</h3>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {getPriorityBadge(request.priority)}
                    {isAdmin && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRequest(request.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete request</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Period Badge - Only show if period is defined */}
                {period !== 'Period TBD' && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <Badge variant="outline" className="font-medium text-blue-700 border-blue-200 bg-blue-50">
                      {period}
                    </Badge>
                    {daysRemaining !== null && (
                      <Badge 
                        variant="outline" 
                        className={`font-medium ${
                          isOverdue ? 'text-red-700 border-red-200 bg-red-50' : 
                          daysRemaining <= 7 ? 'text-amber-700 border-amber-200 bg-amber-50' :
                          'text-gray-700 border-gray-200 bg-gray-50'
                        }`}
                      >
                        {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : 
                         daysRemaining === 0 ? 'Due today' :
                         `${daysRemaining} days remaining`}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              {/* Description - Truncated with hover tooltip */}
              {request.description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-gray-600 leading-relaxed line-clamp-2 cursor-help">
                      {request.description}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm p-3">
                    <p className="text-sm whitespace-pre-wrap">{request.description}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {/* Bottom section with category, status, and actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryBadge(request.category)}
                  {getStatusBadge(request.computed_status || 'Incomplete')}
                </div>
                
                <div className="flex items-center space-x-2">
                  {(request.document_count || 0) > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs">
                          {request.document_count} file{(request.document_count || 0) !== 1 ? 's' : ''}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Documents uploaded</TooltipContent>
                    </Tooltip>
                  )}
                  
                  {!isCompleted && (
                    <Button 
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestClick(request);
                      }}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {isHovered ? 'Upload & Respond' : 'Upload'}
                    </Button>
                  )}

                  {isCompleted && (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-200 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestClick(request);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};