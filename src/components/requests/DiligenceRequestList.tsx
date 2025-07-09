
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Check, Clock, AlertCircle } from 'lucide-react';
import { User } from '@/pages/Index';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { EmployeeCensusSpreadsheet } from '@/components/requests/EmployeeCensusSpreadsheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiligenceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  due_date: string | null;
  allow_file_upload: boolean;
  allow_text_response: boolean;
  created_at: string;
  user_response?: {
    text_response: string | null;
    submitted_at: string;
  };
}

interface DiligenceRequestListProps {
  user: User;
}

export const DiligenceRequestList = ({ user }: DiligenceRequestListProps) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [requests, setRequests] = useState<DiligenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const loadRequests = async () => {
    try {
      setLoading(true);

      // Get requests assigned to the user using type assertion
      const { data: requestsData, error: requestsError } = await (supabase as any)
        .from('diligence_requests')
        .select(`
          id,
          title,
          description,
          category,
          priority,
          status,
          due_date,
          allow_file_upload,
          allow_text_response,
          created_at
        `)
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get user responses for these requests
      const requestIds = requestsData?.map((r: any) => r.id) || [];
      if (requestIds.length > 0) {
        const { data: responsesData, error: responsesError } = await (supabase as any)
          .from('diligence_responses')
          .select('request_id, text_response, submitted_at')
          .in('request_id', requestIds)
          .eq('user_id', user.id);

        if (responsesError) throw responsesError;

        // Combine requests with responses
        const requestsWithResponses = requestsData?.map((request: any) => ({
          ...request,
          user_response: responsesData?.find((r: any) => r.request_id === request.id)
        })) || [];

        setRequests(requestsWithResponses);

        // Pre-populate response texts
        const initialResponseTexts: Record<string, string> = {};
        requestsWithResponses.forEach((request: any) => {
          if (request.user_response?.text_response) {
            initialResponseTexts[request.id] = request.user_response.text_response;
          }
        });
        setResponseTexts(initialResponseTexts);
      } else {
        setRequests([]);
      }

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

  useEffect(() => {
    loadRequests();
  }, [user.id]);

  const categories = ['all', ...Array.from(new Set(requests.map(r => r.category)))];
  const filteredRequests = activeCategory === 'all' 
    ? requests 
    : requests.filter(r => r.category === activeCategory);

  const getStatusIcon = (request: DiligenceRequest) => {
    if (request.user_response) {
      return <Check className="h-4 w-4" />;
    }
    switch (request.status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'submitted': return <AlertCircle className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (request: DiligenceRequest) => {
    if (request.user_response) {
      return 'bg-green-100 text-green-800';
    }
    switch (request.status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (request: DiligenceRequest) => {
    if (request.user_response) {
      return 'responded';
    }
    return request.status;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResponseTextChange = (requestId: string, value: string) => {
    setResponseTexts(prev => ({
      ...prev,
      [requestId]: value
    }));
  };

  const submitResponse = async (requestId: string) => {
    try {
      const responseText = responseTexts[requestId] || '';
      
      const { error } = await (supabase as any)
        .from('diligence_responses')
        .upsert({
          request_id: requestId,
          user_id: user.id,
          text_response: responseText,
        }, {
          onConflict: 'request_id,user_id'
        });

      if (error) throw error;

      toast({
        title: "Response Submitted",
        description: "Your response has been saved successfully",
      });

      // Reload requests to update the UI
      loadRequests();
      setExpandedRequest(null);

    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading diligence requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diligence Requests</CardTitle>
          <CardDescription>
            Complete your assigned requests by uploading documents and providing responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              {categories.slice(0, 4).map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category} {category !== 'all' && `(${requests.filter(r => r.category === category).length})`}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeCategory} className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No requests found for this category
                </div>
              ) : (
                filteredRequests.map(request => (
                  <Card key={request.id} className="transition-all hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            <Badge variant="outline" className={getPriorityColor(request.priority)}>
                              {request.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(request)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(request)}
                                <span className="capitalize">{getStatusText(request)}</span>
                              </div>
                            </Badge>
                            {request.due_date && (
                              <Badge variant="outline" className="text-xs">
                                Due: {new Date(request.due_date).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedRequest(
                            expandedRequest === request.id ? null : request.id
                          )}
                        >
                          {expandedRequest === request.id ? 'Collapse' : 'Respond'}
                        </Button>
                      </div>
                      <CardDescription className="text-sm">
                        {request.description}
                      </CardDescription>
                    </CardHeader>

                    {expandedRequest === request.id && (
                      <CardContent className="pt-0 space-y-4">
                        {request.allow_text_response && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Text Response</label>
                            <Textarea
                              placeholder="Enter your response here..."
                              value={responseTexts[request.id] || ''}
                              onChange={(e) => handleResponseTextChange(request.id, e.target.value)}
                              className="min-h-[100px]"
                            />
                          </div>
                        )}

                        {/* Employee Census Spreadsheet for HR-related requests */}
                        {(request.title.toLowerCase().includes('employee census') || 
                          request.title.toLowerCase().includes('employee list') ||
                          request.category === 'HR') && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Employee Census</label>
                            <EmployeeCensusSpreadsheet />
                          </div>
                        )}

                        {request.allow_file_upload && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">File Upload</label>
                            <FileUploadZone requestId={request.id} />
                          </div>
                        )}

                        {!request.user_response && (
                          <div className="flex space-x-2 pt-2">
                            <Button 
                              size="sm" 
                              onClick={() => submitResponse(request.id)}
                              className="bg-bb-red hover:bg-red-700"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Submit Response
                            </Button>
                          </div>
                        )}

                        {request.user_response && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-green-800">
                              Response submitted on {new Date(request.user_response.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
