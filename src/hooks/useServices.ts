
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service, InsertableService, UpdatableService } from '@/supabase-types';

export type { Service };

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('services')
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
