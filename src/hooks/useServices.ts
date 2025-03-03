
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceType } from '@/types/supabase';

export type Service = ServiceType;

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Using 'any' to bypass TypeScript errors with Supabase client
      const { data, error } = await supabase
        .from('services' as any)
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      setServices(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching services:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return { services, isLoading, error, refreshServices: fetchServices };
};
