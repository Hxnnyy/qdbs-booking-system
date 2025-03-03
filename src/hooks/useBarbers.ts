
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

      // @ts-ignore - Suppressing TypeScript errors for Supabase query
      const { data, error } = await supabase
        .from('barbers')
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
