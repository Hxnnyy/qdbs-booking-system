
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClientEmail = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Send email to selected clients
  const sendEmailToClients = async (recipients: string[], subject: string, content: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('send-clients-email', {
        body: {
          recipients,
          subject,
          content
        },
      });

      if (error) throw error;
      
      toast.success('Email sent successfully');
      return true;
    } catch (err: any) {
      console.error('Error sending email:', err);
      toast.error(`Failed to send email: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendEmailToClients,
    isLoading
  };
};
