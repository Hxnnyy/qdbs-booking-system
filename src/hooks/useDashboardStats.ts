
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface BookingsByBarber {
  barber_id: string;
  barber_name: string;
  barber_color: string;
  count: number;
}

interface DashboardStats {
  totalMonthlyBookings: number;
  bookingChangePercent: number;
  averageBookingValue: number;
  monthlyRevenue: number;
  bookings: any[];
  recentBookings: any[];
  barberBookings: BookingsByBarber[];
  isLoading: boolean;
  error: string | null;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMonthlyBookings: 0,
    bookingChangePercent: 0,
    averageBookingValue: 0,
    monthlyRevenue: 0,
    bookings: [],
    recentBookings: [],
    barberBookings: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, isLoading: true }));
        
        // Current date and start/end of current and previous month
        const now = new Date();
        const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
        const currentMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
        const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
        const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
        const today = format(now, 'yyyy-MM-dd');
        
        // Fetch all active barbers first
        const { data: activeBarbers, error: barbersError } = await supabase
          .from('barbers')
          .select('id, name, color')
          .eq('active', true)
          .order('name');
          
        if (barbersError) throw barbersError;
        
        // Fetch all bookings for calculations
        const { data: allBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            barber:barber_id(name, color),
            service:service_id(name, price, duration)
          `)
          .order('booking_date', { ascending: false });
        
        if (bookingsError) throw bookingsError;
        
        // Filter bookings for different stats
        const upcomingBookings = allBookings
          ? allBookings.filter(b => 
              b.booking_date >= today && 
              b.status !== 'cancelled')
          : [];
          
        const currentMonthBookings = allBookings
          ? allBookings.filter(b => 
              b.booking_date >= currentMonthStart && 
              b.booking_date <= currentMonthEnd && 
              b.status !== 'cancelled')
          : [];
          
        const lastMonthBookings = allBookings
          ? allBookings.filter(b => 
              b.booking_date >= lastMonthStart && 
              b.booking_date <= lastMonthEnd && 
              b.status !== 'cancelled')
          : [];
        
        // Fix: Use all non-cancelled bookings for average calculation instead of just completed
        const validBookings = allBookings
          ? allBookings.filter(b => b.status !== 'cancelled')
          : [];
        
        // Calculate stats
        const totalMonthlyBookings = currentMonthBookings.length;
        
        // Calculate booking percentage change
        const lastMonthCount = lastMonthBookings.length;
        const currentMonthCount = currentMonthBookings.length;
        const bookingChangePercent = lastMonthCount > 0 
          ? Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100) 
          : 0;
        
        // Fix: Calculate average booking value based on all valid bookings
        const totalBookingValue = validBookings.reduce((total, booking) => {
          return total + (booking.service?.price || 0);
        }, 0);
        
        const averageBookingValue = validBookings.length > 0 
          ? totalBookingValue / validBookings.length 
          : 0;
        
        // Calculate this month's revenue
        const monthlyRevenue = currentMonthBookings.reduce((total, booking) => {
          return total + (booking.service?.price || 0);
        }, 0);
        
        // Group bookings by date for chart
        const bookingsByDate = allBookings?.reduce((acc: any, booking: any) => {
          const date = booking.booking_date;
          if (!acc[date]) {
            acc[date] = { date, count: 0, revenue: 0 };
          }
          acc[date].count += 1;
          acc[date].revenue += booking.service?.price || 0;
          return acc;
        }, {}) || {};

        const chartData = Object.values(bookingsByDate);
        
        // Get 5 most recent upcoming bookings for display
        const recentUpcomingBookings = upcomingBookings.slice(0, 5);

        // Calculate bookings per barber
        const barberBookings: BookingsByBarber[] = [];
        
        // Initialize counts for all active barbers (even those with zero bookings)
        activeBarbers?.forEach(barber => {
          const barberMonthlyBookings = currentMonthBookings.filter(
            booking => booking.barber_id === barber.id
          ).length;
          
          barberBookings.push({
            barber_id: barber.id,
            barber_name: barber.name,
            barber_color: barber.color || '#3B82F6',
            count: barberMonthlyBookings
          });
        });
        
        // Sort by count descending
        barberBookings.sort((a, b) => b.count - a.count);

        setStats({
          totalMonthlyBookings,
          bookingChangePercent,
          averageBookingValue,
          monthlyRevenue,
          bookings: chartData,
          recentBookings: recentUpcomingBookings,
          barberBookings,
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
