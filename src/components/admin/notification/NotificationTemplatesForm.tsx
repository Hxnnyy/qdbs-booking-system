import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { NotificationTemplate } from '@/supabase-types';
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates';
import { TemplateTabContent } from './TemplateTabContent';
import { TemplateDialog } from './TemplateDialog';
import { getDefaultEmailTemplate } from '@/utils/defaultEmailTemplate';

export const NotificationTemplatesForm = () => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useNotificationTemplates();
  
  const [currentTemplate, setCurrentTemplate] = useState<NotificationTemplate>({
    type: 'email',
    template_name: '',
    subject: '',
    content: '',
    variables: [],
    is_default: false
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  
  const [previewValues] = useState({
    name: 'John Doe',
    bookingCode: 'ABC123',
    bookingDate: 'Monday, June 15, 2025',
    bookingTime: '14:00',
    barberName: 'Mike',
    serviceName: 'Haircut',
    managementLink: 'https://queensdockbarbershop.co.uk/verify-booking'
  });

  const emailTemplates = templates.filter(t => t.type === 'email');
  const smsTemplates = templates.filter(t => t.type === 'sms');

  const handleEditTemplate = (template: NotificationTemplate) => {
    setCurrentTemplate({
      ...template,
      variables: Array.isArray(template.variables) 
        ? template.variables 
        : typeof template.variables === 'string'
          ? JSON.parse(template.variables)
          : []
    });
    setIsEditing(true);
    setEditDialogOpen(true);
  };

  const handleNewTemplate = (type: 'email' | 'sms') => {
    setCurrentTemplate({
      type,
      template_name: '',
      subject: type === 'email' ? 'Your Booking Confirmation - Queens Dock Barbershop' : undefined,
      content: type === 'email' ? getDefaultEmailTemplate() : '',
      variables: ['{{name}}', '{{bookingCode}}', '{{bookingDate}}', '{{bookingTime}}', '{{barberName}}', '{{serviceName}}', '{{managementLink}}'],
      is_default: false
    });
    setIsEditing(false);
    setAddDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    // Validation
    if (!currentTemplate.template_name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!currentTemplate.content.trim()) {
      toast.error('Template content is required');
      return;
    }

    try {
      if (isEditing && currentTemplate.id) {
        await updateTemplate(currentTemplate.id, {
          template_name: currentTemplate.template_name,
          subject: currentTemplate.subject,
          content: currentTemplate.content,
          variables: currentTemplate.variables,
          is_default: currentTemplate.is_default
        });
        setEditDialogOpen(false);
      } else {
        await createTemplate({
          type: currentTemplate.type,
          template_name: currentTemplate.template_name,
          subject: currentTemplate.subject,
          content: currentTemplate.content,
          variables: currentTemplate.variables,
          is_default: currentTemplate.is_default
        });
        setAddDialogOpen(false);
      }
    } catch (error: any) {
      toast.error(`Error saving template: ${error.message}`);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
    } catch (error: any) {
      toast.error(`Error deleting template: ${error.message}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notification Templates</CardTitle>
        <CardDescription>
          Manage email and SMS templates for booking notifications. Email templates support full HTML formatting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email" className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span>Email Templates</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>SMS Templates</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <TemplateTabContent
              templates={emailTemplates}
              isLoading={isLoading}
              onNewTemplate={() => handleNewTemplate('email')}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              templateType="email"
            />
          </TabsContent>

          <TabsContent value="sms">
            <TemplateTabContent
              templates={smsTemplates}
              isLoading={isLoading}
              onNewTemplate={() => handleNewTemplate('sms')}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              templateType="sms"
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Edit Template Dialog */}
      <TemplateDialog
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentTemplate={currentTemplate}
        setCurrentTemplate={setCurrentTemplate}
        isAdd={false}
        onSave={handleSaveTemplate}
        previewValues={previewValues}
      />

      {/* Add Template Dialog */}
      <TemplateDialog
        isOpen={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        currentTemplate={currentTemplate}
        setCurrentTemplate={setCurrentTemplate}
        isAdd={true}
        onSave={handleSaveTemplate}
        previewValues={previewValues}
      />
    </Card>
  );
};
