
import React from 'react';
import { format } from 'date-fns';
import { addDays, isAfter, isBefore } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import TimeSlot from '@/components/booking/TimeSlot';
import { Spinner } from '@/components/ui/spinner';
import { CalendarEvent } from '@/types/calendar';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';

interface ModifyBookingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedBooking: any;
  newBookingDate: Date | undefined;
  newBookingTime: string | null;
  availableTimeSlots: string[];
  isModifying: boolean;
  onDateChange: (date: Date | undefined) => void;
  onTimeSelection: (time: string) => void;
  onModifyBooking: () => void;
  allEvents?: CalendarEvent[];
  barberId?: string;
}

const ModifyBookingDialog: React.FC<ModifyBookingDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedBooking,
  newBookingDate,
  newBookingTime,
  availableTimeSlots,
  isModifying,
  onDateChange,
  onTimeSelection,
  onModifyBooking,
  allEvents = [],
  barberId
}) => {
  // Function to check if a date should be disabled
  const shouldDisableDate = (date: Date) => {
    // Check if date is before today or after max booking window
    if (isBefore(date, addDays(new Date(), 0)) || isAfter(date, addDays(new Date(), 30))) {
      return true;
    }
    
    // Check if the barber is on holiday for this date
    return isBarberHolidayDate(allEvents, date, barberId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select New Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newBookingDate ? format(newBookingDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newBookingDate}
                    onSelect={onDateChange}
                    initialFocus
                    disabled={shouldDisableDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {newBookingDate && (
              <div className="space-y-2">
                <Label>Select New Time</Label>
                <div className="grid grid-cols-3 gap-2">
                  {availableTimeSlots.map((time) => (
                    <TimeSlot
                      key={time}
                      time={time}
                      selected={newBookingTime || ''}
                      onClick={() => onTimeSelection(time)}
                      disabled={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onModifyBooking} 
            disabled={isModifying || !newBookingDate || !newBookingTime}
            className="bg-burgundy hover:bg-burgundy-light"
          >
            {isModifying ? (
              <>
                <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Updating...
              </>
            ) : (
              'Update Booking'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModifyBookingDialog;
