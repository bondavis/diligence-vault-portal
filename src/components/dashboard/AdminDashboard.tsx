
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { User } from '@/pages/Index';
import { UserManagement } from '@/components/users/UserManagement';
import { DealsOverview } from '@/components/deals/DealsOverview';
import { DiligenceRequestUpload } from '@/components/upload/DiligenceRequestUpload';
import { RequestManagementTable } from '@/components/admin/RequestManagementTable';
import { CategoryProgressCard } from '@/components/admin/CategoryProgressCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminDashboardProps {
  user: User;
}

interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  inProgress: number;
  incomplete: number;
}

interface DashboardStats {
  totalRequests: number;
  unassigned: number;
  accepted: number;
  overdue: number;
  categories: CategoryStats[];
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    unassigned: 0,
    accepted: 0,
    overdue: 0,
    categories: []
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const computeRequestStatus = (request: any) => {
    const hasDocuments = (request.document_count || 0) > 0;
    const hasResponse = request.has_response;
    
    if (request.status === 'approved') return 'Accepted';
    if (hasDocuments || hasResponse) return 'Review Pending';
    return 'Incomplete';
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Load all requests with document counts and response status
      const { data: requestsData, error: requestsError } = await supabase
        .from('diligence_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get document counts and response status for each request
      const requestsWithStatus = await Promise.all(
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

      // Calculate overall stats
      const totalRequests = requestsWithStatus.length;
      const unassigned = requestsWithStatus.filter(r => !r.assigned_to).length;
      const accepted = requestsWithStatus.filter(r => r.computed_status === 'Accepted').length;
      const overdue = requestsWithStatus.filter(r => 
        r.due_date && new Date(r.due_date) < new Date()
      ).length;

      // Calculate category stats
      const categoryMap = new Map<string, CategoryStats>();
      
      requestsWithStatus.forEach(request => {
        const category = request.category;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            total: 0,
            completed: 0,
            inProgress: 0,
            incomplete: 0
          });
        }
        
        const categoryStats = categoryMap.get(category)!;
        categoryStats.total++;
        
        switch (request.computed_status) {
          case 'Accepted':
            categoryStats.completed++;
            break;
          case 'Review Pending':
            categoryStats.inProgress++;
            break;
          case 'Incomplete':
            categoryStats.incomplete++;
            break;
        }
      });

      const categories = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);

      setStats({
        totalRequests,
        unassigned,
        accepted,
        overdue,
        categories
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const overallProgress = stats.totalRequests > 0 
    ? Math.round((stats.accepted / stats.totalRequests) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Big Brand Tire Admin Header */}
      <Card className="bg-gradient-to-r from-bb-red to-red-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription className="text-red-100">
                Manage users, deals, and diligence requests
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{overallProgress}%</div>
              <div className="text-sm text-red-100">Complete</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-bb-red">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-bb-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bb-dark-gray">{stats.totalRequests}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Unassigned</CardTitle>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.unassigned}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Accepted</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Progress Cards */}
      {stats.categories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Category Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stats.categories.map((categoryStats) => (
              <CategoryProgressCard
                key={categoryStats.category}
                stats={categoryStats}
                onClick={handleCategoryClick}
                isSelected={selectedCategory === categoryStats.category}
              />
            ))}
          </div>
        </div>
      )}

      {/* Management Tabs */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests">Request Management</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Diligence Request Management</CardTitle>
              <CardDescription>
                Manage and track all diligence requests across deals
                {selectedCategory && (
                  <Badge variant="outline" className="ml-2">
                    Filtered by: {selectedCategory}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequestManagementTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="deals">
          <DealsOverview />
        </TabsContent>

        <TabsContent value="upload">
          <DiligenceRequestUpload onUploadComplete={() => {
            console.log('Upload completed - refreshing dashboard stats');
            loadDashboardStats();
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
