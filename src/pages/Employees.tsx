import { useEffect, useState, useMemo } from 'react';
import { Plus, UserX, Mail, Phone, Building, Briefcase, Search, Filter, Users, UserCheck, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { employeesApi } from '@/services/api';
import { Employee } from '@/types';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const departments = employeesApi.getDepartments();

  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await employeesApi.getAll();
      if (response.success && response.data) {
        setEmployees(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' ||
        employee.firstName.toLowerCase().includes(searchLower) ||
        employee.lastName.toLowerCase().includes(searchLower) ||
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchLower) ||
        employee.employeeId.toLowerCase().includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;

      // Department filter
      const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, searchQuery, statusFilter, departmentFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
  }), [employees]);

  const handleAddEmployee = async () => {
    setIsSubmitting(true);
    try {
      const response = await employeesApi.create({
        ...formData,
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
      });

      if (response.success && response.data) {
        setEmployees(prev => [...prev, response.data!]);
        setIsAddDialogOpen(false);
        setFormData({
          employeeId: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          department: '',
          position: '',
        });
        toast({
          title: 'Success',
          description: 'Employee added successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add employee',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      const response = await employeesApi.deactivate(selectedEmployee.id);

      if (response.success) {
        setEmployees(prev =>
          prev.map(e => (e.id === selectedEmployee.id ? { ...e, status: 'inactive' } : e))
        );
        setIsDeactivateDialogOpen(false);
        setSelectedEmployee(null);
        toast({
          title: 'Success',
          description: 'Employee deactivated successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate employee',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || departmentFilter !== 'all';

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Employees</h1>
          <p className="text-base text-muted-foreground">Manage your organization's workforce</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 rounded-lg shadow-md hover:shadow-lg transition-all">
              <Plus className="h-5 w-5" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Add New Employee</DialogTitle>
              <DialogDescription>
                Enter the employee details below to add them to your workforce
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="font-medium">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="EMP006"
                    className="border-2 h-10 transition-all focus:border-primary focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="font-medium">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger className="border-2 h-10">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="border-2 h-10 transition-all focus:border-primary focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className="border-2 h-10 transition-all focus:border-primary focus:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@company.com"
                  className="border-2 h-10 transition-all focus:border-primary focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  className="border-2 h-10 transition-all focus:border-primary focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className="font-medium">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Software Engineer"
                  className="border-2 h-10 transition-all focus:border-primary focus:ring-0"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleAddEmployee} disabled={isSubmitting} className="rounded-lg">
                {isSubmitting ? 'Adding...' : 'Add Employee'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-all">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground font-medium">Total Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success shadow-md hover:shadow-lg transition-all">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 flex-shrink-0">
              <UserCheck className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-3xl font-bold text-foreground">{stats.active}</p>
              <p className="text-sm text-muted-foreground font-medium">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-muted-foreground shadow-md hover:shadow-lg transition-all">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted flex-shrink-0">
              <UserMinus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-3xl font-bold text-foreground">{stats.inactive}</p>
              <p className="text-sm text-muted-foreground font-medium">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-md border-0">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, employee ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 border-2 h-10 transition-all focus:border-primary focus:ring-0"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger className="w-[160px] border-2 h-10">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px] border-2 h-10">
                  <Building className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="text-primary border-2 hover:bg-primary/10 transition-all">
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {filteredEmployees.length} of {employees.length} employees</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold">Employee Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Position</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Join Date</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-10 w-10 text-muted-foreground/50" />
                        <p className="font-medium text-muted-foreground">No employees found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                            <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate max-w-[180px]">{employee.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {employee.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{employee.department}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span>{employee.position}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={employee.status === 'active' ? 'default' : 'secondary'}
                          className={employee.status === 'active' 
                            ? 'bg-success/15 text-success border-success/30 hover:bg-success/20' 
                            : 'bg-muted text-muted-foreground'}
                        >
                          {employee.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{employee.joinDate}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {employee.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsDeactivateDialogOpen(true);
                            }}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selectedEmployee?.firstName} {selectedEmployee?.lastName}?
              This action can be reversed later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeactivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={isSubmitting}>
              {isSubmitting ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
