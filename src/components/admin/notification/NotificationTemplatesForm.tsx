import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Mail, MessageSquare, Plus, Trash } from 'lucide-react';
import { NotificationTemplate } from '@/supabase-types';
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates';
import { EmailEditor } from './email/EmailEditor';
import { EmailPreview } from './email/EmailPreview';

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
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [previewValues, setPreviewValues] = useState({
    name: 'John Doe',
    bookingCode: 'ABC123',
    bookingDate: 'Monday, June 15, 2025',
    bookingTime: '14:00',
    barberName: 'Mike',
    serviceName: 'Haircut'
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
      subject: type === 'email' ? '' : undefined,
      content: '',
      variables: ['{{name}}', '{{bookingCode}}', '{{bookingDate}}', '{{bookingTime}}', '{{barberName}}', '{{serviceName}}'],
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

  const replaceTemplateVariables = (content: string, values: Record<string, string>) => {
    let result = content;
    Object.entries(values).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    });
    return result;
  };

  const renderTemplateDialog = (isAdd: boolean) => (
    <Dialog open={isAdd ? addDialogOpen : editDialogOpen} onOpenChange={isAdd ? setAddDialogOpen : setEditDialogOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isAdd ? 'Create' : 'Edit'} {currentTemplate.type === 'email' ? 'Email' : 'SMS'} Template</DialogTitle>
          <DialogDescription>
            {isAdd ? 'Create a new' : 'Update'} notification template.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template-name" className="text-right">
              Template Name
            </Label>
            <Input
              id="template-name"
              value={currentTemplate.template_name}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, template_name: e.target.value })}
              className="col-span-3"
            />
          </div>
          
          {currentTemplate.type === 'email' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input
                id="subject"
                value={currentTemplate.subject || ''}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
                className="col-span-3"
              />
            </div>
          )}
          
          <div className="grid grid-cols-4 items-start gap-4">
            <div className="text-right pt-2">
              <Label htmlFor="content">Content</Label>
            </div>
            <div className="col-span-3 space-y-4">
              {currentTemplate.type === 'email' ? (
                <>
                  <EmailEditor
                    value={currentTemplate.content}
                    onChange={(value) => setCurrentTemplate({ ...currentTemplate, content: value })}
                  />
                  <EmailPreview
                    subject={currentTemplate.subject || ''}
                    content={currentTemplate.content}
                    previewValues={previewValues}
                  />
                </>
              ) : (
                <Textarea
                  id="content"
                  value={currentTemplate.content}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, content: e.target.value })}
                  rows={8}
                />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="is-default" className="text-right">
              Set as Default
            </Label>
            <div className="col-span-3">
              <Switch
                id="is-default"
                checked={currentTemplate.is_default}
                onCheckedChange={(checked) => setCurrentTemplate({ ...currentTemplate, is_default: checked })}
                disabled={currentTemplate.is_default}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => isAdd ? setAddDialogOpen(false) : setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate}>{isAdd ? 'Create' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notification Templates</CardTitle>
        <CardDescription>
          Manage email and SMS templates for booking notifications
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

          <TabsContent value="email" className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={() => handleNewTemplate('email')} 
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> New Email Template
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : emailTemplates.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No email templates found. Create one to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {emailTemplates.map(template => (
                  <Card key={template.id} className={template.is_default ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {template.template_name}
                          {template.is_default && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditTemplate(template)}
                          >
                            Edit
                          </Button>
                          {!template.is_default && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the template.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => template.id && handleDeleteTemplate(template.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-2">
                        <strong>Subject:</strong> {template.subject}
                      </div>
                      <div className="text-sm border rounded p-3 whitespace-pre-wrap bg-muted/50">
                        {template.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={() => handleNewTemplate('sms')}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> New SMS Template
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : smsTemplates.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No SMS templates found. Create one to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {smsTemplates.map(template => (
                  <Card key={template.id} className={template.is_default ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {template.template_name}
                          {template.is_default && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditTemplate(template)}
                          >
                            Edit
                          </Button>
                          {!template.is_default && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the template.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => template.id && handleDeleteTemplate(template.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm border rounded p-3 whitespace-pre-wrap bg-muted/50">
                        {template.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {
