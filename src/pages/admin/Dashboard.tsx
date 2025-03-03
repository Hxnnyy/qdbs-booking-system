
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, BarChart, Users, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalBarbers: 0,
    totalServices: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get total bookings count
        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true });
        
        // Get today's bookings count
        const { count: todayBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('booking_date', today);
        
        // Get barbers count
        const { count: totalBarbers } = await supabase
          .from('barbers')
          .select('*', { count: 'exact', head: true })
          .eq('active', true);
        
        // Get services count
        const { count: totalServices } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('active', true);

        setStats({
          totalBookings: totalBookings || 0,
          todayBookings: todayBookings || 0,
          totalBarbers: totalBarbers || 0,
          totalServices: totalServices || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 font-playfair">Admin Dashboard</h1>
          <p className="text-muted-foreground font-playfair">
            Manage your barbershop operations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-burgundy mr-2" />
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart className="h-5 w-5 text-burgundy mr-2" />
                <div className="text-2xl font-bold">{stats.todayBookings}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Barbers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-burgundy mr-2" />
                <div className="text-2xl font-bold">{stats.totalBarbers}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Services Offered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Scissors className="h-5 w-5 text-burgundy mr-2" />
                <div className="text-2xl font-bold">{stats.totalServices}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-playfair">Quick Actions</CardTitle>
              <CardDescription className="font-playfair">
                Manage your barbershop resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/admin/bookings" className="block p-4 border rounded-md hover:bg-secondary/50 transition-colors">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-burgundy mr-3" />
                  <div>
                    <h3 className="font-medium">Manage Bookings</h3>
                    <p className="text-sm text-muted-foreground">View and edit appointments</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/admin/barbers" className="block p-4 border rounded-md hover:bg-secondary/50 transition-colors">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-burgundy mr-3" />
                  <div>
                    <h3 className="font-medium">Manage Barbers</h3>
                    <p className="text-sm text-muted-foreground">Add or edit barber profiles</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/admin/services" className="block p-4 border rounded-md hover:bg-secondary/50 transition-colors">
                <div className="flex items-center">
                  <Scissors className="h-5 w-5 text-burgundy mr-3" />
                  <div>
                    <h3 className="font-medium">Manage Services</h3>
                    <p className="text-sm text-muted-foreground">Update service offerings</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-playfair">Overview</CardTitle>
              <CardDescription className="font-playfair">
                Your barbershop at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Welcome to the Queens Dock Barbershop admin dashboard. Here you can manage all aspects of your barbershop operations.
              </p>
              <p className="text-muted-foreground">
                Use the quick links to access the most common tasks, or navigate using the sidebar for more options.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
