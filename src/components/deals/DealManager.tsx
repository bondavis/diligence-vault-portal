
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Building, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  name: string;
  project_name: string;
  company_name: string;
  target_close_date: string | null;
  created_at: string;
}

export const DealManager = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    project_name: '',
    company_name: '',
    target_close_date: ''
  });
  const { toast } = useToast();

  const loadDeals = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDeals(data || []);
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

  useEffect(() => {
    loadDeals();
  }, []);

  const createDeal = async () => {
    if (!newDeal.name || !newDeal.project_name || !newDeal.company_name) {
      toast({
        title: "Missing Information",
        description: "Please provide deal name, project name, and company name",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await (supabase as any)
        .from('deals')
        .insert([{
          name: newDeal.name,
          project_name: newDeal.project_name,
          company_name: newDeal.company_name,
          target_close_date: newDeal.target_close_date || null,
          created_by: userData.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Deal Created",
        description: `${newDeal.name} has been created successfully`,
      });

      setNewDeal({ name: '', project_name: '', company_name: '', target_close_date: '' });
      setShowCreateDialog(false);
      loadDeals();

    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: "Failed to create deal",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading deals...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Deal Management</span>
            </CardTitle>
            <CardDescription>Create and manage M&A deals</CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-bb-red hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Deal</DialogTitle>
                <DialogDescription>
                  Add a new M&A deal to the platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deal-name">Deal Name</Label>
                  <Input
                    id="deal-name"
                    placeholder="e.g., TechCorp Acquisition"
                    value={newDeal.name}
                    onChange={(e) => setNewDeal(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g., Project Alpha"
                    value={newDeal.project_name}
                    onChange={(e) => setNewDeal(prev => ({ ...prev, project_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="e.g., TechCorp Inc."
                    value={newDeal.company_name}
                    onChange={(e) => setNewDeal(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-close">Target Close Date (Optional)</Label>
                  <Input
                    id="target-close"
                    type="date"
                    value={newDeal.target_close_date}
                    onChange={(e) => setNewDeal(prev => ({ ...prev, target_close_date: e.target.value }))}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={createDeal} 
                    disabled={creating}
                    className="bg-bb-red hover:bg-red-700"
                  >
                    {creating ? 'Creating...' : 'Create Deal'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No deals created yet</p>
            <p className="text-sm">Create your first deal to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map(deal => (
              <div key={deal.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{deal.name}</h3>
                    <p className="text-sm text-gray-600">Project: {deal.project_name}</p>
                    <p className="text-sm text-gray-600">Company: {deal.company_name}</p>
                    {deal.target_close_date && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        Target Close: {new Date(deal.target_close_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    Created {new Date(deal.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
