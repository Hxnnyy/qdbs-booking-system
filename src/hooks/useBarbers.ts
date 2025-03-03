
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Barber, InsertableBarber, UpdatableBarber } from '@/supabase-types';

export type { Barber };

export const useBarbers = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBarbers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Type assertion to avoid TypeScript errors with Supabase queries
      const { data, error } = await (supabase
        .from('barbers') as any)
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      setBarbers(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching barbers:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  return { barbers, isLoading, error, refreshBarbers: fetchBarbers };
};
