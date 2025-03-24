
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';

export const NotificationTemplates = () => {
  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Notification Templates</h1>
          <p>Notification templates management will be implemented here.</p>
        </div>
      </AdminLayout>
    </Layout>
  );
};

// Fix the export name to match the component name
export default NotificationTemplates;
