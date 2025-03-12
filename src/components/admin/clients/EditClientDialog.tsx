
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Client } from '@/types/client';

interface EditClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (clientId: string, data: { name?: string, phone?: string, email?: string }) => Promise<void>;
  isLoading: boolean;
}

export const EditClientDialog: React.FC<EditClientDialogProps> = ({ 
  isOpen, 
  onClose, 
  client, 
  onSave,
  isLoading
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Reset form when dialog opens with a new client
  React.useEffect(() => {
    if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    const updatedFields: { name?: string, phone?: string, email?: string } = {};
    
    // Only include fields that have changed
    if (name !== client.name) updatedFields.name = name;
    if (phone !== client.phone) updatedFields.phone = phone;
    if (email !== client.email) updatedFields.email = email;
    
    // Only save if there are changes
    if (Object.keys(updatedFields).length > 0) {
      await onSave(client.id, updatedFields);
      onClose();
    } else {
      onClose(); // No changes, just close
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Client Profile</DialogTitle>
          <DialogDescription>
            {client?.isGuest 
              ? "Edit guest client information. This will update all their bookings."
              : "Edit registered user profile information."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Full Name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="Phone Number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email Address"
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
