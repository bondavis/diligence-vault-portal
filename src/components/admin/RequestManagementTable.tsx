
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RequestFilters } from './RequestFilters';
import { RequestDetailModal } from './RequestDetailModal';
import { Clock, AlertCircle, CheckCircle, FileX } from 'lucide-react';

interface DiligenceRequest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  due_date: string | null;
  period_start: string | null;
  period_end: string | null;
  period_text: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  assignedUser?: {
    name: string;
    email: string;
  };
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
}

export const RequestManagementTable = () => {
  const [requests, setRequests] = useState<DiligenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    status: 'all',
    assigned: 'all'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const computeRequestStatus = (request: DiligenceRequest) => {
    const hasDocuments = (request.document_count || 0) > 0;
    const hasResponse = request.has_response;
    
    if (request.status === 'approved') return 'Accepted';
    if (hasDocuments || hasResponse) return 'Review Pending';
    return 'Incomplete';
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load requests with document counts and response status
      const { data: requestsData, error: requestsError } = await supabase
        .from('diligence_requests')
        .select(`
          *,
          request_documents!inner(count),
          diligence_responses!inner(count)
        `)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get document counts and response status for each request
      const requestsWithCounts = await Promise.all(
        (requestsData || []).map(async (request) => {
          // Get document count
          const { count: docCount } = await supabase
            .from('request_documents')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', request.id);

          // Check if has response
          const { data: responseData } = await supabase
            .from('diligence_responses')
            .select('id')
            .eq('request_id', request.id)
            .maybeSingle();

          const enrichedRequest = {
            ...request,
            document_count: docCount || 0,
            has_response: !!responseData
          };

          return {
            ...enrichedRequest,
            computed_status: computeRequestStatus(enrichedRequest)
          };
        })
      );

      setRequests(requestsWithCounts);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchQuery === '' || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.description && request.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filters.category === 'all' || filters.category === '' || request.category === filters.category;
    const matchesPriority = filters.priority === 'all' || filters.priority === '' || request.priority === filters.priority;
    const matchesStatus = filters.status === 'all' || filters.status === '' || request.status === filters.status;
    const matchesAssigned = filters.assigned === 'all' || filters.assigned === '' || 
      (filters.assigned === 'unassigned' && !request.assigned_to) ||
      (filters.assigned === 'assigned' && request.assigned_to);

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesAssigned;
  });

  const handleRowClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setDetailModalOpen(true);
  };

  const formatPeriod = (request: DiligenceRequest) => {
    // Priority: period_text > parsed description > period_start/end > "No period set"
    if (request.period_text) {
      return request.period_text;
    }

    // Try to extract from description
    if (request.description) {
      const desc = request.description.toLowerCase();
      if (desc.includes('last two years')) return 'Last 2 Years';
      if (desc.includes('thirteen months')) return '13 Months';
      if (desc.includes('historical period')) return 'Historical Period';
      if (desc.includes('monthly')) return 'Monthly';
      if (desc.includes('quarterly')) return 'Quarterly';
      if (desc.includes('annual') || desc.includes('yearly')) return 'Annual';
      if (desc.includes('current year')) return 'Current Year';
      if (desc.includes('prior year')) return 'Prior Year';
      if (desc.includes('fiscal year')) return 'Fiscal Year';
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
    
    if (request.period_start) {
      return new Date(request.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    
    if (request.period_end) {
      return `Until ${new Date(request.period_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    
    return 'No period specified';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': 
        return <Badge className="bg-red-500 text-white hover:bg-red-600">HIGH</Badge>;
      case 'medium': 
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600">MEDIUM</Badge>;
      case 'low': 
        return <Badge className="bg-green-500 text-white hover:bg-green-600">LOW</Badge>;
      default: 
        return <Badge variant="outline">{priority.toUpperCase()}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Incomplete': return <FileX className="h-4 w-4" />;
      case 'Review Pending': return <AlertCircle className="h-4 w-4" />;
      case 'Accepted': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Incomplete': return 'bg-gray-100 text-gray-800';
      case 'Review Pending': return 'bg-blue-100 text-blue-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading requests...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <RequestFilters filters={filters} onFiltersChange={setFilters} />
        </div>
      </div>

      {/* Requests Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow 
                key={request.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleRowClick(request.id)}
              >
                <TableCell>
                  <div className="font-medium">{request.title}</div>
                  {request.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {request.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">
                    {formatPeriod(request)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{request.category}</Badge>
                </TableCell>
                <TableCell>
                  {getPriorityBadge(request.priority)}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(request.computed_status || 'pending')}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(request.computed_status || 'pending')}
                      <span>{request.computed_status}</span>
                    </div>
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No requests found matching your criteria
        </div>
      )}

      {/* Modal */}
      <RequestDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        requestId={selectedRequestId}
        onRequestUpdate={loadData}
      />
    </div>
  );
};
