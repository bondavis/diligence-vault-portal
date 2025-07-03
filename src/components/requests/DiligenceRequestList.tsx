
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, MessageSquare, Check, Clock, AlertCircle } from 'lucide-react';
import { User } from '@/pages/Index';
import { FileUploadZone } from '@/components/upload/FileUploadZone';

interface DiligenceRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'submitted' | 'approved';
  assignedTo: string;
  allowFileUpload: boolean;
  allowTextResponse: boolean;
  response?: string;
  files?: string[];
}

interface DiligenceRequestListProps {
  user: User;
}

export const DiligenceRequestList = ({ user }: DiligenceRequestListProps) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  // Mock diligence requests
  const requests: DiligenceRequest[] = [
    {
      id: '1',
      category: 'Financial',
      title: 'Audited Financial Statements',
      description: 'Please provide audited financial statements for the last 3 years (2021, 2022, 2023)',
      priority: 'high',
      status: 'pending',
      assignedTo: user.id,
      allowFileUpload: true,
      allowTextResponse: false
    },
    {
      id: '2',
      category: 'Financial',
      title: 'Revenue Recognition Policy',
      description: 'Describe the company\'s revenue recognition policy and any recent changes',
      priority: 'medium',
      status: 'submitted',
      assignedTo: user.id,
      allowFileUpload: true,
      allowTextResponse: true,
      response: 'We follow ASC 606 revenue recognition standards...'
    },
    {
      id: '3',
      category: 'Legal',
      title: 'Material Contracts',
      description: 'Upload all material contracts including customer agreements, supplier contracts, and partnership agreements',
      priority: 'high',
      status: 'pending',
      assignedTo: user.id,
      allowFileUpload: true,
      allowTextResponse: false
    },
    {
      id: '4',
      category: 'Operations',
      title: 'Organizational Chart',
      description: 'Provide current organizational chart showing reporting relationships',
      priority: 'low',
      status: 'approved',
      assignedTo: user.id,
      allowFileUpload: true,
      allowTextResponse: false
    }
  ];

  const categories = ['all', ...Array.from(new Set(requests.map(r => r.category)))];
  const filteredRequests = activeCategory === 'all' 
    ? requests 
    : requests.filter(r => r.category === activeCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'submitted': return <AlertCircle className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category} {category !== 'all' && `(${requests.filter(r => r.category === category).length})`}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeCategory} className="space-y-4">
              {filteredRequests.map(request => (
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
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status}</span>
                          </div>
                        </Badge>
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
                      {request.allowTextResponse && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Text Response</label>
                          <Textarea
                            placeholder="Enter your response here..."
                            defaultValue={request.response}
                            className="min-h-[100px]"
                          />
                        </div>
                      )}

                      {request.allowFileUpload && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">File Upload</label>
                          <FileUploadZone requestId={request.id} />
                        </div>
                      )}

                      {user.role !== 'view_only' && request.status === 'pending' && (
                        <div className="flex space-x-2 pt-2">
                          <Button size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Submit Response
                          </Button>
                          <Button variant="outline" size="sm">
                            Save Draft
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
