
import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import NotificationTemplatesForm from '@/components/admin/notification/NotificationTemplatesForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NotificationSettings: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground">
            Customize the messages sent to customers for booking confirmations and reminders
          </p>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Customize email and SMS templates for different types of notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationTemplatesForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationSettings;
