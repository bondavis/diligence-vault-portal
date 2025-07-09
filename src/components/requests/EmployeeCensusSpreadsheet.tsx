import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EmployeeRecord {
  id: string;
  employeeName: string;
  role: string;
  backfill: 'Yes' | 'No' | '';
  ptFt: 'Part Time' | 'Full Time' | '';
  salaryHourly: 'Salary' | 'Hourly' | '';
  basePay: string;
  hourlyPay: string;
  bonus: string;
  notes: string;
}

interface EmployeeCensusSpreadsheetProps {
  onDataChange?: (data: EmployeeRecord[]) => void;
  initialData?: EmployeeRecord[];
}

export const EmployeeCensusSpreadsheet: React.FC<EmployeeCensusSpreadsheetProps> = ({
  onDataChange,
  initialData = []
}) => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>(
    initialData.length > 0 ? initialData : [createEmptyEmployee()]
  );

  function createEmptyEmployee(): EmployeeRecord {
    return {
      id: Math.random().toString(36).substr(2, 9),
      employeeName: '',
      role: '',
      backfill: '',
      ptFt: '',
      salaryHourly: '',
      basePay: '',
      hourlyPay: '',
      bonus: '',
      notes: ''
    };
  }

  const updateEmployee = (id: string, field: keyof EmployeeRecord, value: string) => {
    const updatedEmployees = employees.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    );
    setEmployees(updatedEmployees);
    onDataChange?.(updatedEmployees);
  };

  const addEmployee = () => {
    const newEmployees = [...employees, createEmptyEmployee()];
    setEmployees(newEmployees);
    onDataChange?.(newEmployees);
  };

  const removeEmployee = (id: string) => {
    if (employees.length <= 1) {
      toast({
        title: "Cannot remove row",
        description: "At least one employee row must remain.",
        variant: "destructive"
      });
      return;
    }
    const updatedEmployees = employees.filter(emp => emp.id !== id);
    setEmployees(updatedEmployees);
    onDataChange?.(updatedEmployees);
  };

  const exportToCsv = () => {
    const headers = [
      'Employee Name', 'Role', 'Backfill', 'PT/FT', 'Salary/Hourly',
      'Base Pay', 'Hourly Pay', 'Bonus', 'Notes'
    ];
    
    const csvContent = [
      headers.join(','),
      ...employees.map(emp => [
        emp.employeeName,
        emp.role,
        emp.backfill,
        emp.ptFt,
        emp.salaryHourly,
        emp.basePay,
        emp.hourlyPay,
        emp.bonus,
        emp.notes
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_census.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Employee census data exported to CSV."
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Employee Census</CardTitle>
          <div className="flex gap-2">
            <Button onClick={addEmployee} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
            <Button onClick={exportToCsv} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header Row */}
            <div className="grid grid-cols-10 gap-2 mb-2 p-2 bg-muted rounded-md font-medium text-sm">
              <div>Employee Name</div>
              <div>Role</div>
              <div>Backfill</div>
              <div>PT/FT</div>
              <div>Salary/Hourly</div>
              <div>Base Pay</div>
              <div>Hourly Pay</div>
              <div>Bonus</div>
              <div>Notes</div>
              <div>Actions</div>
            </div>

            {/* Employee Rows */}
            {employees.map((employee) => (
              <div key={employee.id} className="grid grid-cols-10 gap-2 mb-2 p-2 border rounded-md">
                <Input
                  value={employee.employeeName}
                  onChange={(e) => updateEmployee(employee.id, 'employeeName', e.target.value)}
                  placeholder="Employee name"
                  className="h-8"
                />
                
                <Input
                  value={employee.role}
                  onChange={(e) => updateEmployee(employee.id, 'role', e.target.value)}
                  placeholder="Role"
                  className="h-8"
                />
                
                <Select
                  value={employee.backfill}
                  onValueChange={(value) => updateEmployee(employee.id, 'backfill', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={employee.ptFt}
                  onValueChange={(value) => updateEmployee(employee.id, 'ptFt', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Part Time">Part Time</SelectItem>
                    <SelectItem value="Full Time">Full Time</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={employee.salaryHourly}
                  onValueChange={(value) => updateEmployee(employee.id, 'salaryHourly', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  value={employee.basePay}
                  onChange={(e) => updateEmployee(employee.id, 'basePay', e.target.value)}
                  placeholder="Base pay"
                  className="h-8"
                />
                
                <Input
                  value={employee.hourlyPay}
                  onChange={(e) => updateEmployee(employee.id, 'hourlyPay', e.target.value)}
                  placeholder="Hourly pay"
                  className="h-8"
                />
                
                <Input
                  value={employee.bonus}
                  onChange={(e) => updateEmployee(employee.id, 'bonus', e.target.value)}
                  placeholder="Bonus"
                  className="h-8"
                />
                
                <Input
                  value={employee.notes}
                  onChange={(e) => updateEmployee(employee.id, 'notes', e.target.value)}
                  placeholder="Notes"
                  className="h-8"
                />
                
                <Button
                  onClick={() => removeEmployee(employee.id)}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  disabled={employees.length <= 1}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};