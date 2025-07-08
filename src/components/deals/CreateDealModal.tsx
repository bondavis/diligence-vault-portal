import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { templateService } from '@/services/templateService';
import { auditLogger } from '@/utils/auditLogger';

const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  company_name: z.string().min(1, 'Company name is required'),
  project_name: z.string().min(1, 'Project name is required'),
  target_close_date: z.date({
    required_error: 'Target close date is required'
  }).refine((date) => date > new Date(), {
    message: 'Target close date must be in the future'
  }),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface CreateDealModalProps {
  onDealCreated?: () => void;
  trigger?: React.ReactNode;
}

export const CreateDealModal = ({ onDealCreated, trigger }: CreateDealModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateCount, setTemplateCount] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: '',
      company_name: '',
      project_name: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      // Load template count when modal opens
      templateService.getTemplateCount().then(setTemplateCount);
    }
  }, [isOpen]);

  const onSubmit = async (values: DealFormValues) => {
    try {
      setIsSubmitting(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the deal
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert({
          name: values.name,
          company_name: values.company_name,
          project_name: values.project_name,
          created_by: user.id,
          target_close_date: values.target_close_date.toISOString().split('T')[0],
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Log deal creation
      await auditLogger.logEvent('deal_create', {
        action: 'create_deal',
        resource_id: deal.id,
        resource_type: 'deal',
        deal_name: deal.name,
        company_name: deal.company_name
      });

      // Apply master template to the new deal
      try {
        await templateService.applyTemplateToDeal(deal.id, user.id);
        
        toast({
          title: "Deal Created Successfully",
          description: templateCount && templateCount > 0 
            ? `Deal "${deal.name}" created with ${templateCount} template requests applied automatically`
            : `Deal "${deal.name}" created successfully`,
        });
      } catch (templateError) {
        console.error('Error applying template:', templateError);
        toast({
          title: "Deal Created",
          description: `Deal "${deal.name}" created, but there was an issue applying the master template. You can add requests manually.`,
          variant: "destructive",
        });
      }

      // Reset form and close modal
      form.reset();
      setIsOpen(false);
      
      // Notify parent component
      if (onDealCreated) {
        onDealCreated();
      }

    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button size="lg" className="bg-bb-red hover:bg-bb-red/90">
      <Plus className="h-5 w-5 mr-2" />
      Create New Deal
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create New Deal</span>
          </DialogTitle>
          <DialogDescription>
            Create a new M&A deal with all necessary details. Template requests will be applied automatically.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., TechCorp Acquisition" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., TechCorp Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Project Acquisition 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_close_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Target Close Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Select target close date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date <= new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The expected closing date for this deal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {templateCount !== null && templateCount > 0 && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-800">
                  <strong>{templateCount}</strong> template requests will be automatically applied to this deal.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Deal...' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};