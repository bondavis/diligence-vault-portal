
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Calendar, ChevronRight } from 'lucide-react';
import { User } from '@/pages/Index';
import { UserManagement } from '@/components/users/UserManagement';
import { DealsOverview } from '@/components/deals/DealsOverview';
import { DiligenceRequestUpload } from '@/components/upload/DiligenceRequestUpload';
import { RequestManagementTable } from '@/components/admin/RequestManagementTable';
import { CategoryProgressCard } from '@/components/admin/CategoryProgressCard';
import { TemplateManager } from '@/components/templates/TemplateManager';
import { DealDetailView } from './DealDetailView';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminDashboardProps {
  user: User;
}

interface Deal {
  id: string;
  name: string;
  company_name: string;
  project_name: string;
  target_close_date: string | null;
  created_at: string;
  request_count?: number;
  completed_count?: number;
}

interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  inProgress: number;
  incomplete: number;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDeals();
    loadCategoryStats();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      
      // Load deals with request counts
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;

      // Get request counts for each deal
      const dealsWithCounts = await Promise.all(
        (dealsData || []).map(async (deal) => {
          // Get total request count
          const { count: totalCount } = await supabase
            .from('diligence_requests')
            .select('*', { count: 'exact', head: true })
            .eq('deal_id', deal.id);

          // Get completed request count
          const { count: completedCount } = await supabase
            .from('diligence_requests')
            .select('*', { count: 'exact', head: true })
            .eq('deal_id', deal.id)
            .eq('status', 'approved');

          return {
            ...deal,
            request_count: totalCount || 0,
            completed_count: completedCount || 0
          };
        })
      );

      setDeals(dealsWithCounts);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast({
        title: "Error",
        description: "Failed to load deals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStats = async () => {
    try {
      // Load all requests with status computation
      const { data: requestsData, error: requestsError } = await supabase
        .from('diligence_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get document counts and response status for each request
      const requestsWithStatus = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { count: docCount } = await supabase
            .from('request_documents')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', request.id);

          const { data: responseData } = await supabase
            .from('diligence_responses')
            .select('id')
            .eq('request_id', request.id)
            .maybeSingle();

          const hasDocuments = (docCount || 0) > 0;
          const hasResponse = !!responseData;
          
          let computed_status = 'Incomplete';
          if (request.status === 'approved') computed_status = 'Accepted';
          else if (hasDocuments || hasResponse) computed_status = 'Review Pending';

          return {
            ...request,
            computed_status
          };
        })
      );

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

      const categoriesArray = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
      setCategories(categoriesArray);
    } catch (error) {
      console.error('Error loading category stats:', error);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  const handleBackToDeals = () => {
    setSelectedDeal(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (selectedDeal) {
    return (
      <DealDetailView 
        deal={selectedDeal} 
        onBack={handleBackToDeals}
        onRequestUpdate={loadCategoryStats}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Big Brand Tire Admin Header */}
      <Card className="bg-gradient-to-r from-bb-red to-red-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription className="text-red-100">
                Manage users, deals, templates, and diligence requests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Active Deals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Active Deals</span>
          </CardTitle>
          <CardDescription>
            Click on any deal to view diligence request progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading deals...</div>
          ) : deals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No deals found. Create your first deal in the Deals tab.
            </div>
          ) : (
            <div className="space-y-3">
              {deals.map((deal) => (
                <div 
                  key={deal.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => handleDealClick(deal)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg group-hover:text-bb-red transition-colors">
                          {deal.name}
                        </h4>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-bb-red transition-colors" />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Company:</span> {deal.company_name}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Project:</span> {deal.project_name}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created: {formatDate(deal.created_at)}</span>
                          </div>
                          {deal.target_close_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Target: {formatDate(deal.target_close_date)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {deal.completed_count || 0} / {deal.request_count || 0} Completed
                          </Badge>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Progress Cards */}
      {categories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Category Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((categoryStats) => (
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="requests">Request Management</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
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

        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="deals">
          <DealsOverview />
        </TabsContent>

        <TabsContent value="upload">
          <DiligenceRequestUpload onUploadComplete={() => {
            console.log('Upload completed - refreshing data');
            loadDeals();
            loadCategoryStats();
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
