
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Building } from 'lucide-react';

interface Deal {
  id: string;
  name: string;
  company_name: string;
  project_name: string;
  target_close_date: string | null;
  created_at: string;
}

interface DealHeaderProps {
  deal: Deal;
  overallCompletionPercentage: number;
  onBack: () => void;
}

export const DealHeader = ({ deal, overallCompletionPercentage, onBack }: DealHeaderProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deals
            </Button>
            <div>
              <CardTitle className="text-2xl">{deal.name}</CardTitle>
              <CardDescription>
                {deal.company_name} - {deal.project_name}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-bb-red">{overallCompletionPercentage}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium">Company</div>
              <div className="text-sm text-gray-600">{deal.company_name}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium">Created</div>
              <div className="text-sm text-gray-600">{formatDate(deal.created_at)}</div>
            </div>
          </div>
          {deal.target_close_date && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Target Close</div>
                <div className="text-sm text-gray-600">{formatDate(deal.target_close_date)}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
