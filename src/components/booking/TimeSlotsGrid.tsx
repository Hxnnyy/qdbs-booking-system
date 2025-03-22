
import React, { useEffect, useState } from 'react';
import TimeSlot from '../TimeSlot';
import { Spinner } from '@/components/ui/spinner';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import { isSameDay } from 'date-fns';
import { getNoTimeSlotsMessage } from '@/utils/bookingTimeUtils';
import { hasLunchBreakConflict } from '@/utils/bookingTimeUtils';

interface TimeSlotsGridProps {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  availableTimeSlots: string[];
  isLoading: boolean;
  error: string | null;
  selectedBarberId?: string | null;
  serviceDuration?: number;
}

const TimeSlotsGrid: React.FC<TimeSlotsGridProps> = ({
  selectedDate,
  selectedTime,
  setSelectedTime,
  availableTimeSlots,
  isLoading,
  error,
  selectedBarberId,
  serviceDuration = 60
}) => {
  // Use the filtered time slots directly from the hook
  const [lunchBreaks, setLunchBreaks] = useState<any[]>([]);
  const [displayTimeSlots, setDisplayTimeSlots] = useState<string[]>([]);
  const timeSlots = availableTimeSlots || [];

  // Fetch lunch breaks on component mount
  useEffect(() => {
    if (selectedBarberId) {
      const fetchLunchBreaks = async () => {
        try {
          const { data, error } = await fetch(`/api/lunch-breaks/${selectedBarberId}`).then(res => res.json());
          if (error) throw error;
          setLunchBreaks(data || []);
          console.log('Lunch breaks fetched in TimeSlotsGrid:', data);
        } catch (err) {
          console.error('Error fetching lunch breaks:', err);
          setLunchBreaks([]);
        }
      };
      
      fetchLunchBreaks();
    }
  }, [selectedBarberId]);

  // Filter time slots by lunch breaks locally for double verification
  useEffect(() => {
    if (lunchBreaks.length > 0 && timeSlots.length > 0 && serviceDuration) {
      console.log(`Double-checking ${timeSlots.length} time slots against ${lunchBreaks.length} lunch breaks`);
      
      const filteredSlots = timeSlots.filter(slot => {
        // Verify this slot doesn't conflict with lunch breaks
        const hasLunchConflict = lunchBreaks.some(lunch => 
          lunch.is_active && hasLunchBreakConflict(slot, [lunch], serviceDuration)
        );
        
        if (hasLunchConflict) {
          console.log(`Slot ${slot} conflicts with lunch break, filtering out`);
          return false;
        }
        
        return true;
      });
      
      console.log(`After lunch break filtering: ${filteredSlots.length} slots remain`);
      setDisplayTimeSlots(filteredSlots);
    } else {
      setDisplayTimeSlots(timeSlots);
    }
  }, [timeSlots, lunchBreaks, serviceDuration]);

  // Clear the selected time if it's now in the past or no longer available
  useEffect(() => {
    if (selectedDate && selectedTime) {
      // Clear if time slot is in the past
      if (isTimeSlotInPast(selectedDate, selectedTime)) {
        setSelectedTime('');
        return;
      }
      
      // Clear if time slot is no longer in the available list
      if (displayTimeSlots.length > 0 && !displayTimeSlots.includes(selectedTime)) {
        setSelectedTime('');
      }
    }
  }, [selectedDate, selectedTime, displayTimeSlots, setSelectedTime]);

  // Log slots for debugging
  useEffect(() => {
    if (timeSlots.length > 0) {
      console.log('Time slots received in TimeSlotsGrid:', timeSlots);
    }
    
    if (displayTimeSlots.length > 0) {
      console.log('Display time slots after filtering:', displayTimeSlots);
    }
  }, [timeSlots, displayTimeSlots]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner className="h-8 w-8" />
        <span className="ml-2 text-muted-foreground">Loading available times...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 border rounded-md bg-muted">
        <p className="text-muted-foreground">{error}</p>
        <p className="text-sm mt-2">Please select another date or barber.</p>
      </div>
    );
  }

  if (displayTimeSlots.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-muted">
        <p className="text-muted-foreground">
          {getNoTimeSlotsMessage(selectedDate)}
        </p>
        <p className="text-sm mt-2">Please select another date or barber.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {displayTimeSlots.map((time) => (
        <TimeSlot 
          key={time} 
          time={time} 
          selected={selectedTime === time}
          onClick={() => setSelectedTime(time)}
          disabled={false} // Already filtered out unavailable slots
        />
      ))}
    </div>
  );
};

export default TimeSlotsGrid;
