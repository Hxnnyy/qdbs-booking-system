
import React from 'react';
import { TimeSlotProps } from '@/types/booking';
import { cn } from '@/lib/utils';

const TimeSlot: React.FC<TimeSlotProps> = ({ time, selected, onClick, disabled = false }) => {
  return (
    <button
      className={cn(
        "p-2 rounded border transition-colors w-full text-center",
        selected === time 
          ? "bg-burgundy text-white border-burgundy hover:bg-burgundy-light" 
          : "bg-secondary text-foreground border-input hover:bg-secondary/80",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {time}
    </button>
  );
};

export default TimeSlot;
