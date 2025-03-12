
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NotificationTemplate } from '@/supabase-types';
import { TemplateList } from './TemplateList';

interface TemplateTabContentProps {
  templates: NotificationTemplate[];
  isLoading: boolean;
  onNewTemplate: () => void;
  onEditTemplate: (template: NotificationTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  templateType: 'email' | 'sms';
}

export const TemplateTabContent: React.FC<TemplateTabContentProps> = ({
  templates,
  isLoading,
  onNewTemplate,
  onEditTemplate,
  onDeleteTemplate,
  templateType
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={onNewTemplate}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> New {templateType === 'email' ? 'Email' : 'SMS'} Template
        </Button>
      </div>
      
      <TemplateList
        templates={templates}
        isLoading={isLoading}
        onEditTemplate={onEditTemplate}
        onDeleteTemplate={onDeleteTemplate}
        templateType={templateType}
      />
    </div>
  );
};
