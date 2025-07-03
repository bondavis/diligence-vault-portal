
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
    { value: 'admin' as const, label: 'Admin', description: 'Full access to all features' },
    { value: 'upload_only' as const, label: 'Upload Only', description: 'Can upload files and respond to requests' },
    { value: 'view_only' as const, label: 'View Only', description: 'Can only view assigned requests' }
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
              <SelectTrigger className="w-[140px] h-8 bg-white border-amber-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
