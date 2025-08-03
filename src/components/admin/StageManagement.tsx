import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, GripVertical, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type DiligenceStage = Database['public']['Tables']['diligence_stages']['Row'];

export const StageManagement = () => {
  const [stages, setStages] = useState<DiligenceStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStage, setEditingStage] = useState<DiligenceStage | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadStages();
    loadStageCounts();
  }, []);

  const loadStages = async () => {
    try {
      const { data, error } = await supabase
        .from('diligence_stages')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error loading stages:', error);
      toast({
        title: "Error",
        description: "Failed to load stages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStageCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('diligence_requests')
        .select('stage_id')
        .not('stage_id', 'is', null);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(request => {
        if (request.stage_id) {
          counts[request.stage_id] = (counts[request.stage_id] || 0) + 1;
        }
      });
      setStageCounts(counts);
    } catch (error) {
      console.error('Error loading stage counts:', error);
    }
  };

  const saveStage = async (stageData: {
    name: string;
    description: string;
    sort_order: number;
    completion_threshold: number;
    is_active: boolean;
  }) => {
    try {
      if (editingStage) {
        const { error } = await supabase
          .from('diligence_stages')
          .update(stageData)
          .eq('id', editingStage.id);

        if (error) throw error;
        toast({ title: "Success", description: "Stage updated successfully" });
      } else {
        const { error } = await supabase
          .from('diligence_stages')
          .insert(stageData);

        if (error) throw error;
        toast({ title: "Success", description: "Stage created successfully" });
      }

      setEditingStage(null);
      setShowCreateDialog(false);
      loadStages();
    } catch (error) {
      console.error('Error saving stage:', error);
      toast({
        title: "Error",
        description: "Failed to save stage",
        variant: "destructive"
      });
    }
  };

  const deleteStage = async (stageId: string) => {
    try {
      const { error } = await supabase
        .from('diligence_stages')
        .delete()
        .eq('id', stageId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Stage deleted successfully" });
      loadStages();
      loadStageCounts();
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast({
        title: "Error",
        description: "Failed to delete stage",
        variant: "destructive"
      });
    }
  };

  const StageForm = ({ stage, onSave, onCancel }: {
    stage?: DiligenceStage | null;
    onSave: (data: {
      name: string;
      description: string;
      sort_order: number;
      completion_threshold: number;
      is_active: boolean;
    }) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: stage?.name || '',
      description: stage?.description || '',
      sort_order: stage?.sort_order || stages.length + 1,
      completion_threshold: stage?.completion_threshold || 80,
      is_active: stage?.is_active ?? true
    });

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Stage Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter stage name"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter stage description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
            />
          </div>
          
          <div>
            <Label htmlFor="completion_threshold">Completion Threshold (%)</Label>
            <Input
              id="completion_threshold"
              type="number"
              min="0"
              max="100"
              value={formData.completion_threshold}
              onChange={(e) => setFormData(prev => ({ ...prev, completion_threshold: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(formData)}>
            {stage ? 'Update' : 'Create'} Stage
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading stages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Stage Management</h2>
          <p className="text-muted-foreground">Configure diligence request stages and workflow</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Stage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Stage</DialogTitle>
              <DialogDescription>
                Add a new stage to the diligence workflow
              </DialogDescription>
            </DialogHeader>
            <StageForm
              onSave={saveStage}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {stages.map((stage) => (
          <Card key={stage.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{stage.name}</span>
                      <Badge variant={stage.is_active ? "default" : "secondary"}>
                        {stage.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{stage.description}</CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{stageCounts[stage.id] || 0} requests</span>
                  </Badge>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setEditingStage(stage)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Stage</DialogTitle>
                        <DialogDescription>
                          Modify stage settings and configuration
                        </DialogDescription>
                      </DialogHeader>
                      <StageForm
                        stage={editingStage}
                        onSave={saveStage}
                        onCancel={() => setEditingStage(null)}
                      />
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Stage</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{stage.name}"? This action cannot be undone.
                          {stageCounts[stage.id] && stageCounts[stage.id] > 0 && (
                            <span className="block mt-2 text-destructive">
                              Warning: This stage has {stageCounts[stage.id]} requests assigned to it.
                            </span>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteStage(stage.id)}>
                          Delete Stage
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Sort Order:</span> {stage.sort_order}
                </div>
                <div>
                  <span className="font-medium">Completion Threshold:</span> {stage.completion_threshold}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};