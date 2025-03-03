
import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface TimeSlotData {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
}

interface TimeSlotProps {
  slot: TimeSlotData;
  selected: boolean;
  onSelect: (slot: TimeSlotData) => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ slot, selected, onSelect }) => {
  const formattedTime = format(slot.startTime, 'h:mm a');
  
  // Determine the appropriate styling based on status
  const baseClass = "rounded-full py-2 px-4 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary";
  
  const statusClass = slot.isAvailable
    ? selected
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-foreground hover:bg-primary/10"
    : "bg-muted text-muted-foreground cursor-not-allowed opacity-60";
  
  return (
    <motion.button
      type="button"
      disabled={!slot.isAvailable}
      onClick={() => slot.isAvailable && onSelect(slot)}
      className={cn(baseClass, statusClass)}
      whileHover={slot.isAvailable && !selected ? { scale: 1.05 } : {}}
      whileTap={slot.isAvailable ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {formattedTime}
    </motion.button>
  );
};

export default TimeSlot;
