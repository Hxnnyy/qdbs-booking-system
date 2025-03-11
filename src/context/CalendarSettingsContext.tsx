
import React, { createContext, useContext, useState } from 'react';

interface CalendarSettings {
  startHour: number;
  endHour: number;
  updateStartHour: (hour: number) => void;
  updateEndHour: (hour: number) => void;
}

export const CalendarSettingsContext = createContext<CalendarSettings | undefined>(undefined);

export const CalendarSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [startHour, setStartHour] = useState(8); // Default: 8 AM
  const [endHour, setEndHour] = useState(22); // Default: 10 PM

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

  return (
    <CalendarSettingsContext.Provider 
      value={{ 
        startHour, 
        endHour, 
        updateStartHour, 
        updateEndHour 
      }}
    >
      {children}
    </CalendarSettingsContext.Provider>
  );
};
