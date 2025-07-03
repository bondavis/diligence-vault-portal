
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequestFilters } from './RequestFilters';
import { RequestAssignmentModal } from './RequestAssignmentModal';
import { RequestDetailModal } from './RequestDetailModal';
import { Eye, UserPlus, Clock, AlertCircle, CheckCircle, FileX, FileCheck } from 'lucide-react';

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

interface User {
  id: string;
  name: string;
  email: string;
}

export const RequestManagementTable = () => {
  const [requests, setRequests] = useState<DiligenceRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
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

      // Load all users for assignment and to match with assigned_to
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name');

      if (usersError) throw usersError;

      // Create a map of users for quick lookup
      const userMap = new Map(usersData?.map(user => [user.id, user]) || []);

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
            assignedUser: request.assigned_to ? userMap.get(request.assigned_to) : undefined,
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
      setUsers(usersData || []);
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

  const formatPeriod = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return 'No period set';
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && end) {
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
    
    if (start) return start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (end) return `Until ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    
    return 'Period not set';
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{requests.length}</div>
          <div className="text-sm text-blue-600">Total Requests</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">
            {requests.filter(r => !r.assigned_to).length}
          </div>
          <div className="text-sm text-amber-600">Unassigned</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.computed_status === 'Accepted').length}
          </div>
          <div className="text-sm text-green-600">Accepted</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.due_date && new Date(r.due_date) < new Date()).length}
          </div>
          <div className="text-sm text-red-600">Overdue</div>
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
              <TableHead>Assignment</TableHead>
              <TableHead>Actions</TableHead>
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
                  <div className="text-sm">
                    {formatPeriod(request.period_start, request.period_end)}
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
                <TableCell>
                  {request.assignedUser ? (
                    <div className="text-sm">
                      <div className="font-medium">{request.assignedUser.name}</div>
                      <div className="text-gray-500">{request.assignedUser.email}</div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-amber-600">
                      Unassigned
                    </Badge>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRequestId(request.id);
                        setDetailModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRequestId(request.id);
                        setAssignmentModalOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
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

      {/* Modals */}
      <RequestAssignmentModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        requestId={selectedRequestId}
        users={users}
        onAssignmentComplete={() => {
          setAssignmentModalOpen(false);
          loadData();
        }}
      />

      <RequestDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        requestId={selectedRequestId}
        onRequestUpdate={loadData}
      />
    </div>
  );
};
