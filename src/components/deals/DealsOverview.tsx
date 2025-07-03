
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Users, FileText, Calendar } from 'lucide-react';

interface Deal {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'pending' | 'closed';
  progress: number;
  targetClose: string;
  userCount: number;
  requestCount: number;
  category: string;
}

export const DealsOverview = () => {
  const deals: Deal[] = [
    {
      id: 'deal-1',
      name: 'TechCorp Acquisition',
      code: 'TECH-2024-001',
      status: 'active',
      progress: 67,
      targetClose: '2024-08-15',
      userCount: 8,
      requestCount: 45,
      category: 'Technology'
    },
    {
      id: 'deal-2',
      name: 'HealthTech Merger',
      code: 'HLTH-2024-002',
      status: 'active',
      progress: 23,
      targetClose: '2024-09-30',
      userCount: 12,
      requestCount: 62,
      category: 'Healthcare'
    },
    {
      id: 'deal-3',
      name: 'FinServ Partnership',
      code: 'FINS-2024-003',
      status: 'pending',
      progress: 5,
      targetClose: '2024-12-15',
      userCount: 4,
      requestCount: 28,
      category: 'Financial Services'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Active Deals</h3>
          <p className="text-sm text-muted-foreground">Manage and monitor all deal progress</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      <div className="grid gap-6">
        {deals.map(deal => (
          <Card key={deal.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-xl">{deal.name}</CardTitle>
                    <Badge variant="outline" className={getStatusColor(deal.status)}>
                      {deal.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center space-x-4">
                    <span>Code: {deal.code}</span>
                    <span>•</span>
                    <span>{deal.category}</span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{deal.progress}%</div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={deal.progress} className="h-2" />
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Target Close</div>
                    <div className="text-muted-foreground">
                      {new Date(deal.targetClose).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{deal.userCount} Users</div>
                    <div className="text-muted-foreground">Active participants</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{deal.requestCount} Requests</div>
                    <div className="text-muted-foreground">Total diligence items</div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm">View Details</Button>
                <Button variant="outline" size="sm">Manage Users</Button>
                <Button variant="outline" size="sm">Export Data</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
