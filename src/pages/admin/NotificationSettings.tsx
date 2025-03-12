
import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { NotificationTemplatesForm } from '@/components/admin/notification/NotificationTemplatesForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const NotificationSettings = () => {
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('send-booking-email', {
        body: {
          to: testEmail,
          name: 'Test Customer',
          bookingId: 'test-booking',
          bookingCode: 'TEST123',
          bookingDate: new Date().toISOString(),
          bookingTime: '14:00',
          barberName: 'Test Barber',
          serviceName: 'Haircut',
          isGuest: false,
          subject: 'Test Notification Email'
        }
      });

      if (error) throw error;
      toast.success(`Test email sent to ${testEmail}`);
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error(`Failed to send test email: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone.trim()) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('send-booking-sms', {
        body: {
          phone: testPhone,
          name: 'Test Customer',
          bookingCode: 'TEST123',
          bookingId: 'test-booking',
          bookingDate: new Date().toISOString(),
          bookingTime: '14:00',
          barberName: 'Test Barber',
          serviceName: 'Haircut'
        }
      });

      if (error) throw error;
      toast.success(`Test SMS sent to ${testPhone}`);
    } catch (error) {
      console.error('Error sending test SMS:', error);
      toast.error(`Failed to send test SMS: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>
        <p className="mb-8 text-muted-foreground">
          Manage notification templates for email and SMS communications with customers.
        </p>
        
        <div className="space-y-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Test Notifications</CardTitle>
              <CardDescription>
                Send test notifications to verify your templates are working correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="email">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="email" className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>Test Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>Test SMS</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="email">
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="test-email" className="text-right">Email Address</Label>
                      <Input
                        id="test-email"
                        type="email"
                        placeholder="Enter test email address"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleTestEmail} 
                        disabled={isSendingTest}
                      >
                        {isSendingTest ? 'Sending...' : 'Send Test Email'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="sms">
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="test-phone" className="text-right">Phone Number</Label>
                      <Input
                        id="test-phone"
                        type="tel"
                        placeholder="Enter test phone number"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleTestSMS} 
                        disabled={isSendingTest}
                      >
                        {isSendingTest ? 'Sending...' : 'Send Test SMS'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <NotificationTemplatesForm />
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationSettings;
