import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  duration_hours: number;
}

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('base_price', { ascending: true });

      if (error) {
        throw error;
      }

      return data as Service[];
    },
  });
};