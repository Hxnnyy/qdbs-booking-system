
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarberType } from '@/types/supabase';

export type Barber = BarberType;

export const useBarbers = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBarbers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Using type assertion to bypass TypeScript errors
      const { data, error } = await (supabase
        .from('barbers')
        .select('*')
        .eq('active', true)
        .order('name') as any);

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
