import { CalendarEvent } from '@/types/calendar';
import { getBarberColor } from './barberColorUtils';

// Get a color for a specific event type
export const getEventColor = (event: CalendarEvent): string => {
  // For holiday events, use a distinct color
  if (event.status === 'holiday') {
    return 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red for holidays
  }
  
  // For lunch breaks, use barber-specific colors with transparency
  if (event.status === 'lunch-break') {
    // If the event has a barberColor property, use that with transparency
    if (event.barberColor) {
      // Convert hex to RGB if it's a hex color
      if (event.barberColor.startsWith('#')) {
        const r = parseInt(event.barberColor.slice(1, 3), 16);
        const g = parseInt(event.barberColor.slice(3, 5), 16);
        const b = parseInt(event.barberColor.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.5)`;
      }
      return `${event.barberColor.replace(')', ', 0.5)')}`;
    }
    return `rgba(${getBarberColor(event.barberId, true)}, 0.5)`;
  }
  
  // If the event has a barberColor property, use that
  if (event.barberColor) {
    return event.barberColor;
  }
  
  // Otherwise, fall back to the generated color
  return getBarberColor(event.barberId);
};
