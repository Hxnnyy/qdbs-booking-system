
import React from 'react';

interface TimeSlotProps {
  time: string;
  selected: string | boolean;
  onClick: () => void;
  disabled?: boolean;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ time, selected, onClick, disabled = false }) => {
  // Convert selected to boolean if it's a string comparison
  const isSelected = typeof selected === 'string' ? selected === time : !!selected;
  
  return (
    <button
      className={`p-2 rounded border transition-colors ${
        isSelected 
          ? 'bg-burgundy text-white border-burgundy' 
          : 'bg-secondary text-foreground border-input hover:bg-secondary/80'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {time}
    </button>
  );
};

export default TimeSlot;
