
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Deal {
  id: string;
  name: string;
  company_name: string;
  project_name: string;
  created_at: string;
}

export const useDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDeals(data || []);
      } catch (error) {
        console.error('Error loading deals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDeals();
  }, []);

  return { deals, loading };
};
