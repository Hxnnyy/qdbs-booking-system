
import { useContext } from 'react';
import { CalendarSettingsContext } from '@/context/CalendarSettingsContext';

export const useCalendarSettings = () => {
  const context = useContext(CalendarSettingsContext);
  if (context === undefined) {
    throw new Error('useCalendarSettings must be used within a CalendarSettingsProvider');
  }
  return context;
};
