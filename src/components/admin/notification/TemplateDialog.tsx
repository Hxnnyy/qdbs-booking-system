
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { NotificationTemplate } from '@/supabase-types';
import { EmailEditor } from './email/EmailEditor';
import { EmailPreview } from './email/EmailPreview';

interface TemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplate: NotificationTemplate;
  setCurrentTemplate: (template: NotificationTemplate) => void;
  isAdd: boolean;
  onSave: () => void;
  previewValues: Record<string, string>;
}

export const TemplateDialog: React.FC<TemplateDialogProps> = ({
  isOpen,
  onOpenChange,
  currentTemplate,
  setCurrentTemplate,
  isAdd,
  onSave,
  previewValues
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>{isAdd ? 'Create' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
