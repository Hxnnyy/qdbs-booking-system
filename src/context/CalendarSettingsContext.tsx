
import React, { createContext, useContext, useState } from 'react';

interface CalendarSettings {
  startHour: number;
  endHour: number;
  autoScrollToCurrentTime: boolean;
  updateStartHour: (hour: number) => void;
  updateEndHour: (hour: number) => void;
  toggleAutoScroll: () => void;
}

const CalendarSettingsContext = createContext<CalendarSettings | undefined>(undefined);

export const CalendarSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [startHour, setStartHour] = useState(8); // Default: 8 AM
  const [endHour, setEndHour] = useState(22); // Default: 10 PM
  const [autoScrollToCurrentTime, setAutoScrollToCurrentTime] = useState(false); // Default: disabled

  const updateStartHour = (hour: number) => {
    if (hour < endHour - 1) {
      setStartHour(hour);
    }
  };

  const updateEndHour = (hour: number) => {
    if (hour > startHour + 1) {
      setEndHour(hour);
    }
  };

  const toggleAutoScroll = () => {
    setAutoScrollToCurrentTime(prev => !prev);
  };

  return (
    <CalendarSettingsContext.Provider 
      value={{ 
        startHour, 
        endHour, 
        autoScrollToCurrentTime,
        updateStartHour, 
        updateEndHour,
        toggleAutoScroll
      }}
    >
      {children}
    </CalendarSettingsContext.Provider>
  );
};

export const useCalendarSettings = () => {
  const context = useContext(CalendarSettingsContext);
  if (context === undefined) {
    throw new Error('useCalendarSettings must be used within a CalendarSettingsProvider');
  }
  return context;
};
