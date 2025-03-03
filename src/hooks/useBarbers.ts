
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Barber = {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
  image_url?: string;
  active: boolean;
};

export const useBarbers = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBarbers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('active', true)
        .order('name') as { data: Barber[] | null; error: any };

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
