
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { Spinner } from '@/components/ui/spinner';
import { StatsCard } from '@/components/admin/StatsCard';
import { BookingsChart } from '@/components/admin/BookingsChart';
import { RecentBookings } from '@/components/admin/RecentBookings';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const Dashboard = () => {
  const stats = useDashboardStats();

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
                <StatsCard 
                  title="This Month's Bookings" 
                  value={stats.totalMonthlyBookings} 
                  icon="bookings"
                  change={stats.bookingChangePercent}
                />
                <StatsCard 
                  title="Booking Change" 
                  value={`${stats.bookingChangePercent > 0 ? '+' : ''}${stats.bookingChangePercent}%`} 
                  icon="trending"
                />
                <StatsCard 
                  title="Average Booking Value" 
                  value={`£${stats.averageBookingValue.toFixed(2)}`} 
                  icon="revenue"
                />
                <StatsCard 
                  title="This Month's Revenue" 
                  value={`£${stats.monthlyRevenue.toFixed(2)}`} 
                  icon="revenue"
                />
              </div>
              
              <BookingsChart data={stats.bookings} />
              <RecentBookings bookings={stats.recentBookings} />
            </>
          )}
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default Dashboard;
