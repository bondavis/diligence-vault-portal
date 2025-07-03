import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Calendar, AlertCircle, FileText, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RequestDetailModal } from './RequestDetailModal';
import { useToast } from '@/hooks/use-toast';

interface DiligenceRequest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  due_date: string | null;
  period_text: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  assigned_to: string | null;
  document_count?: number;
  has_response?: boolean;
}

export const RequestManagementTable = () => {
  const [requests, setRequests] = useState<DiligenceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<DiligenceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diligence_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get document counts and response status for each request
      const requestsWithCounts = await Promise.all(
        (data || []).map(async (request) => {
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

          return {
            ...request,
            document_count: docCount || 0,
            has_response: !!responseData
          };
        })
      );

      console.log('Loaded requests with period data:', requestsWithCounts.map(r => ({
        id: r.id,
        title: r.title,
        period_text: r.period_text,
        period_start: r.period_start,
        period_end: r.period_end,
        description: r.description?.substring(0, 100)
      })));

      setRequests(requestsWithCounts);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: "Error",
        description: "Failed to load diligence requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (!searchTerm) {
      setFilteredRequests(requests);
      return;
    }

    const filtered = requests.filter(request =>
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.description && request.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredRequests(filtered);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPeriod = (request: DiligenceRequest) => {
    // Priority order: period_text > formatted date range > extracted from description > fallback
    if (request.period_text) {
      return request.period_text;
    }
    
    if (request.period_start && request.period_end) {
      const start = new Date(request.period_start).toLocaleDateString();
      const end = new Date(request.period_end).toLocaleDateString();
      return `${start} - ${end}`;
    }
    
    if (request.period_start) {
      return `From ${new Date(request.period_start).toLocaleDateString()}`;
    }
    
    if (request.period_end) {
      return `Until ${new Date(request.period_end).toLocaleDateString()}`;
    }

    // Try to extract period from description as fallback
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
    
    return 'No period specified';
  };

  const getRequestStatus = (request: DiligenceRequest) => {
    const hasDocuments = (request.document_count || 0) > 0;
    const hasResponse = request.has_response;
    
    if (request.status === 'approved') return { label: 'Accepted', color: 'bg-green-100 text-green-800' };
    if (hasDocuments || hasResponse) return { label: 'Review Pending', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Incomplete', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading requests...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Diligence Requests</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const status = getRequestStatus(request);
                  const isOverdue = request.due_date && new Date(request.due_date) < new Date();
                  
                  return (
                    <TableRow 
                      key={request.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedRequestId(request.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>{request.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatPeriod(request)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {request.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            {request.due_date 
                              ? new Date(request.due_date).toLocaleDateString()
                              : 'No due date'
                            }
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No diligence requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedRequestId && (
        <RequestDetailModal
          requestId={selectedRequestId}
          open={!!selectedRequestId}
          onOpenChange={(open) => !open && setSelectedRequestId(null)}
          onRequestUpdate={loadRequests}
        />
      )}
    </>
  );
};
