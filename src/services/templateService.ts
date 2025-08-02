
import { supabase } from '@/integrations/supabase/client';

export interface TemplateItem {
  title: string;
  description: string | null;
  category: string;
  priority: 'high' | 'medium' | 'low';
  typical_period: string | null;
  allow_file_upload: boolean;
  allow_text_response: boolean;
}

export const templateService = {
  async getTemplateItems(): Promise<TemplateItem[]> {
    const { data, error } = await supabase
      .from('request_templates')
      .select('title, description, category, priority, typical_period, allow_file_upload, allow_text_response')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching template items:', error);
      throw error;
    }

    return data || [];
  },

  async hasTemplateBeenApplied(dealId: string): Promise<boolean> {
    // Check if there's a record in deal_template_applications
    const { data: applicationData, error: appError } = await supabase
      .from('deal_template_applications')
      .select('id')
      .eq('deal_id', dealId)
      .limit(1);

    if (appError) {
      console.error('Error checking template application:', appError);
    }

    if (applicationData && applicationData.length > 0) {
      return true;
    }

    // Fallback: check if deal has any requests that match template titles
    const templates = await this.getTemplateItems();
    if (templates.length === 0) return false;

    const templateTitles = templates.map(t => t.title);
    const { data: requestData, error: reqError } = await supabase
      .from('diligence_requests')
      .select('id')
      .eq('deal_id', dealId)
      .in('title', templateTitles)
      .limit(1);

    if (reqError) {
      console.error('Error checking existing template requests:', reqError);
      return false;
    }

    return (requestData?.length || 0) > 0;
  },

  async getExistingRequestTitles(dealId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('diligence_requests')
      .select('title')
      .eq('deal_id', dealId);

    if (error) {
      console.error('Error fetching existing requests:', error);
      return [];
    }

    return data?.map(req => req.title) || [];
  },

  async applyTemplateToDeal(dealId: string, createdBy: string, options: { 
    forceRefresh?: boolean;
    onlyMissing?: boolean;
  } = {}): Promise<{ created: number; skipped: number; duplicatesFound?: number }> {
    const templates = await this.getTemplateItems();
    
    if (templates.length === 0) {
      console.log('No template items found, skipping template application');
      return { created: 0, skipped: 0 };
    }

    console.log(`Starting template application for deal ${dealId}. Templates available: ${templates.length}, forceRefresh: ${options.forceRefresh}`);

    // Always check existing requests to understand current state
    const existingTitles = await this.getExistingRequestTitles(dealId);
    const existingTitlesSet = new Set(existingTitles);
    
    console.log(`Found ${existingTitles.length} existing requests for deal ${dealId}`);

    if (options.forceRefresh) {
      console.log('Force refresh mode: will delete existing template requests and recreate all');
      
      // Delete existing template requests to avoid constraint violations
      const { error: deleteError } = await supabase
        .from('diligence_requests')
        .delete()
        .eq('deal_id', dealId)
        .in('title', templates.map(t => t.title));

      if (deleteError) {
        console.error('Error deleting existing template requests:', deleteError);
        throw deleteError;
      }

      // Create all template requests
      const requests = templates.map(template => ({
        deal_id: dealId,
        created_by: createdBy,
        title: template.title,
        description: template.description,
        category: template.category,
        priority: template.priority,
        period_text: template.typical_period,
        allow_file_upload: template.allow_file_upload,
        allow_text_response: template.allow_text_response,
        status: 'pending' as const
      }));

      const { error: insertError } = await supabase
        .from('diligence_requests')
        .insert(requests);

      if (insertError) {
        console.error('Error inserting template requests:', insertError);
        throw insertError;
      }

      console.log(`Force refresh completed: recreated ${requests.length} template requests`);
      return { created: requests.length, skipped: 0 };
    } else {
      // Normal mode: only create missing requests
      const missingTemplates = templates.filter(template => !existingTitlesSet.has(template.title));
      
      console.log(`Found ${missingTemplates.length} missing template requests out of ${templates.length} total templates`);

      if (missingTemplates.length === 0) {
        console.log(`All template items already exist for deal ${dealId}`);
        return { created: 0, skipped: templates.length };
      }

      const requests = missingTemplates.map(template => ({
        deal_id: dealId,
        created_by: createdBy,
        title: template.title,
        description: template.description,
        category: template.category,
        priority: template.priority,
        period_text: template.typical_period,
        allow_file_upload: template.allow_file_upload,
        allow_text_response: template.allow_text_response,
        status: 'pending' as const
      }));

      const { error: insertError } = await supabase
        .from('diligence_requests')
        .insert(requests);

      if (insertError) {
        // Handle unique constraint violations gracefully
        if (insertError.code === '23505') {
          console.log('Duplicate request titles detected, skipping duplicates');
          return { created: 0, skipped: requests.length, duplicatesFound: requests.length };
        }
        console.error('Error inserting template requests:', insertError);
        throw insertError;
      }

      console.log(`Created ${requests.length} new template requests, skipped ${existingTitles.length} existing ones`);
      return { created: requests.length, skipped: existingTitles.length };
    }
  },

  async cleanupDuplicateRequests(dealId: string): Promise<{ cleaned: number }> {
    console.log(`Starting duplicate cleanup for deal ${dealId}`);
    
    // Find and count duplicates before cleanup
    const { data: duplicates, error: findError } = await supabase
      .from('diligence_requests')
      .select('id, title, created_at')
      .eq('deal_id', dealId)
      .order('title')
      .order('created_at', { ascending: false });

    if (findError) {
      console.error('Error finding duplicates:', findError);
      throw findError;
    }

    // Group by title and identify duplicates to remove
    const titleGroups = duplicates?.reduce((acc, req) => {
      if (!acc[req.title]) acc[req.title] = [];
      acc[req.title].push(req);
      return acc;
    }, {} as Record<string, any[]>) || {};

    const duplicateIds: string[] = [];
    Object.values(titleGroups).forEach(group => {
      if (group.length > 1) {
        // Keep the first (most recent) and mark others for deletion
        duplicateIds.push(...group.slice(1).map(req => req.id));
      }
    });

    if (duplicateIds.length === 0) {
      console.log('No duplicates found');
      return { cleaned: 0 };
    }

    console.log(`Found ${duplicateIds.length} duplicate requests to clean up`);

    // Delete duplicates
    const { error: deleteError } = await supabase
      .from('diligence_requests')
      .delete()
      .in('id', duplicateIds);

    if (deleteError) {
      console.error('Error cleaning up duplicates:', deleteError);
      throw deleteError;
    }

    console.log(`Successfully cleaned up ${duplicateIds.length} duplicate requests`);
    return { cleaned: duplicateIds.length };
  },

  async getTemplateCount(): Promise<number> {
    const { count, error } = await supabase
      .from('request_templates')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting template count:', error);
      return 0;
    }

    return count || 0;
  }
};
