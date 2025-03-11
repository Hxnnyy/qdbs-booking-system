
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Barber } from '@/supabase-types';

interface DeactivateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentBarber: Barber | null;
  onDeactivate: () => Promise<void>;
}

export const DeactivateDialog: React.FC<DeactivateDialogProps> = ({
  isOpen,
  onOpenChange,
  currentBarber,
  onDeactivate,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate Barber</DialogTitle>
        </DialogHeader>
        <p className="py-4">
          Are you sure you want to deactivate {currentBarber?.name}? They will no longer be available for bookings.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDeactivate}>
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
