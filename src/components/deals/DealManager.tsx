
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { templateService } from '@/services/templateService';

const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  company_name: z.string().min(1, 'Company name is required'),
  project_name: z.string().min(1, 'Project name is required'),
  target_close_date: z.date().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealManagerProps {
  onDealCreated?: () => void;
}

export const DealManager = ({ onDealCreated }: DealManagerProps) => {
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
    // Load template count to show user what will be applied
    templateService.getTemplateCount().then(setTemplateCount);
  }, []);

  const onSubmit = async (values: DealFormValues) => {
    try {
      setIsSubmitting(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the deal
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert([{
          ...values,
          created_by: user.id,
          target_close_date: values.target_close_date?.toISOString().split('T')[0] || null,
        }])
        .select()
        .single();

      if (dealError) throw dealError;

      // Apply master template to the new deal
      try {
        await templateService.applyTemplateToDeal(deal.id, user.id);
        
        toast({
          title: "Deal Created Successfully",
          description: templateCount && templateCount > 0 
            ? `Deal created with ${templateCount} template requests applied automatically`
            : "Deal created successfully",
        });
      } catch (templateError) {
        console.error('Error applying template:', templateError);
        toast({
          title: "Deal Created",
          description: "Deal created, but there was an issue applying the master template. You can add requests manually.",
          variant: "destructive",
        });
      }

      // Reset form
      form.reset();
      
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Create New Deal</span>
        </CardTitle>
        <CardDescription>
          Create a new deal/project. 
          {templateCount !== null && templateCount > 0 && (
            <span className="text-green-600 font-medium">
              {' '}({templateCount} template requests will be applied automatically)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter deal name" {...field} />
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
                    <Input placeholder="Enter company name" {...field} />
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
                    <Input placeholder="Enter project name" {...field} />
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
                  <FormLabel>Target Close Date</FormLabel>
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
                            <span>Pick a date</span>
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
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Optional target date for closing this deal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating Deal...' : 'Create Deal'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
