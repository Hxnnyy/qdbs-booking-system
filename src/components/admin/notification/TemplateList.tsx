
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash } from 'lucide-react';
import { NotificationTemplate } from '@/supabase-types';

interface TemplateListProps {
  templates: NotificationTemplate[];
  isLoading: boolean;
  onEditTemplate: (template: NotificationTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  templateType: 'email' | 'sms';
}

export const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  isLoading,
  onEditTemplate,
  onDeleteTemplate,
  templateType
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No {templateType} templates found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map(template => (
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
                  onClick={() => onEditTemplate(template)}
                >
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{template.template_name}"? 
                        {template.is_default && (
                          <span className="block mt-2 font-medium text-destructive">
                            This is a default template. Deleting it may affect existing functionality.
                          </span>
                        )}
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => template.id && onDeleteTemplate(template.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Template
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {templateType === 'email' && (
              <div className="text-sm text-muted-foreground mb-2">
                <strong>Subject:</strong> {template.subject}
              </div>
            )}
            <div className="text-sm border rounded p-3 whitespace-pre-wrap bg-muted/50 max-h-32 overflow-y-auto">
              {template.content}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
