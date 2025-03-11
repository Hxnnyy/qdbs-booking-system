
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Holiday {
  id: string;
  barber_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}

interface HolidayFormProps {
  barberId: string;
  onSaved?: () => void;
}

export const HolidayForm: React.FC<HolidayFormProps> = ({ barberId, onSaved }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  
  const today = new Date();
  
  // Fetch existing holidays
  const fetchHolidays = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('barber_holidays')
        .select('*')
        .eq('barber_id', barberId)
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      
      setHolidays(data || []);
    } catch (err: any) {
      console.error('Error fetching holidays:', err);
      toast.error('Failed to load holiday data');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHolidays();
  }, [barberId]);
  
  const resetForm = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setReason('');
    setEditingHoliday(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    
    // Validate that startDate is before or equal to endDate
    if (isAfter(startDate, endDate)) {
      toast.error('Start date must be before or equal to end date');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      if (editingHoliday) {
        // Update existing holiday
        const { error } = await supabase
          .from('barber_holidays')
          .update({
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            reason: reason || null
          })
          .eq('id', editingHoliday.id);
        
        if (error) throw error;
        
        toast.success('Holiday updated successfully');
      } else {
        // Create new holiday
        const { error } = await supabase
          .from('barber_holidays')
          .insert({
            barber_id: barberId,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            reason: reason || null
          });
        
        if (error) throw error;
        
        toast.success('Holiday added successfully');
      }
      
      // Reset form and refresh data
      resetForm();
      await fetchHolidays();
      
      if (onSaved) {
        onSaved();
      }
    } catch (err: any) {
      console.error('Error saving holiday:', err);
      toast.error(err.message || 'Failed to save holiday');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (holidayId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('barber_holidays')
        .delete()
        .eq('id', holidayId);
      
      if (error) throw error;
      
      toast.success('Holiday deleted successfully');
      await fetchHolidays();
      
      // If we were editing this holiday, reset the form
      if (editingHoliday?.id === holidayId) {
        resetForm();
      }
    } catch (err: any) {
      console.error('Error deleting holiday:', err);
      toast.error(err.message || 'Failed to delete holiday');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setStartDate(new Date(holiday.start_date));
    setEndDate(new Date(holiday.end_date));
    setReason(holiday.reason || '');
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-medium">
          {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !startDate ? 'text-muted-foreground' : ''
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => isBefore(date, today)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !endDate ? 'text-muted-foreground' : ''
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => startDate ? isBefore(date, startDate) : isBefore(date, today)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Vacation, training, etc."
            rows={2}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            type="submit" 
            disabled={isLoading || !startDate || !endDate}
          >
            {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
          </Button>
          
          {editingHoliday && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
      
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-2">Scheduled Holidays</h3>
        
        {isLoading && !holidays.length ? (
          <div className="flex justify-center py-4">
            <Spinner className="h-6 w-6" />
          </div>
        ) : holidays.length === 0 ? (
          <p className="text-muted-foreground text-sm">No holidays scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {holidays.map((holiday) => (
              <div
                key={holiday.id}
                className="border rounded-md p-3 flex justify-between"
              >
                <div>
                  <div className="font-medium">
                    {format(new Date(holiday.start_date), 'MMM d, yyyy')} -
                    {format(new Date(holiday.end_date), 'MMM d, yyyy')}
                  </div>
                  {holiday.reason && (
                    <div className="text-sm text-muted-foreground">{holiday.reason}</div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(holiday)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(holiday.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
