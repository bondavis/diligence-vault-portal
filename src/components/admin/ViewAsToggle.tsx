
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, User } from 'lucide-react';
import { UserRole } from '@/pages/Index';

interface ViewAsToggleProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const ViewAsToggle = ({ currentRole, onRoleChange }: ViewAsToggleProps) => {
  const roleOptions = [
    { value: 'bbt_execution_team' as const, label: 'BBT Execution Team', description: 'Full admin access to all features', organization: 'BBT' },
    { value: 'bbt_operations' as const, label: 'BBT Operations', description: 'BBT operations team access', organization: 'BBT' },
    { value: 'bbt_finance' as const, label: 'BBT Finance', description: 'BBT finance team access', organization: 'BBT' },
    { value: 'bbt_legal' as const, label: 'BBT Legal', description: 'BBT legal team access', organization: 'BBT' },
    { value: 'bbt_exec' as const, label: 'BBT Executive', description: 'BBT executive team access', organization: 'BBT' },
    { value: 'seller' as const, label: 'Seller', description: 'Seller access to assigned deals', organization: 'Seller' },
    { value: 'seller_legal' as const, label: 'Seller Legal', description: 'Seller legal team access', organization: 'Seller' },
    { value: 'seller_financial' as const, label: 'Seller Financial', description: 'Seller financial team access', organization: 'Seller' },
    { value: 'rsm' as const, label: 'RSM', description: 'RSM team access', organization: 'RSM' },
    { value: 'hensen_efron' as const, label: 'Hensen & Efron', description: 'Hensen & Efron team access', organization: 'Hensen & Efron' }
  ];

  const currentRoleInfo = roleOptions.find(option => option.value === currentRole);

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Admin View Mode:</span>
            </div>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              <User className="h-3 w-3 mr-1" />
              Viewing as {currentRoleInfo?.label}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-xs text-amber-700">{currentRoleInfo?.description}</span>
            <Select value={currentRole} onValueChange={onRoleChange}>
              <SelectTrigger className="w-[180px] h-8 bg-white border-amber-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.organization}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
