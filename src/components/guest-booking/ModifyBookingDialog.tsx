
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { addDays, isAfter, isBefore, addMonths, isSameDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { CalendarEvent } from '@/types/calendar';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { hasAvailableSlotsOnDay } from '@/utils/bookingUtils';
import { toast } from 'sonner';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import TimeSlotsGrid from '../booking/TimeSlotsGrid';

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
  existingBookings?: any[];
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
  barberId,
  existingBookings = []
}) => {
  const [calendarPopoverOpen, setCalendarPopoverOpen] = useState(false);
  const [isCheckingDateAvailability, setIsCheckingDateAvailability] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [timeSlotError, setTimeSlotError] = useState<string | null>(null);
  // Store the current month in calendar view
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(newBookingDate || new Date());
  
  useEffect(() => {
    if (isOpen && barberId && selectedBooking?.service?.duration) {
      cacheUnavailableDates();
    }
    
    // Update calendar month when newBookingDate changes
    if (newBookingDate) {
      setCalendarMonth(newBookingDate);
    }
  }, [isOpen, barberId, selectedBooking, newBookingDate]);
  
  const cacheUnavailableDates = async () => {
    if (!barberId || !selectedBooking?.service?.duration) return;
    
    setIsCheckingDateAvailability(true);
    const unavailable: Date[] = [];
    
    const today = new Date();
    const maxDate = addMonths(today, 3);
    let checkDate = new Date(today);
    
    while (checkDate <= maxDate) {
      const isHoliday = isBarberHolidayDate(allEvents, checkDate, barberId);
      
      if (isHoliday) {
        unavailable.push(new Date(checkDate));
      } else {
        const hasAvailableSlots = await hasAvailableSlotsOnDay(
          barberId,
          new Date(checkDate), 
          existingBookings,
          selectedBooking?.service?.duration
        );
        
        if (!hasAvailableSlots) {
          unavailable.push(new Date(checkDate));
        }
      }
      
      checkDate = addDays(checkDate, 1);
    }
    
    setUnavailableDates(unavailable);
    setIsCheckingDateAvailability(false);
  };
  
  const shouldDisableDate = (date: Date) => {
    if (isBefore(date, addDays(new Date(), 0)) || isAfter(date, addMonths(new Date(), 3))) {
      return true;
    }
    
    if (isBarberHolidayDate(allEvents, date, barberId)) {
      return true;
    }
    
    return unavailableDates.some(unavailableDate => 
      isSameDay(unavailableDate, date)
    );
  };

  const handleCalendarContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      const isHoliday = isBarberHolidayDate(allEvents, date, barberId);
      
      if (isHoliday) {
        toast.error("Barber is not available on this date");
        return;
      }
      
      if (unavailableDates.some(unavailableDate => isSameDay(unavailableDate, date))) {
        toast.error("No available time slots on this date");
        return;
      }
    }
    
    onDateChange(date);
    // No need to close the popover here as the user might want to select a different date
  };

  const handleDoneSelectingDate = () => {
    setCalendarPopoverOpen(false);
  };

  // Log available time slots for debugging
  useEffect(() => {
    if (availableTimeSlots) {
      console.log('Available time slots in ModifyBookingDialog:', availableTimeSlots);
    }
  }, [availableTimeSlots]);

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
              <Popover 
                open={calendarPopoverOpen} 
                onOpenChange={setCalendarPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newBookingDate ? format(newBookingDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0" 
                  align="start" 
                  onClick={handleCalendarContainerClick}
                >
                  <div className="p-0">
                    {isCheckingDateAvailability ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <Spinner className="h-8 w-8" />
                        <span className="ml-2">Checking availability...</span>
                      </div>
                    ) : (
                      <Calendar
                        mode="single"
                        selected={newBookingDate}
                        onSelect={handleSelectDate}
                        initialFocus
                        disabled={shouldDisableDate}
                        className="p-3 pointer-events-auto"
                        modifiers={{
                          unavailable: unavailableDates
                        }}
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth}
                      />
                    )}
                    <div className="flex justify-end p-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDoneSelectingDate}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {newBookingDate && (
              <div className="space-y-2">
                <Label>Select New Time</Label>
                <TimeSlotsGrid
                  selectedDate={newBookingDate}
                  selectedTime={newBookingTime}
                  setSelectedTime={onTimeSelection}
                  availableTimeSlots={availableTimeSlots}
                  isLoading={isLoadingTimeSlots}
                  error={timeSlotError}
                />
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
            disabled={isModifying || !newBookingDate || !newBookingTime || availableTimeSlots.length === 0}
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
