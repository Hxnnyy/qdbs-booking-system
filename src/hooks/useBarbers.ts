
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Barber, InsertableBarber, UpdatableBarber } from '@/supabase-types';

export type { Barber };

export const useBarbers = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBarbers = async (includeInactive = true) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('barbers')
        .select('*');
      
      // If we don't want inactive barbers, filter them out
      if (!includeInactive) {
        query = query.eq('active', true);
      }

      // @ts-ignore - Supabase types issue
      const { data, error } = await query.order('active', { ascending: false })
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

  const reactivateBarber = async (barberId: string) => {
    try {
      setIsLoading(true);
      
      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('barbers')
        .update({ active: true })
        .eq('id', barberId);
      
      if (error) throw error;
      
      await fetchBarbers();
      return true;
    } catch (err: any) {
      console.error('Error reactivating barber:', err.message);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBarber = async (barberId: string) => {
    try {
      setIsLoading(true);
      
      // Delete all bookings for this barber first
      // @ts-ignore - Supabase types issue
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('barber_id', barberId);
      
      if (bookingsError) throw bookingsError;
      
      // Then delete the barber (this will also delete lunch breaks due to CASCADE)
      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', barberId);
      
      if (error) throw error;
      
      await fetchBarbers();
      return true;
    } catch (err: any) {
      console.error('Error deleting barber:', err.message);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbers();

    // Set up real-time subscription for barber status changes
    const channel = supabase
      .channel('barber-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'barbers'
        },
        (payload) => {
          console.log('Barber status changed:', payload);
          fetchBarbers();
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    barbers, 
    isLoading, 
    error, 
    refreshBarbers: fetchBarbers,
    reactivateBarber,
    deleteBarber
  };
};
