
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Booking } from '@/supabase-types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { statusOptions } from './BookingFilterControls';

interface StatusUpdateDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  booking: Booking | null;
  newStatus: string;
  setNewStatus: (status: string) => void;
  onUpdateStatus: () => Promise<void>;
}

export const StatusUpdateDialog: React.FC<StatusUpdateDialogProps> = ({
  isOpen,
  setIsOpen,
  booking,
  newStatus,
  setNewStatus,
  onUpdateStatus
}) => {
  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Booking Status</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">
            Change status for booking on {format(parseISO(booking.booking_date), 'PP')} at {booking.booking_time}
          </p>
          <Select onValueChange={setNewStatus} defaultValue={booking.status}>
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onUpdateStatus}>
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
