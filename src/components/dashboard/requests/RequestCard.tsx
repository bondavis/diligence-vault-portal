import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Eye, Trash2, CheckCircle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

type RequestPriority = Database['public']['Enums']['request_priority'];

interface RequestCardProps {
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
      return <Badge className="bg-red-100 text-red-800 border-red-200 font-medium px-2 py-1">HIGH</Badge>;
    case 'medium': 
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-medium px-2 py-1">MEDIUM</Badge>;
    case 'low': 
      return <Badge className="bg-green-100 text-green-800 border-green-200 font-medium px-2 py-1">LOW</Badge>;
    default: 
      return <Badge variant="outline">{String(priority).toUpperCase()}</Badge>;
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

export const RequestCard = ({ 
  request, 
  isSelected, 
  isAdmin, 
  onSelectRequest, 
  onRequestClick, 
  onDeleteRequest 
}: RequestCardProps) => {
  const isUploaded = request.computed_status === 'Accepted';

  return (
    <div 
      className="border rounded-lg p-6 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
      onClick={() => onRequestClick(request)}
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
          
          <div className="flex-1">
            {/* Header with title and badges */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg text-gray-900 flex-1 mr-4">{request.title}</h3>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {getPriorityBadge(request.priority)}
                {isUploaded && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
                <Eye className="h-4 w-4 text-gray-400" />
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRequest(request.id);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Description */}
            {request.description && (
              <p className="text-gray-600 mb-4 leading-relaxed">{request.description}</p>
            )}
            
            {/* Bottom section with category and upload button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getCategoryBadge(request.category)}
              </div>
              
              {!isUploaded && (
                <Button 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestClick(request);
                  }}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
