import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  duration_hours: number;
}

export interface Cleaner {
  id: string;
  user_id: string;
  hourly_rate: number;
  bio: string;
  experience_years: number;
  available: boolean;
  rating: number;
  total_jobs: number;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
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

export const useAvailableCleaners = () => {
  return useQuery({
    queryKey: ['available-cleaners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cleaners')
        .select(`
          *,
          profiles!inner(display_name, avatar_url)
        `)
        .eq('available', true)
        .order('hourly_rate', { ascending: true });

      if (error) {
        throw error;
      }

      return data as any[]; // We'll handle typing in the component
    },
  });
};