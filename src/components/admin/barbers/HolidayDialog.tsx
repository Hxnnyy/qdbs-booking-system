
import React, { useState, useEffect } from 'react';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/supabase-types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface HolidayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: Date, endDate: Date) => void;
  barberId: string;
}

export const HolidayDialog: React.FC<HolidayDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  barberId,
}) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [holidays, setHolidays] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset state when dialog opens or closes
  useEffect(() => {
    if (!isOpen) {
      setStartDate(undefined);
      setEndDate(undefined);
    } else {
      // Fetch existing holidays when dialog opens
      fetchHolidays();
    }
  }, [isOpen, barberId]);

  const fetchHolidays = async () => {
    if (!barberId) return;
    
    setLoading(true);
    try {
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('barber_id', barberId)
        .eq('status', 'holiday')
        .order('booking_date', { ascending: true });
        
      if (error) throw error;
      setHolidays(data || []);
    } catch (err: any) {
      console.error('Error fetching holidays:', err);
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (startDate && endDate) {
      onSave(startDate, endDate);
      setStartDate(undefined);
      setEndDate(undefined);
      // Refetch holidays after saving
      setTimeout(fetchHolidays, 1000);
    }
  };
  
  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', holidayId);
        
      if (error) throw error;
      
      toast.success('Holiday removed successfully');
      fetchHolidays();
    } catch (err: any) {
      console.error('Error deleting holiday:', err);
      toast.error('Failed to remove holiday');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Manage Holidays</DialogTitle>
          <DialogDescription>
            Add or remove holiday periods for this barber
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-4 py-4">
          <div className="space-y-4">
            <h3 className="font-medium">Schedule a Holiday</h3>
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                className="rounded-md border"
                disabled={(date) => date < new Date()}
              />
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                className="rounded-md border"
                disabled={(date) => !startDate || date < startDate}
              />
            </div>
            <Button 
              onClick={handleSave}
              disabled={!startDate || !endDate}
              className="w-full"
            >
              Add Holiday Period
            </Button>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Existing Holidays</h3>
            <ScrollArea className="h-[300px] border rounded-md p-2">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <p>Loading...</p>
                </div>
              ) : holidays.length === 0 ? (
                <div className="flex justify-center items-center h-full text-muted-foreground">
                  <p>No holidays scheduled</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {holidays.map((holiday) => (
                    <div key={holiday.id} className="flex justify-between items-center p-2 border rounded-md">
                      <div>
                        <Badge className="mb-1">Holiday</Badge>
                        <p className="text-sm">
                          {format(new Date(holiday.booking_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteHoliday(holiday.id)}
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
