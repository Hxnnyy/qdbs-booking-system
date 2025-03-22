
import React from 'react';
import { TimeSlotProps } from '@/types/booking';
import { cn } from '@/lib/utils';

const TimeSlot: React.FC<TimeSlotProps> = ({ time, selected, onClick, disabled = false }) => {
  // Convert selected to boolean if it's a string comparison
  const isSelected = typeof selected === 'string' ? selected === time : !!selected;
  
  return (
    <button
      className={cn(
        "p-2 rounded border transition-colors w-full text-center",
        isSelected
          ? "bg-burgundy text-white border-burgundy hover:bg-burgundy-light" 
          : "bg-secondary text-foreground border-input hover:bg-secondary/80",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
      onClick={onClick}
      disabled={disabled}
      data-time={time}
      data-testid={`time-slot-${time}`}
      data-selected={isSelected}
    >
      {time}
    </button>
  );
};

export default TimeSlot;
