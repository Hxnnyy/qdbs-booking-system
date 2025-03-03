import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
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

  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          
          {stats.isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : stats.error ? (
            <div className="bg-red-50 p-4 rounded border border-red-200 text-red-600">
              {stats.error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.users}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Barbers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.barbers}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Available Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.services}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">£{stats.revenue.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Bookings Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {stats.bookings.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.bookings}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" name="Bookings" />
                          <Bar dataKey="revenue" fill="#82ca9d" name="Revenue (£)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No bookings data available.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentBookings.length > 0 ? (
                    <div className="space-y-2">
                      {stats.recentBookings.map((booking: any) => (
                        <div key={booking.id} className="border-b pb-2 last:border-0">
                          <p className="font-medium">
                            {booking.service?.name} - £{booking.service?.price?.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(booking.booking_date), 'PP')} at {booking.booking_time}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      No recent bookings available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default Dashboard;
