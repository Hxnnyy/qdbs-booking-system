
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  users: number;
  barbers: number;
  services: number;
  revenue: number;
  bookings: any[];
  recentBookings: any[];
  isLoading: boolean;
  error: string | null;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    barbers: 0,
    services: 0,
    revenue: 0,
    bookings: [],
    recentBookings: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total users
        // @ts-ignore - Supabase types issue
        const { count: userCount, error: userError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' });

        if (userError) throw userError;

        // Fetch active barbers
        // @ts-ignore - Supabase types issue
        const { count: barberCount, error: barberError } = await supabase
          .from('barbers')
          .select('*', { count: 'exact' })
          .eq('active', true);

        if (barberError) throw barberError;

        // Fetch active services
        // @ts-ignore - Supabase types issue
        const { count: serviceCount, error: serviceError } = await supabase
          .from('services')
          .select('*', { count: 'exact' })
          .eq('active', true);

        if (serviceError) throw serviceError;

        // Fetch completed bookings for revenue calculation
        // @ts-ignore - Supabase types issue
        const { data: bookings, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            service:service_id(price)
          `)
          .eq('status', 'completed');

        if (bookingError) throw bookingError;

        // Type assertion for bookings to handle service access
        const typedBookings = bookings as any[];
        
        const totalRevenue = typedBookings?.reduce((total: number, booking: any) => {
          return total + (booking.service?.price || 0);
        }, 0) || 0;

        // Group bookings by date for chart
        const bookingsByDate = typedBookings?.reduce((acc: any, booking: any) => {
          const date = booking.booking_date;
          if (!acc[date]) {
            acc[date] = { date, count: 0, revenue: 0 };
          }
          acc[date].count += 1;
          acc[date].revenue += booking.service?.price || 0;
          return acc;
        }, {}) || {};

        const chartData = Object.values(bookingsByDate);

        setStats({
          users: userCount || 0,
          barbers: barberCount || 0,
          services: serviceCount || 0,
          revenue: totalRevenue,
          bookings: chartData,
          recentBookings: typedBookings?.slice(0, 5) || [],
          isLoading: false,
          error: null
        });
      } catch (error: any) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, isLoading: false, error: error.message }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
