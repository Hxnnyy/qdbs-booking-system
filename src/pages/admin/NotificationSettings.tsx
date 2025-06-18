
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { NotificationTemplatesForm } from '@/components/admin/notification/NotificationTemplatesForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlarmClock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Define types for system settings 
interface ReminderSettings {
  days_before: number;
  reminder_time: string;
  send_reminders: boolean;
}

const NotificationSettings = () => {
  const [testReminderPhone, setTestReminderPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    days_before: 1,
    reminder_time: '10:00',
    send_reminders: true
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showTestReminderInput, setShowTestReminderInput] = useState(false);

  const reminderForm = useForm<ReminderSettings>({
    defaultValues: {
      days_before: 1,
      reminder_time: '10:00',
      send_reminders: true
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch reminder settings
        const { data: reminderData, error: reminderError } = await supabase.functions.invoke('create-system-settings-table', {
          body: { action: 'get_settings', setting_type: 'reminder_settings' }
        });

        if (reminderError) {
          console.error('Error fetching reminder settings:', reminderError);
        } else if (reminderData && reminderData.settings) {
          const settings = reminderData.settings;
          setReminderSettings(settings);
          reminderForm.reset(settings);
        }
      } catch (error: any) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoadingSettings(false);
      }
    };
    
    fetchSettings();
  }, []);

  const onSubmitReminderSettings = async (values: ReminderSettings) => {
    setIsSavingSettings(true);
    try {
      // Save reminder settings
      const { data, error } = await supabase.functions.invoke('create-system-settings-table', {
        body: { 
          action: 'save_settings', 
          setting_type: 'reminder_settings',
          settings: values
        }
      });
      
      if (error) throw error;
      
      setReminderSettings(values);
      toast.success('Reminder settings saved successfully');
      
      // Update the cron schedule
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
          
          <NotificationTemplatesForm />
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationSettings;
