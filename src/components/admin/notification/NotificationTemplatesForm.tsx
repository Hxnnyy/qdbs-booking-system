
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, MessageSquare, Bookmark } from 'lucide-react';

interface NotificationTemplate {
  id?: string;
  type: 'email' | 'sms';
  template_name: string;
  subject?: string;
  content: string;
  variables: string[];
  is_default: boolean;
  created_at?: string;
}

const availableVariables = [
  '{{name}}', 
  '{{bookingCode}}',
  '{{bookingDate}}',
  '{{bookingTime}}',
  '{{barberName}}',
  '{{serviceName}}'
];

const NotificationTemplatesForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<NotificationTemplate>({
    type: 'email',
    template_name: 'Booking Confirmation Email',
    subject: 'Your Booking Confirmation - Queens Dock Barbershop',
    content: '',
    variables: availableVariables,
    is_default: true
  });
  
  const [smsTemplate, setSmsTemplate] = useState<NotificationTemplate>({
    type: 'sms',
    template_name: 'Booking Confirmation SMS',
    content: '',
    variables: availableVariables,
    is_default: true
  });

  // Fetch existing templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        // Use string query to avoid type issues with table that might not be in the types yet
        const { data: emailData, error: emailError } = await supabase
          .from('notification_templates')
          .select('*')
          .eq('type', 'email')
          .eq('is_default', true)
          .maybeSingle();
        
        if (emailError) throw emailError;
        
        const { data: smsData, error: smsError } = await supabase
          .from('notification_templates')
          .select('*')
          .eq('type', 'sms')
          .eq('is_default', true)
          .maybeSingle();
          
        if (smsError) throw smsError;
        
        // Set email template
        if (emailData) {
          setEmailTemplate({
            ...emailData,
            variables: typeof emailData.variables === 'string' 
              ? JSON.parse(emailData.variables) 
              : emailData.variables
          } as NotificationTemplate);
        }
        
        // Set SMS template
        if (smsData) {
          setSmsTemplate({
            ...smsData,
            variables: typeof smsData.variables === 'string' 
              ? JSON.parse(smsData.variables) 
              : smsData.variables
          } as NotificationTemplate);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load notification templates');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);

  const saveTemplate = async (template: NotificationTemplate) => {
    setLoading(true);
    try {
      // Convert variables array to JSON string if needed
      const templateToSave = {
        ...template,
        variables: Array.isArray(template.variables) 
          ? JSON.stringify(template.variables) 
          : template.variables
      };
      
      // Check if template exists
      if (template.id) {
        // Update using raw query to avoid type issues
        const { error } = await supabase
          .from('notification_templates')
          .update(templateToSave)
          .eq('id', template.id);
          
        if (error) throw error;
        toast.success(`${template.type === 'email' ? 'Email' : 'SMS'} template updated`);
      } else {
        // Insert using raw query to avoid type issues
        const { error } = await supabase
          .from('notification_templates')
          .insert(templateToSave);
          
        if (error) throw error;
        toast.success(`${template.type === 'email' ? 'Email' : 'SMS'} template created`);
      }
      
      // Refresh templates
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('type', template.type)
        .eq('is_default', true)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        const formattedData = {
          ...data,
          variables: typeof data.variables === 'string' 
            ? JSON.parse(data.variables) 
            : data.variables
        } as NotificationTemplate;

        if (template.type === 'email') {
          setEmailTemplate(formattedData);
        } else {
          setSmsTemplate(formattedData);
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmailTemplate = () => {
    saveTemplate(emailTemplate);
  };

  const handleSaveSmsTemplate = () => {
    saveTemplate(smsTemplate);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notification Templates</CardTitle>
        <CardDescription>
          Customize the messages sent to customers when they book appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email">
          <TabsList className="mb-4">
            <TabsTrigger value="email" className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Email Template
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS Template
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="email">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-subject">Subject Line</Label>
                <Input 
                  id="email-subject"
                  value={emailTemplate.subject || ''}
                  onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                  placeholder="Email subject line"
                />
              </div>
              
              <div>
                <Label htmlFor="email-content">Email Content</Label>
                <Textarea 
                  id="email-content"
                  value={emailTemplate.content}
                  onChange={(e) => setEmailTemplate({...emailTemplate, content: e.target.value})}
                  placeholder="The content of your email template"
                  className="min-h-[200px]"
                />
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Available Variables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((variable) => (
                    <div 
                      key={variable}
                      className="bg-secondary text-secondary-foreground px-2 py-1 text-xs rounded-md cursor-pointer hover:bg-secondary/80"
                      onClick={() => {
                        const textArea = document.getElementById('email-content') as HTMLTextAreaElement;
                        if (textArea) {
                          const cursorPos = textArea.selectionStart;
                          const textBefore = emailTemplate.content.substring(0, cursorPos);
                          const textAfter = emailTemplate.content.substring(cursorPos);
                          setEmailTemplate({
                            ...emailTemplate,
                            content: textBefore + variable + textAfter
                          });
                          // Set focus and cursor position
                          setTimeout(() => {
                            textArea.focus();
                            textArea.selectionStart = textArea.selectionEnd = cursorPos + variable.length;
                          }, 0);
                        }
                      }}
                    >
                      {variable}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={handleSaveEmailTemplate} 
                disabled={loading}
              >
                Save Email Template
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="sms">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sms-content">SMS Content</Label>
                <Textarea 
                  id="sms-content"
                  value={smsTemplate.content}
                  onChange={(e) => setSmsTemplate({...smsTemplate, content: e.target.value})}
                  placeholder="The content of your SMS message"
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Keep SMS messages concise as carriers may split longer messages.
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Available Variables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((variable) => (
                    <div 
                      key={variable}
                      className="bg-secondary text-secondary-foreground px-2 py-1 text-xs rounded-md cursor-pointer hover:bg-secondary/80"
                      onClick={() => {
                        const textArea = document.getElementById('sms-content') as HTMLTextAreaElement;
                        if (textArea) {
                          const cursorPos = textArea.selectionStart;
                          const textBefore = smsTemplate.content.substring(0, cursorPos);
                          const textAfter = smsTemplate.content.substring(cursorPos);
                          setSmsTemplate({
                            ...smsTemplate,
                            content: textBefore + variable + textAfter
                          });
                          // Set focus and cursor position
                          setTimeout(() => {
                            textArea.focus();
                            textArea.selectionStart = textArea.selectionEnd = cursorPos + variable.length;
                          }, 0);
                        }
                      }}
                    >
                      {variable}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={handleSaveSmsTemplate} 
                disabled={loading}
              >
                Save SMS Template
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 p-4 text-sm text-muted-foreground">
        Templates will be applied to all new bookings. Changes won't affect existing confirmations.
      </CardFooter>
    </Card>
  );
};

export default NotificationTemplatesForm;
