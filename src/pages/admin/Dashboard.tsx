
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalBarbers: 0,
    totalServices: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardStats();
    }
  }, [isAdmin]);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      // Using type assertion for all queries
      // Fetch bookings count
      const { count: totalBookings, error: bookingsError } = await (supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true }) as any);
      
      // Fetch confirmed bookings count
      const { count: confirmedBookings, error: confirmedError } = await (supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed') as any);
      
      // Fetch cancelled bookings count
      const { count: cancelledBookings, error: cancelledError } = await (supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled') as any);
      
      // Fetch barbers count
      const { count: totalBarbers, error: barbersError } = await (supabase
        .from('barbers')
        .select('*', { count: 'exact', head: true }) as any);
      
      // Fetch services count
      const { count: totalServices, error: servicesError } = await (supabase
        .from('services')
        .select('*', { count: 'exact', head: true }) as any);
      
      if (bookingsError || confirmedError || cancelledError || barbersError || servicesError) {
        throw new Error('Error fetching dashboard stats');
      }
      
      setStats({
        totalBookings: totalBookings || 0,
        confirmedBookings: confirmedBookings || 0,
        cancelledBookings: cancelledBookings || 0,
        totalBarbers: totalBarbers || 0,
        totalServices: totalServices || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-12 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8 font-playfair">Admin Dashboard</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-12 h-12" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass shadow-subtle border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-burgundy">{stats.totalBookings}</div>
              </CardContent>
            </Card>
            
            <Card className="glass shadow-subtle border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Active Barbers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-burgundy">{stats.totalBarbers}</div>
              </CardContent>
            </Card>
            
            <Card className="glass shadow-subtle border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Available Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-burgundy">{stats.totalServices}</div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs defaultValue="navigation" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="navigation">Quick Navigation</TabsTrigger>
            <TabsTrigger value="bookingStats">Booking Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="navigation">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass shadow-subtle border border-border hover:border-burgundy transition-all cursor-pointer" onClick={() => window.location.href = '/admin/bookings'}>
                <CardHeader>
                  <CardTitle>Manage Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">View and manage all customer bookings</p>
                </CardContent>
              </Card>
              
              <Card className="glass shadow-subtle border border-border hover:border-burgundy transition-all cursor-pointer" onClick={() => window.location.href = '/admin/barbers'}>
                <CardHeader>
                  <CardTitle>Manage Barbers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Add, edit or remove barbers</p>
                </CardContent>
              </Card>
              
              <Card className="glass shadow-subtle border border-border hover:border-burgundy transition-all cursor-pointer" onClick={() => window.location.href = '/admin/services'}>
                <CardHeader>
                  <CardTitle>Manage Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Add, edit or remove services</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="bookingStats">
            <Card className="glass shadow-subtle border border-border">
              <CardHeader>
                <CardTitle>Booking Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Status Breakdown</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Confirmed</span>
                          <span>{stats.confirmedBookings} ({calculatePercentage(stats.confirmedBookings, stats.totalBookings)}%)</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500 h-full"
                            style={{ width: `${calculatePercentage(stats.confirmedBookings, stats.totalBookings)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Cancelled</span>
                          <span>{stats.cancelledBookings} ({calculatePercentage(stats.cancelledBookings, stats.totalBookings)}%)</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-red-500 h-full"
                            style={{ width: `${calculatePercentage(stats.cancelledBookings, stats.totalBookings)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Helper function to calculate percentage
const calculatePercentage = (value: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export default Dashboard;
