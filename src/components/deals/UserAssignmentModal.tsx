import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Search, Mail } from 'lucide-react';
import { auditLogger } from '@/utils/auditLogger';
import { validateInput } from '@/utils/inputValidation';

const newUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['seller', 'seller_legal', 'seller_financial'], {
    required_error: 'Role is required'
  }),
  organization: z.string().optional(),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

interface UserAssignmentModalProps {
  dealId: string;
  dealName: string;
  onAssignmentComplete?: () => void;
  trigger?: React.ReactNode;
}

interface ExistingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
  isAssigned: boolean;
}

export const UserAssignmentModal = ({ dealId, dealName, onAssignmentComplete, trigger }: UserAssignmentModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: undefined,
      organization: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadExistingUsers();
    }
  }, [isOpen, dealId]);

  const loadExistingUsers = async () => {
    try {
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (usersError) throw usersError;

      // Get users already assigned to this deal
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_deals')
        .select('user_id')
        .eq('deal_id', dealId);

      if (assignmentsError) throw assignmentsError;

      const assignedUserIds = new Set(assignments?.map(a => a.user_id) || []);

      const usersWithAssignmentStatus: ExistingUser[] = (users || []).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        isAssigned: assignedUserIds.has(user.id)
      }));

      setExistingUsers(usersWithAssignmentStatus);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = existingUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unassignedUsers = filteredUsers.filter(user => !user.isAssigned);
  const assignedUsers = filteredUsers.filter(user => user.isAssigned);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssignExistingUsers = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select at least one user to assign.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create assignments
      const assignments = selectedUsers.map(userId => ({
        user_id: userId,
        deal_id: dealId,
        assigned_by: user.id,
        role_in_deal: 'participant'
      }));

      const { error } = await supabase
        .from('user_deals')
        .insert(assignments);

      if (error) throw error;

      // Log the assignments
      for (const userId of selectedUsers) {
        await auditLogger.logEvent('user_assignment', {
          action: 'assign_user_to_deal',
          resource_id: dealId,
          resource_type: 'deal',
          user_id: userId,
          deal_name: dealName
        });
      }

      toast({
        title: "Users Assigned",
        description: `Successfully assigned ${selectedUsers.length} user(s) to ${dealName}`,
      });

      setSelectedUsers([]);
      loadExistingUsers();
      
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }

    } catch (error) {
      console.error('Error assigning users:', error);
      toast({
        title: "Error",
        description: "Failed to assign users to deal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitNewUser = async (values: NewUserFormValues) => {
    try {
      setIsSubmitting(true);

      // Validate and sanitize inputs
      const validatedName = validateInput(values.name, 'text');
      const validatedEmail = validateInput(values.email, 'email');
      const validatedOrganization = values.organization ? validateInput(values.organization, 'text') : null;

      if (!validatedName.isValid) {
        toast({
          title: "Invalid Name",
          description: validatedName.error,
          variant: "destructive",
        });
        return;
      }

      if (!validatedEmail.isValid) {
        toast({
          title: "Invalid Email",
          description: validatedEmail.error,
          variant: "destructive",
        });
        return;
      }

      if (validatedOrganization && !validatedOrganization.isValid) {
        toast({
          title: "Invalid Organization",
          description: validatedOrganization.error,
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create user profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(), // Generate a temporary ID for the profile
          name: validatedName.sanitized,
          email: validatedEmail.sanitized,
          role: values.role,
          organization: validatedOrganization?.sanitized || null,
          invitation_status: 'pending',
          invited_by: user.id,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Assign user to deal
      const { error: assignmentError } = await supabase
        .from('user_deals')
        .insert({
          user_id: newProfile.id,
          deal_id: dealId,
          assigned_by: user.id,
          role_in_deal: 'participant'
        });

      if (assignmentError) throw assignmentError;

      // Send invitation email (placeholder function)
      try {
        await supabase.rpc('send_user_invitation', {
          user_email: validatedEmail.sanitized,
          user_name: validatedName.sanitized,
          deal_id: dealId,
          deal_name: dealName,
          invited_by_email: user.email || ''
        });
      } catch (emailError) {
        console.warn('Email invitation failed:', emailError);
      }

      // Log the user creation and assignment
      await auditLogger.logEvent('user_create_and_assign', {
        action: 'create_and_assign_user',
        resource_id: dealId,
        resource_type: 'deal',
        new_user_email: validatedEmail.sanitized,
        deal_name: dealName
      });

      toast({
        title: "User Created and Assigned",
        description: `${validatedName.sanitized} has been created and assigned to ${dealName}. An invitation email will be sent.`,
      });

      form.reset();
      loadExistingUsers();
      
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }

    } catch (error) {
      console.error('Error creating and assigning user:', error);
      toast({
        title: "Error",
        description: "Failed to create and assign user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline">
      <Users className="h-4 w-4 mr-2" />
      Manage Users
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Manage Users for {dealName}</span>
          </DialogTitle>
          <DialogDescription>
            Assign existing users or create new seller/affiliate users for this deal.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Assign Existing Users</TabsTrigger>
            <TabsTrigger value="new">Create New User</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Selected Users ({selectedUsers.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(userId => {
                    const user = existingUsers.find(u => u.id === userId);
                    return user ? (
                      <Badge key={userId} variant="secondary" className="cursor-pointer" onClick={() => handleUserToggle(userId)}>
                        {user.name} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
                <Button onClick={handleAssignExistingUsers} disabled={isSubmitting}>
                  Assign Selected Users
                </Button>
              </div>
            )}

            {/* Unassigned Users */}
            <div className="space-y-2">
              <h4 className="font-medium">Available Users</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {unassignedUsers.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50 ${
                      selectedUsers.includes(user.id) ? 'bg-muted border-primary' : ''
                    }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{user.role}</Badge>
                      {user.organization && (
                        <p className="text-xs text-muted-foreground">{user.organization}</p>
                      )}
                    </div>
                  </div>
                ))}
                {unassignedUsers.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No unassigned users found</p>
                )}
              </div>
            </div>

            {/* Assigned Users */}
            {assignedUsers.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Already Assigned ({assignedUsers.length})</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {assignedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded bg-muted/30">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="default">Assigned</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitNewUser)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="e.g., john.smith@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="seller">Seller</SelectItem>
                          <SelectItem value="seller_legal">Seller Legal</SelectItem>
                          <SelectItem value="seller_financial">Seller Financial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                  <div className="flex items-start space-x-2">
                    <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Email Invitation</p>
                      <p>An invitation email will be sent to the user with deal access details and account setup instructions.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create & Assign User'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};