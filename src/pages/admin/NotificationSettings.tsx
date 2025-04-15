
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { NotificationTemplatesForm } from '@/components/admin/notification/NotificationTemplatesForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Bell, AlarmClock, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Define types for system settings since they're not in the generated Supabase types
interface SystemSettings {
  id: string;
  setting_type: string;
  settings: {
    days_before: number;
    reminder_time: string;
    send_reminders: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

const NotificationSettings = () => {
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testReminderPhone, setTestReminderPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    days_before: 1,
    reminder_time: '10:00',
    send_reminders: true
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showTestReminderInput, setShowTestReminderInput] = useState(false);

  const reminderForm = useForm({
    defaultValues: {
      days_before: 1,
      reminder_time: '10:00',
      send_reminders: true
    }
  });

  useEffect(() => {
    const fetchReminderSettings = async () => {
      try {
        // Check if the table exists using raw query instead of RPC
        const { data: tableExists, error: tableCheckError } = await supabase
          .from('_system_table_check')
          .select('exists')
          .eq('table_name', 'system_settings')
          .maybeSingle()
          .then(res => ({ 
            data: res.data ? true : false, 
            error: res.error 
          }))
          .catch(() => ({ data: false, error: null }));
        
        if (tableCheckError) {
          console.log('Error checking table existence, assuming it does not exist');
          setIsLoadingSettings(false);
          return;
        }
        
        if (!tableExists) {
          console.log('Table system_settings does not exist, using default settings');
          setIsLoadingSettings(false);
          return;
        }
        
        // Fetch settings using a generic query
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('setting_type', 'reminder_settings')
          .maybeSingle() as { data: SystemSettings | null, error: any };
        
        if (error) {
          console.error('Error fetching reminder settings:', error);
          throw error;
        }
        
        if (data) {
          const settings = data.settings;
          setReminderSettings(settings);
          reminderForm.reset(settings);
        }
      } catch (error: any) {
        console.error('Error fetching reminder settings:', error);
        toast.error('Failed to load reminder settings');
      } finally {
        setIsLoadingSettings(false);
      }
    };
    
    fetchReminderSettings();
  }, []);

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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error sending test SMS:', error);
      toast.error(`Failed to send test SMS: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const onSubmitReminderSettings = async (values: typeof reminderSettings) => {
    setIsSavingSettings(true);
    try {
      // Check if table exists using a direct query instead of RPC
      const { data: tableExists, error: checkError } = await supabase
        .from('_system_table_check')
        .select('exists')
        .eq('table_name', 'system_settings')
        .maybeSingle()
        .then(res => ({ 
          data: res.data ? true : false, 
          error: res.error 
        }))
        .catch(() => ({ data: false, error: null }));
      
      if (checkError) {
        console.log('Error checking table existence, trying to create it anyway');
      }
      
      if (!tableExists) {
        // Create the table using a raw SQL query through an edge function
        await supabase.functions.invoke('create-system-settings-table', {
          body: {}
        });
      }
      
      // Check if settings already exist
      const { data: existingSettings, error: fetchError } = await supabase
        .from('system_settings')
        .select('id')
        .eq('setting_type', 'reminder_settings')
        .maybeSingle() as { data: { id: string } | null, error: any };
      
      if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "no rows returned" error
        throw fetchError;
      }
      
      let result;
      
      if (existingSettings) {
        // Update existing settings
        result = await supabase
          .rpc('update_system_settings', {
            p_id: existingSettings.id,
            p_settings: values
          });
      } else {
        // Insert new settings
        result = await supabase
          .rpc('insert_system_settings', {
            p_setting_type: 'reminder_settings',
            p_settings: values
          });
      }
      
      if (result.error) throw result.error;
      
      setReminderSettings(values);
      toast.success('Reminder settings saved successfully');
      
      const { error: cronError } = await supabase.functions.invoke('update-reminder-schedule', {
        body: values
      });
      
      if (cronError) {
        console.error('Error updating cron schedule:', cronError);
        toast.warning('Settings saved but scheduler update failed');
      }
    } catch (error: any) {
      console.error('Error saving reminder settings:', error);
      toast.error(`Failed to save settings: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSendTestReminder = () => {
    setShowTestReminderInput(true);
  };
  
  const submitTestReminder = async () => {
    if (!testReminderPhone.trim()) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    try {
      setIsSendingTest(true);
      const { error } = await supabase.functions.invoke('send-booking-reminder', {
        body: {
          testMode: true,
          testPhone: testReminderPhone
        }
      });
      
      if (error) throw error;
      toast.success(`Test reminder SMS sent to ${testReminderPhone}`);
      setShowTestReminderInput(false);
    } catch (error: any) {
      console.error('Error sending test reminder:', error);
      toast.error(`Failed to send test reminder: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>
        <p className="mb-8 text-muted-foreground">
          Manage notification templates and reminder settings for email and SMS communications with customers.
        </p>
        
        <div className="space-y-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlarmClock className="h-5 w-5" />
                Appointment Reminder Settings
              </CardTitle>
              <CardDescription>
                Configure when and how appointment reminders are sent to customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...reminderForm}>
                <form onSubmit={reminderForm.handleSubmit(onSubmitReminderSettings)} className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FormField
                      control={reminderForm.control}
                      name="send_reminders"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Appointment Reminders</FormLabel>
                            <FormDescription>
                              Turn appointment reminders on or off for all clients
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLoadingSettings}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={reminderForm.control}
                      name="days_before"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days Before Appointment</FormLabel>
                          <Select
                            disabled={isLoadingSettings || !reminderForm.watch('send_reminders')}
                            value={field.value.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select days" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 day before</SelectItem>
                              <SelectItem value="2">2 days before</SelectItem>
                              <SelectItem value="3">3 days before</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How many days before the appointment to send the reminder
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={reminderForm.control}
                      name="reminder_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reminder Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              disabled={isLoadingSettings || !reminderForm.watch('send_reminders')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The time of day when reminders will be sent
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    {!showTestReminderInput ? (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleSendTestReminder}
                        disabled={isSendingTest || isLoadingSettings}
                      >
                        {isSendingTest ? 'Sending...' : 'Send Test Reminder'}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <Input
                          type="tel"
                          placeholder="Enter phone number for test"
                          value={testReminderPhone}
                          onChange={(e) => setTestReminderPhone(e.target.value)}
                          disabled={isSendingTest}
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={submitTestReminder}
                          disabled={isSendingTest}
                        >
                          {isSendingTest ? 'Sending...' : 'Send'}
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost"
                          onClick={() => setShowTestReminderInput(false)}
                          disabled={isSendingTest}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      disabled={isSavingSettings || isLoadingSettings}
                    >
                      {isSavingSettings ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

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
