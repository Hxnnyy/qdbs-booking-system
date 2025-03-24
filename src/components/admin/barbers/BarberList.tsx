
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { BarberCard } from './BarberCard';
import { useBarberManagement } from '@/hooks/useBarberManagement';

export const BarberList = () => {
  const { 
    barbers,
    isLoading,
    error
  } = useBarberManagement();

  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Manage Barbers</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {barbers.map(barber => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        </div>
      </AdminLayout>
    </Layout>
  );
};
