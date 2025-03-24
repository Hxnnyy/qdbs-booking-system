
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { useServices } from '@/hooks/useServices';

export const ServiceList = () => {
  const { services, isLoading } = useServices();

  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Manage Services</h1>
          <div className="grid gap-4">
            {services.map(service => (
              <div key={service.id} className="p-4 border rounded">
                <h3 className="font-bold">{service.name}</h3>
                <p>£{service.price} • {service.duration} min</p>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    </Layout>
  );
};
