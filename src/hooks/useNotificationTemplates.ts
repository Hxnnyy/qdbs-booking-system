import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationTemplate, InsertableNotificationTemplate, UpdatableNotificationTemplate } from '@/supabase-types';
import { getDefaultEmailTemplate } from '@/utils/defaultEmailTemplate';

export const useNotificationTemplates = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) throw error;

      // Parse the JSONB variables field to a string array
      const parsedTemplates = data?.map(template => ({
        ...template,
        variables: typeof template.variables === 'string' 
          ? JSON.parse(template.variables) 
          : Array.isArray(template.variables) 
            ? template.variables 
            : []
      })) || [];

      setTemplates(parsedTemplates as NotificationTemplate[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching notification templates:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (template: InsertableNotificationTemplate) => {
    try {
      setIsLoading(true);
      
      // Use default HTML template for email if content is empty
      let templateToInsert = { ...template };
      if (template.type === 'email' && !template.content.trim()) {
        templateToInsert.content = getDefaultEmailTemplate();
      }
      
      // Prepare the template for insertion - ensure variables is always an array when converting to JSON
      const variablesToInsert = Array.isArray(templateToInsert.variables) 
        ? templateToInsert.variables 
        : [];
      
      const templateForDB = {
        ...templateToInsert,
        variables: JSON.stringify(variablesToInsert)
      };

      const { error } = await supabase
        .from('notification_templates')
        .insert(templateForDB as any);
      
      if (error) throw error;
      
      await fetchTemplates();
      toast.success('Template created successfully');
      return true;
    } catch (err: any) {
      console.error('Error creating template:', err.message);
      toast.error(`Error creating template: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = async (id: string, template: UpdatableNotificationTemplate) => {
    try {
      setIsLoading(true);
      
      // Prepare the template for update - ensure variables is always an array when converting to JSON
      const variablesToUpdate = Array.isArray(template.variables) 
        ? template.variables 
        : [];
      
      const templateForDB = {
        ...template,
        variables: JSON.stringify(variablesToUpdate)
      };

      const { error } = await supabase
        .from('notification_templates')
        .update(templateForDB as any)
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchTemplates();
      toast.success('Template updated successfully');
      return true;
    } catch (err: any) {
      console.error('Error updating template:', err.message);
      toast.error(`Error updating template: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchTemplates();
      toast.success('Template deleted successfully');
      return true;
    } catch (err: any) {
      console.error('Error deleting template:', err.message);
      toast.error(`Error deleting template: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
};
