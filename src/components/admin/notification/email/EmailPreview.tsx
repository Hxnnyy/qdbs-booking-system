
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailPreviewProps {
  subject: string;
  content: string;
  previewValues: Record<string, string>;
}

export const EmailPreview = ({ subject, content, previewValues }: EmailPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const replaceTemplateVariables = (text: string, values: Record<string, string>) => {
    let result = text;
    Object.entries(values).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    });
    return result;
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-booking-email', {
        body: {
          to: testEmail,
          subject: replaceTemplateVariables(subject, previewValues),
          emailTemplate: content,
          ...previewValues,
          name: previewValues.name,
          bookingCode: previewValues.bookingCode,
          bookingId: 'test-booking',
          bookingDate: new Date().toISOString(),
          bookingTime: previewValues.bookingTime,
          barberName: previewValues.barberName,
          serviceName: previewValues.serviceName,
          isGuest: true
        },
      });

      if (error) throw error;
      toast.success('Test email sent successfully');
      setIsOpen(false);
    } catch (error: any) {
      toast.error(`Failed to send test email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Preview & Test Email
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will look and send a test email
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4 mt-4">
            <div className="flex items-end gap-4 p-4 border-b">
              <div className="flex-1">
                <Label htmlFor="test-email">Send test email to:</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="Enter email address"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleSendTestEmail} disabled={isSending}>
                {isSending ? 'Sending...' : 'Send Test'}
              </Button>
            </div>

            <div className="border rounded-lg overflow-y-auto flex-1 bg-white">
              <div 
                className="p-4"
                dangerouslySetInnerHTML={{ 
                  __html: replaceTemplateVariables(content, previewValues) 
                }} 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
