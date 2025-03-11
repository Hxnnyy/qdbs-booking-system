
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  barber: string;
  barberId: string;
  service: string;
  serviceId: string;
  status: string;
  isGuest: boolean;
  notes: string;
  userId: string;
  resourceId: string; // For resource view (per barber rows)
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    notes?: string;
    [key: string]: any;
  };
}

export interface CalendarViewProps {
  date: Date;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
  onEventDrop: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export interface EventProps {
  event: CalendarEvent;
  onEventClick: (event: CalendarEvent) => void;
  isDragging?: boolean;
}

export type ViewMode = 'day' | 'week' | 'month';
