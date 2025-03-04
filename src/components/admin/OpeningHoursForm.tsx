import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OpeningHour {
  id?: string;
  barber_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface OpeningHoursFormProps {
  barberId: string;
  onSaved?: () => void;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const OpeningHoursForm: React.FC<OpeningHoursFormProps> = ({ barberId, onSaved }) => {
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchOpeningHours();
  }, [barberId]);

  const fetchOpeningHours = async () => {
    try {
      setIsLoading(true);
      
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('opening_hours')
        .select('*')
        .eq('barber_id', barberId)
        .order('day_of_week');
      
      if (error) throw error;
      
      // If we have existing hours, use them
      if (data && data.length > 0) {
        setOpeningHours(data);
      } else {
        // Otherwise create default hours for all days
        const defaultHours = DAYS_OF_WEEK.map((_, index) => ({
          barber_id: barberId,
          day_of_week: index,
          open_time: '09:00',
          close_time: '17:00',
          is_closed: index === 0, // Default Sunday as closed
        }));
        
        setOpeningHours(defaultHours);
      }
    } catch (err: any) {
      toast.error('Error loading opening hours: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = (dayIndex: number, field: 'open_time' | 'close_time', value: string) => {
    setOpeningHours(prev => 
      prev.map((day, index) => 
        index === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  const handleClosedToggle = (dayIndex: number, checked: boolean) => {
    setOpeningHours(prev => 
      prev.map((day, index) => 
        index === dayIndex ? { ...day, is_closed: checked } : day
      )
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // For each opening hour, either update or insert
      for (const hour of openingHours) {
        if (hour.id) {
          // Update existing opening hour
          // @ts-ignore - Supabase types issue
          const { error } = await supabase
            .from('opening_hours')
            .update({
              open_time: hour.open_time,
              close_time: hour.close_time,
              is_closed: hour.is_closed
            })
            .eq('id', hour.id);
            
          if (error) throw error;
        } else {
          // Insert new opening hour
          // @ts-ignore - Supabase types issue
          const { error } = await supabase
            .from('opening_hours')
            .insert({
              barber_id: barberId,
              day_of_week: hour.day_of_week,
              open_time: hour.open_time,
              close_time: hour.close_time,
              is_closed: hour.is_closed
            });
            
          if (error) throw error;
        }
      }
      
      toast.success('Opening hours saved successfully');
      
      if (onSaved) {
        onSaved();
      }
      
      // Refresh data to get IDs for newly inserted records
      await fetchOpeningHours();
    } catch (err: any) {
      toast.error('Error saving opening hours: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Opening Hours</h3>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Hours'}
        </Button>
      </div>
      
      <div className="space-y-4">
        {openingHours.map((day, index) => (
          <Card key={day.day_of_week}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">{DAYS_OF_WEEK[day.day_of_week]}</h4>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`closed-${day.day_of_week}`}
                    checked={day.is_closed} 
                    onCheckedChange={(checked) => handleClosedToggle(index, checked)}
                  />
                  <Label htmlFor={`closed-${day.day_of_week}`}>Closed</Label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`open-time-${day.day_of_week}`}>Open Time</Label>
                  <Input 
                    id={`open-time-${day.day_of_week}`}
                    type="time" 
                    value={day.open_time} 
                    onChange={(e) => handleTimeChange(index, 'open_time', e.target.value)}
                    disabled={day.is_closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`close-time-${day.day_of_week}`}>Close Time</Label>
                  <Input 
                    id={`close-time-${day.day_of_week}`}
                    type="time" 
                    value={day.close_time} 
                    onChange={(e) => handleTimeChange(index, 'close_time', e.target.value)}
                    disabled={day.is_closed}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
