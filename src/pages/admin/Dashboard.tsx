import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { UserIcon, CalendarDays, Scissors, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface RevenueData {
  date: string;
  revenue: number;
}

interface BookingWithService {
  booking_date: string;
  service: {
    price: number;
  };
}

const Dashboard = () => {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [barberCount, setBarberCount] = useState<number | null>(null);
  const [serviceCount, setServiceCount] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch total users
        const { count: userCount, error: userError } = await (supabase
          .from('profiles') as any)
          .select('*', { count: 'exact' });
        
        if (userError) throw userError;
        
        // Fetch total barbers
        const { count: barberCount, error: barberError } = await (supabase
          .from('barbers') as any)
          .select('*', { count: 'exact' })
          .eq('active', true);
        
        if (barberError) throw barberError;
        
        // Fetch total services
        const { count: serviceCount, error: serviceError } = await (supabase
          .from('services') as any)
          .select('*', { count: 'exact' })
          .eq('active', true);
        
        if (serviceError) throw serviceError;
        
        // Fetch bookings for revenue calculation
        const { data: bookings, error: bookingError } = await (supabase
          .from('bookings') as any)
          .select(`
            *,
            service:service_id(price)
          `)
          .eq('status', 'completed');
        
        if (bookingError) throw bookingError;
        
        // Calculate total revenue
        const calculatedRevenue = (bookings as BookingWithService[] || []).reduce((acc, booking) => {
          return acc + (booking.service?.price || 0);
        }, 0);
        
        // Prepare revenue data for the chart (last 30 days)
        const today = new Date();
        const last30Days = Array.from({ length: 30 }, (_, i) => subDays(today, i));
        
        const dailyRevenue: { [key: string]: number } = {};
        (bookings as BookingWithService[] || []).forEach(booking => {
          const bookingDate = format(new Date(booking.booking_date), 'yyyy-MM-dd');
          dailyRevenue[bookingDate] = (dailyRevenue[bookingDate] || 0) + (booking.service?.price || 0);
        });
        
        const chartData: RevenueData[] = last30Days.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          return {
            date: dateStr,
            revenue: dailyRevenue[dateStr] || 0,
          };
        }).reverse();
        
        setUserCount(userCount);
        setBarberCount(barberCount);
        setServiceCount(serviceCount);
        setTotalRevenue(calculatedRevenue);
        setRevenueData(chartData);
        
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <p className="text-red-500">Error: {error}</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 font-playfair">Dashboard</h1>
        <p className="text-muted-foreground font-playfair">Overview of your barbershop</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 mr-2" /> Total Users
              </CardTitle>
              <CardDescription>All registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-4 w-4 mr-2" /> Active Barbers
              </CardTitle>
              <CardDescription>Currently active barbers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{barberCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 mr-2" /> Services Offered
              </CardTitle>
              <CardDescription>Total services available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 mr-2" /> Total Revenue
              </CardTitle>
              <CardDescription>Revenue from completed bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Last 30 Days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
