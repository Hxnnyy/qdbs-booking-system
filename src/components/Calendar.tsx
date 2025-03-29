import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  value?: Date;
  onChange: (date: Date) => void;
  availableDates?: string[];
  minDate?: Date;
  maxDate?: Date;
}

const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  availableDates = [],
  minDate = new Date(),
  maxDate = addMonths(new Date(), 3),
}) => {
  // Initialize currentMonth with value if provided, otherwise use the current date
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  
  // Update currentMonth when value changes externally
  useEffect(() => {
    if (value) {
      setCurrentMonth(value);
    }
  }, [value]);
  
  // Parse the available dates if they're strings
  const parsedAvailableDates = availableDates.map(date => 
    typeof date === 'string' ? parseISO(date) : date
  );
  
  // Navigation functions
  const goToPreviousMonth = () => {
    const previousMonth = subMonths(currentMonth, 1);
    if (previousMonth >= minDate) {
      setCurrentMonth(previousMonth);
    }
  };
  
  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (nextMonth <= maxDate) {
      setCurrentMonth(nextMonth);
    }
  };
  
  // Generate days to display
  const generateDaysForMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = monthStart;
    const endDate = monthEnd;
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Add empty placeholders for days of the week before the first day
    const firstDayOfMonth = getDay(monthStart);
    const emptyDays = Array(firstDayOfMonth).fill(null);
    
    return [...emptyDays, ...days];
  };
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = generateDaysForMonth();
  
  // Check if a date is available
  const isDateAvailable = (date: Date) => {
    return parsedAvailableDates.some(availableDate => 
      availableDate && isSameDay(availableDate, date)
    );
  };
  
  // Check if a date is selectable (within range and available)
  const isDateSelectable = (date: Date) => {
    const isInRange = date >= minDate && date <= maxDate;
    const isAvailable = parsedAvailableDates.length > 0 ? isDateAvailable(date) : true;
    return isInRange && isAvailable;
  };

  // Handle date selection without changing the month
  const handleDateSelection = (date: Date) => {
    onChange(date);
    // We don't need to update currentMonth here anymore
    // as we want to keep the current view
  };
  
  return (
    <div className="glass rounded-lg shadow-subtle border border-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={goToPreviousMonth}
          disabled={isSameMonth(currentMonth, minDate)}
          className={cn(
            "p-1 rounded-full transition-all duration-200",
            isSameMonth(currentMonth, minDate)
              ? "text-muted-foreground opacity-50 cursor-not-allowed"
              : "text-foreground hover:bg-secondary"
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button
          type="button"
          onClick={goToNextMonth}
          disabled={isSameMonth(currentMonth, maxDate)}
          className={cn(
            "p-1 rounded-full transition-all duration-200",
            isSameMonth(currentMonth, maxDate)
              ? "text-muted-foreground opacity-50 cursor-not-allowed"
              : "text-foreground hover:bg-secondary"
          )}
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={format(currentMonth, 'yyyy-MM')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-7 gap-1 col-span-7"
          >
            {calendarDays.map((day, index) => {
              if (!day) {
                // Empty cell for days before the start of the month
                return <div key={`empty-${index}`} className="h-10 sm:h-12" />;
              }
              
              const isSelected = value ? isSameDay(day, value) : false;
              const selectable = isDateSelectable(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              
              return (
                <motion.button
                  key={day.toString()}
                  type="button"
                  onClick={() => selectable && handleDateSelection(day)}
                  disabled={!selectable}
                  className={cn(
                    "flex items-center justify-center h-10 sm:h-12 rounded-full text-sm transition-all duration-300 relative",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : selectable
                      ? "hover:bg-secondary"
                      : "text-muted-foreground cursor-not-allowed",
                    !isCurrentMonth && "opacity-30"
                  )}
                  whileHover={selectable ? { scale: 1.1 } : {}}
                  whileTap={selectable ? { scale: 0.95 } : {}}
                >
                  {format(day, 'd')}
                  {isDateAvailable(day) && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Calendar;
