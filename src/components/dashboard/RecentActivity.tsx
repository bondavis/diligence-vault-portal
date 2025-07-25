
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'document_upload' | 'request_completed' | 'request_created' | 'response_submitted';
  user_name: string;
  action: string;
  target: string;
  timestamp: string;
}

interface RecentActivityProps {
  dealId: string;
}

export const RecentActivity = ({ dealId }: RecentActivityProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRecentActivity();
  }, [dealId]);

  const loadRecentActivity = async () => {
    try {
      setLoading(true);
      const activities: ActivityItem[] = [];

      // Get recent document uploads
      const { data: documents, error: docError } = await supabase
        .from('request_documents')
        .select(`
          id,
          filename,
          uploaded_at,
          uploaded_by,
          diligence_requests!inner(deal_id, title)
        `)
        .eq('diligence_requests.deal_id', dealId)
        .order('uploaded_at', { ascending: false })
        .limit(10);

      if (docError) throw docError;

      // Get user names for document uploads
      if (documents && documents.length > 0) {
        const uploaderIds = [...new Set(documents.map(doc => doc.uploaded_by))];
        const { data: uploaders } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uploaderIds);

        const uploaderMap = new Map(uploaders?.map(u => [u.id, u.name]) || []);

        documents.forEach(doc => {
          activities.push({
            id: `doc-${doc.id}`,
            type: 'document_upload',
            user_name: uploaderMap.get(doc.uploaded_by) || 'Unknown User',
            action: 'document uploaded',
            target: doc.filename,
            timestamp: doc.uploaded_at
          });
        });
      }

      // Get recent request completions (approved status)
      const { data: completedRequests, error: reqError } = await supabase
        .from('diligence_requests')
        .select(`
          id,
          title,
          updated_at,
          status,
          assigned_to
        `)
        .eq('deal_id', dealId)
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (reqError) throw reqError;

      // Get user names for completed requests
      if (completedRequests && completedRequests.length > 0) {
        const assigneeIds = [...new Set(completedRequests.map(req => req.assigned_to).filter(Boolean))];
        const { data: assignees } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', assigneeIds);

        const assigneeMap = new Map(assignees?.map(a => [a.id, a.name]) || []);

        completedRequests.forEach(req => {
          activities.push({
            id: `req-completed-${req.id}`,
            type: 'request_completed',
            user_name: assigneeMap.get(req.assigned_to || '') || 'Unknown User',
            action: 'request completed',
            target: req.title,
            timestamp: req.updated_at
          });
        });
      }

      // Get recently created requests
      const { data: newRequests, error: newReqError } = await supabase
        .from('diligence_requests')
        .select(`
          id,
          title,
          created_at,
          created_by
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (newReqError) throw newReqError;

      // Get user names for new requests
      if (newRequests && newRequests.length > 0) {
        const creatorIds = [...new Set(newRequests.map(req => req.created_by))];
        const { data: creators } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', creatorIds);

        const creatorMap = new Map(creators?.map(c => [c.id, c.name]) || []);

        newRequests.forEach(req => {
          activities.push({
            id: `req-created-${req.id}`,
            type: 'request_created',
            user_name: creatorMap.get(req.created_by) || 'Unknown User',
            action: 'new request created',
            target: req.title,
            timestamp: req.created_at
          });
        });
      }

      // Get recent responses
      const { data: responses, error: respError } = await supabase
        .from('diligence_responses')
        .select(`
          id,
          submitted_at,
          user_id,
          diligence_requests!inner(deal_id, title)
        `)
        .eq('diligence_requests.deal_id', dealId)
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (respError) throw respError;

      // Get user names for responses
      if (responses && responses.length > 0) {
        const responderIds = [...new Set(responses.map(resp => resp.user_id))];
        const { data: responders } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', responderIds);

        const responderMap = new Map(responders?.map(r => [r.id, r.name]) || []);

        responses.forEach(resp => {
          activities.push({
            id: `resp-${resp.id}`,
            type: 'response_submitted',
            user_name: responderMap.get(resp.user_id) || 'Unknown User',
            action: 'response submitted',
            target: resp.diligence_requests?.title || 'Request',
            timestamp: resp.submitted_at
          });
        });
      }

      // Sort all activities by timestamp and take the most recent
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      toast({
        title: "Error",
        description: "Failed to load recent activity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return time.toLocaleDateString();
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'document_upload': return 'bg-blue-500';
      case 'request_completed': return 'bg-green-500';
      case 'request_created': return 'bg-purple-500';
      case 'response_submitted': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type)}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{activity.user_name}</span>
                    <span className="text-gray-600"> {activity.action} </span>
                    <span className="font-medium text-gray-900">{activity.target}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(activity.timestamp)}
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
