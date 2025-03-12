
import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { NotificationTemplatesForm } from '@/components/admin/notification/NotificationTemplatesForm';

const NotificationSettings = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>
        <p className="mb-8 text-muted-foreground">
          Manage notification templates for email and SMS communications with customers.
        </p>
        
        <div className="space-y-8">
          <NotificationTemplatesForm />
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationSettings;
