import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';
import { Clock, Calendar as CalendarIcon, User, Users, ClipboardList, Tag, Save, X, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getBarberColor } from '@/utils/calendarUtils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBooking?: (
    bookingId: string, 
    updates: { 
      title?: string; 
      barber_id?: string; 
      service_id?: string; 
      notes?: string;
      booking_date?: string;
      booking_time?: string;
    }
  ) => Promise<boolean>;
}

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({ 
  event, 
  isOpen, 
  onClose,
  onUpdateBooking
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { barbers } = useBarbers();
  const { services } = useServices();
  
  const [editForm, setEditForm] = useState({
    title: '',
    barber_id: '',
    service_id: '',
    notes: '',
    booking_time: '',
    booking_date: ''
  });
  
  React.useEffect(() => {
    if (event) {
      setEditForm({
        title: event.title.replace('Guest: ', ''),
        barber_id: event.barberId,
        service_id: event.serviceId,
        notes: event.notes || '',
        booking_time: format(event.start, 'HH:mm'),
        booking_date: format(event.start, 'yyyy-MM-dd')
      });
      setIsEditing(false);
    }
  }, [event]);
  
  if (!event) return null;
  
  const barberColor = getBarberColor(event.barberId);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
    if (!event || !onUpdateBooking) return;
    
    try {
      setIsLoading(true);
      
      const updates = {
        title: editForm.title !== event.title.replace('Guest: ', '') ? 
          (event.isGuest ? `Guest: ${editForm.title}` : editForm.title) : undefined,
        barber_id: editForm.barber_id !== event.barberId ? editForm.barber_id : undefined,
        service_id: editForm.service_id !== event.serviceId ? editForm.service_id : undefined,
        notes: editForm.notes !== event.notes ? editForm.notes : undefined,
        booking_date: editForm.booking_date !== format(event.start, 'yyyy-MM-dd') ? 
          editForm.booking_date : undefined,
        booking_time: editForm.booking_time !== format(event.start, 'HH:mm') ? 
          editForm.booking_time : undefined
      };
      
      const hasChanges = Object.values(updates).some(value => value !== undefined);
      
      if (!hasChanges) {
        toast.info('No changes to save');
        setIsEditing(false);
        return;
      }
      
      const success = await onUpdateBooking(event.id, 
        Object.fromEntries(
          Object.entries(updates).filter(([_, v]) => v !== undefined)
        )
      );
      
      if (success) {
        toast.success('Booking updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isEditing) {
    return (
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
            setIsEditing(false);
          }
        }}
      >
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              Edit Booking
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Client Name</label>
                <Input 
                  id="title" 
                  name="title" 
                  value={editForm.title} 
                  onChange={handleInputChange} 
                  placeholder="Client Name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="barber_id" className="text-sm font-medium">Barber</label>
                <Select 
                  value={editForm.barber_id} 
                  onValueChange={(value) => handleSelectChange('barber_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Barber" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbers.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id}>
                        {barber.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="service_id" className="text-sm font-medium">Service</label>
                <Select 
                  value={editForm.service_id} 
                  onValueChange={(value) => handleSelectChange('service_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} (${service.price} - {service.duration} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="booking_date" className="text-sm font-medium">Date</label>
                  <Input 
                    id="booking_date" 
                    name="booking_date" 
                    type="date" 
                    value={editForm.booking_date} 
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="booking_time" className="text-sm font-medium">Time</label>
                  <Input 
                    id="booking_time" 
                    name="booking_time" 
                    type="time" 
                    value={editForm.booking_time} 
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  value={editForm.notes} 
                  onChange={handleInputChange} 
                  placeholder="Add booking notes..."
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setIsEditing(false);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Booking Details
          </DialogTitle>
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
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onUpdateBooking && (
              <Button 
                variant="default" 
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Booking
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
