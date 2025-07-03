
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

  async applyTemplateToDeal(dealId: string, createdBy: string): Promise<void> {
    const templates = await this.getTemplateItems();
    
    if (templates.length === 0) {
      console.log('No template items found, skipping template application');
      return;
    }

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

    const { error } = await supabase
      .from('diligence_requests')
      .insert(requests);

    if (error) {
      console.error('Error applying template to deal:', error);
      throw error;
    }

    console.log(`Applied ${requests.length} template items to deal ${dealId}`);
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
