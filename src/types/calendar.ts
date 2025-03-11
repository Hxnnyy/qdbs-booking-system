
import { format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  barber: string;
  barberId: string;
  barberColor?: string;
  service: string;
  serviceId: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'lunch-break' | 'error';
  isGuest: boolean;
  notes: string;
  userId: string;
  resourceId?: string;
  allDay?: boolean;
}

export interface CalendarViewProps {
  date: Date;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
  onEventDrop: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export interface DragPreview {
  time: string;
  top: number;
  columnIndex?: number;
}

// Add the missing ViewMode type
export type ViewMode = 'day' | 'week';
