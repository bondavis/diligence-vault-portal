
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
import { BulkOperationsPanel } from './BulkOperationsPanel';
import { Eye, UserPlus, Clock, AlertCircle, CheckCircle } from 'lucide-react';

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
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load requests first
      const { data: requestsData, error: requestsError } = await supabase
        .from('diligence_requests')
        .select('*')
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

      // Combine requests with user information
      const requestsWithUsers = requestsData?.map(request => ({
        ...request,
        assignedUser: request.assigned_to ? userMap.get(request.assigned_to) : undefined
      })) || [];

      setRequests(requestsWithUsers);
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

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRequests(
      selectedRequests.length === filteredRequests.length 
        ? [] 
        : filteredRequests.map(r => r.id)
    );
  };

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'submitted': return <AlertCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
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
        
        {selectedRequests.length > 0 && (
          <BulkOperationsPanel
            selectedRequests={selectedRequests}
            users={users}
            onOperationComplete={() => {
              setSelectedRequests([]);
              loadData();
            }}
          />
        )}
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
            {requests.filter(r => r.status === 'approved').length}
          </div>
          <div className="text-sm text-green-600">Completed</div>
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
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </TableHead>
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
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRequests.includes(request.id)}
                    onChange={() => handleSelectRequest(request.id)}
                    className="rounded"
                  />
                </TableCell>
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
                  <Badge className={getPriorityColor(request.priority)}>
                    {request.priority.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(request.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(request.status)}
                      <span className="capitalize">{request.status}</span>
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
