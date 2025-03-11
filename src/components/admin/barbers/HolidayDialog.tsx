
import React from 'react';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface HolidayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: Date, endDate: Date) => void;
  barberId: string;
}

export const HolidayDialog: React.FC<HolidayDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  barberId,
}) => {
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();

  // Reset state when dialog opens or closes
  React.useEffect(() => {
    if (!isOpen) {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (startDate && endDate) {
      onSave(startDate, endDate);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Holiday</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
          </div>
          <div className="grid gap-2">
            <Label>End Date</Label>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              className="rounded-md border"
              disabled={(date) => !startDate || date < startDate}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave}
            disabled={!startDate || !endDate}
          >
            Save Holiday
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
