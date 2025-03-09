
import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';
import { Clock, Calendar as CalendarIcon, User, Users, ClipboardList, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getBarberColor } from '@/utils/calendarUtils';

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({ 
  event, 
  isOpen, 
  onClose 
}) => {
  if (!event) return null;
  
  const barberColor = getBarberColor(event.barberId);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4">
            <div 
              className="w-4 h-4 rounded-full mt-1 flex-shrink-0" 
              style={{ backgroundColor: barberColor }}
            />
            <div>
              <h3 className="text-lg font-medium">{event.title}</h3>
              <p className="text-sm text-muted-foreground">{event.service}</p>
            </div>
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{format(event.start, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {event.isGuest ? (
                <Users className="h-4 w-4 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">
                {event.isGuest ? 'Guest Booking' : 'Client Booking'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{event.status}</Badge>
            </div>
          </div>
          
          {event.notes && (
            <div className="pt-2">
              <div className="flex items-start gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <span className="text-sm font-medium">Notes:</span>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{event.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
