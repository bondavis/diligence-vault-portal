
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  orgFilter: string;
  onOrgFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const UserFilters = ({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  orgFilter,
  onOrgFilterChange,
  statusFilter,
  onStatusFilterChange
}: UserFiltersProps) => {
  return (
    <div className="flex space-x-4">
      <div className="flex-1">
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Select value={orgFilter} onValueChange={onOrgFilterChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by org" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Organizations</SelectItem>
          <SelectItem value="BBT">BBT</SelectItem>
          <SelectItem value="Seller">Seller</SelectItem>
          <SelectItem value="RSM">RSM</SelectItem>
          <SelectItem value="Hensen & Efron">Hensen & Efron</SelectItem>
        </SelectContent>
      </Select>
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="bbt_execution_team">BBT Execution Team</SelectItem>
          <SelectItem value="bbt_operations">BBT Operations</SelectItem>
          <SelectItem value="bbt_finance">BBT Finance</SelectItem>
          <SelectItem value="bbt_legal">BBT Legal</SelectItem>
          <SelectItem value="bbt_exec">BBT Executive</SelectItem>
          <SelectItem value="seller">Seller</SelectItem>
          <SelectItem value="seller_legal">Seller Legal</SelectItem>
          <SelectItem value="seller_financial">Seller Financial</SelectItem>
          <SelectItem value="rsm">RSM</SelectItem>
          <SelectItem value="hensen_efron">Hensen & Efron</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
