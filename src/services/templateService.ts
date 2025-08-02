
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
    const { data, error } = await supabase
      .from('deal_template_applications')
      .select('id')
      .eq('deal_id', dealId)
      .limit(1);

    if (error) {
      console.error('Error checking template application:', error);
      return false;
    }

    return (data?.length || 0) > 0;
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
  } = {}): Promise<{ created: number; skipped: number }> {
    const templates = await this.getTemplateItems();
    
    if (templates.length === 0) {
      console.log('No template items found, skipping template application');
      return { created: 0, skipped: 0 };
    }

    console.log(`Starting template application for deal ${dealId}. Templates available: ${templates.length}, forceRefresh: ${options.forceRefresh}`);

    let requestsToCreate = templates;
    let skippedCount = 0;

    // Always check existing requests to avoid duplicates, unless explicitly forcing refresh
    const existingTitles = await this.getExistingRequestTitles(dealId);
    const existingTitlesSet = new Set(existingTitles);
    
    console.log(`Found ${existingTitles.length} existing requests:`, existingTitles);
    
    if (options.forceRefresh) {
      // For force refresh, we still want to avoid creating exact duplicates
      console.log('Force refresh mode: will recreate template requests');
    } else {
      // For normal mode, only create missing requests
      requestsToCreate = templates.filter(template => {
        const exists = existingTitlesSet.has(template.title);
        if (exists) skippedCount++;
        return !exists;
      });

      console.log(`Filtered to ${requestsToCreate.length} new requests to create, skipping ${skippedCount} existing ones`);

      if (requestsToCreate.length === 0) {
        console.log(`All ${templates.length} template items already exist for deal ${dealId}`);
        return { created: 0, skipped: skippedCount };
      }
    }

    const requests = requestsToCreate.map(template => ({
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

    const { error } = await supabase
      .from('diligence_requests')
      .insert(requests);

    if (error) {
      console.error('Error applying template to deal:', error);
      throw error;
    }

    // Record the template application
    const { error: appError } = await supabase
      .from('deal_template_applications')
      .insert({
        deal_id: dealId,
        applied_by: createdBy,
        notes: options.forceRefresh ? 'Force refresh' : 'Initial application'
      });

    if (appError) {
      console.error('Error recording template application:', appError);
      // Don't throw here as the main operation succeeded
    }

    console.log(`Applied ${requests.length} template items to deal ${dealId}, skipped ${skippedCount}`);
    return { created: requests.length, skipped: skippedCount };
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
