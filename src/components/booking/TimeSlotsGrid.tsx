
import React, { useEffect, useState } from 'react';
import TimeSlot from '../TimeSlot';
import { Spinner } from '@/components/ui/spinner';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import { isSameDay } from 'date-fns';
import { getNoTimeSlotsMessage, hasLunchBreakConflict } from '@/utils/bookingTimeUtils';
import { supabase } from '@/integrations/supabase/client';

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
  const [lunchBreaks, setLunchBreaks] = useState<any[]>([]);
  const [displayTimeSlots, setDisplayTimeSlots] = useState<string[]>([]);
  const [isLoadingLunchBreaks, setIsLoadingLunchBreaks] = useState(false);
  const timeSlots = availableTimeSlots || [];

  // Fetch lunch breaks on component mount or when barber changes
  useEffect(() => {
    if (selectedBarberId) {
      setIsLoadingLunchBreaks(true);
      
      const fetchLunchBreaks = async () => {
        try {
          const { data, error } = await supabase
            .from('barber_lunch_breaks')
            .select('*')
            .eq('barber_id', selectedBarberId)
            .eq('is_active', true);
            
          if (error) throw error;
          console.log('Lunch breaks fetched in TimeSlotsGrid:', data);
          setLunchBreaks(data || []);
        } catch (err) {
          console.error('Error fetching lunch breaks:', err);
          setLunchBreaks([]);
        } finally {
          setIsLoadingLunchBreaks(false);
        }
      };
      
      fetchLunchBreaks();
    }
  }, [selectedBarberId]);

  // Filter time slots by lunch breaks locally
  useEffect(() => {
    if (timeSlots.length > 0) {
      // Filter out time slots that conflict with lunch breaks
      let filteredSlots = [...timeSlots];
      
      if (lunchBreaks && lunchBreaks.length > 0 && serviceDuration) {
        console.log(`Filtering ${timeSlots.length} time slots against ${lunchBreaks.length} lunch breaks`);
        
        filteredSlots = timeSlots.filter(slot => {
          const hasLunchConflict = hasLunchBreakConflict(slot, lunchBreaks, serviceDuration);
          
          if (hasLunchConflict) {
            console.log(`Slot ${slot} conflicts with lunch break, filtering out`);
            return false;
          }
          
          return true;
        });
        
        console.log(`After lunch break filtering: ${filteredSlots.length} slots remain`);
      }
      
      setDisplayTimeSlots(filteredSlots);
    } else {
      setDisplayTimeSlots([]);
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

  if (isLoading || isLoadingLunchBreaks) {
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
          data-lunch-filtered="true" // For debugging
        />
      ))}
    </div>
  );
};

export default TimeSlotsGrid;
