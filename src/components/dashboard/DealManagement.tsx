
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Calendar, ChevronRight, Plus } from 'lucide-react';
import { User } from '@/pages/Index';
import { DealDetailView } from './DealDetailView';
import { CreateDealModal } from '@/components/deals/CreateDealModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DealManagementProps {
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

export const DealManagement = ({ user }: DealManagementProps) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;

      const dealsWithCounts = await Promise.all(
        (dealsData || []).map(async (deal) => {
          const { count: totalCount } = await supabase
            .from('diligence_requests')
            .select('*', { count: 'exact', head: true })
            .eq('deal_id', deal.id);

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

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  const handleBackToDeals = () => {
    setSelectedDeal(null);
    loadDeals(); // Refresh deals when coming back
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isActiveDeal = (deal: Deal) => {
    if (!deal.target_close_date) return true;
    return new Date(deal.target_close_date) >= new Date();
  };

  const activeDeals = deals.filter(isActiveDeal);
  const inactiveDeals = deals.filter(deal => !isActiveDeal(deal));

  if (selectedDeal) {
    return (
      <DealDetailView 
        deal={selectedDeal} 
        onBack={handleBackToDeals}
        onRequestUpdate={loadDeals}
      />
    );
  }

  const renderDealCard = (deal: Deal) => (
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
              <Badge variant={isActiveDeal(deal) ? "default" : "secondary"}>
                {isActiveDeal(deal) ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Create Deal Header */}
      <Card className="bg-gradient-to-r from-bb-red to-red-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Deal Management</CardTitle>
              <CardDescription className="text-red-100">
                Create and manage M&A deals throughout the entire acquisition process
              </CardDescription>
            </div>
            <CreateDealModal onDealCreated={loadDeals} />
          </div>
        </CardHeader>
      </Card>

      {/* Active Deals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Active Deals</span>
          </CardTitle>
          <CardDescription>
            Deals that are currently active or have no target close date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading deals...</div>
          ) : activeDeals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active deals found.
            </div>
          ) : (
            <div className="space-y-3">
              {activeDeals.map(renderDealCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Deals */}
      {inactiveDeals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-gray-500" />
              <span>Inactive Deals</span>
            </CardTitle>
            <CardDescription>
              Deals that have passed their target close date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveDeals.map(renderDealCard)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
