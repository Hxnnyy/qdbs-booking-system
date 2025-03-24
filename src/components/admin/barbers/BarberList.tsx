
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { BarberCard } from './BarberCard';
import { useBarberManagement } from '@/hooks/useBarberManagement';
import { toast } from 'sonner';

export const BarberList = () => {
  const { 
    barbers,
    isLoading,
    error
  } = useBarberManagement();

  // Create placeholder handlers for the required props
  const handleEdit = (barber) => {
    toast.info(`Edit ${barber.name} functionality not implemented yet`);
  };
  
  const handleServices = (barber) => {
    toast.info(`Manage services for ${barber.name} not implemented yet`);
  };
  
  const handleHours = (barber) => {
    toast.info(`Manage hours for ${barber.name} not implemented yet`);
  };
  
  const handleLunch = (barber) => {
    toast.info(`Manage lunch for ${barber.name} not implemented yet`);
  };
  
  const handleColor = (barber) => {
    toast.info(`Change color for ${barber.name} not implemented yet`);
  };
  
  const handleHoliday = (barber) => {
    toast.info(`Manage holidays for ${barber.name} not implemented yet`);
  };
  
  const handleDeactivate = (barber) => {
    toast.info(`Deactivate ${barber.name} not implemented yet`);
  };
  
  const handleReactivate = (barber) => {
    toast.info(`Reactivate ${barber.name} not implemented yet`);
  };
  
  const handleDelete = (barber) => {
    toast.info(`Delete ${barber.name} not implemented yet`);
  };

  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Manage Barbers</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {barbers.map(barber => (
              <BarberCard 
                key={barber.id} 
                barber={barber}
                onEdit={handleEdit}
                onServices={handleServices}
                onHours={handleHours}
                onLunch={handleLunch}
                onColor={handleColor}
                onHoliday={handleHoliday}
                onDeactivate={handleDeactivate}
                onReactivate={handleReactivate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </AdminLayout>
    </Layout>
  );
};
