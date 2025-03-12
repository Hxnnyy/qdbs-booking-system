
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailEditor } from '@/components/admin/notification/email/EmailEditor';
import { EmailPreview } from '@/components/admin/notification/email/EmailPreview';

interface ClientsEmailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (subject: string, content: string) => Promise<boolean>;
  selectedClientsCount: number;
}

export const ClientsEmailDialog: React.FC<ClientsEmailDialogProps> = ({
  isOpen,
  onOpenChange,
  onSend,
  selectedClientsCount
}) => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState(`<p>Dear valued client,</p>
<p>Thank you for choosing Queens Dock Barbershop. We wanted to reach out to let you know about our latest offers and services.</p>
<p>Best regards,</p>
<p>The Queens Dock Barbershop Team</p>`);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      return;
    }

    setIsSending(true);
    try {
      await onSend(subject, content);
    } finally {
      setIsSending(false);
    }
  };

  const previewValues = {
    name: 'John Doe',
    bookingCode: 'ABC123',
    bookingDate: 'Monday, June 15, 2025',
    bookingTime: '14:00',
    barberName: 'Mike',
    serviceName: 'Haircut'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Send Email to Selected Clients</DialogTitle>
          <DialogDescription>
            Sending email to {selectedClientsCount} {selectedClientsCount === 1 ? 'client' : 'clients'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="col-span-3"
              placeholder="Email subject"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <div className="text-right pt-2">
              <Label htmlFor="content">Content</Label>
            </div>
            <div className="col-span-3 space-y-4">
              <EmailEditor
                value={content}
                onChange={(value) => setContent(value)}
              />
              <EmailPreview
                subject={subject}
                content={content}
                previewValues={previewValues}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !subject.trim() || !content.trim()}>
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
