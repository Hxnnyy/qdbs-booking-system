
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { LunchBreak, InsertableLunchBreak } from '@/supabase-types';
import { Switch } from '@/components/ui/switch';

interface LunchBreakFormProps {
  barberId: string;
  onSaved?: () => void;
}

export const LunchBreakForm: React.FC<LunchBreakFormProps> = ({ barberId, onSaved }) => {
  const [lunchBreak, setLunchBreak] = useState<LunchBreak | null>(null);
  const [startTime, setStartTime] = useState('12:00');
  const [duration, setDuration] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLunchBreak();
  }, [barberId]);

  const fetchLunchBreak = async () => {
    try {
      setIsLoading(true);
      
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('barber_lunch_breaks')
        .select('*')
        .eq('barber_id', barberId)
        .maybeSingle(); // Use maybeSingle instead of single to prevent error if no record
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      if (data) {
        setLunchBreak(data);
        setStartTime(data.start_time);
        setDuration(data.duration);
        setIsActive(data.is_active);
      }
    } catch (err: any) {
      console.error('Error loading lunch break:', err);
      toast.error('Error loading lunch break settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Convert duration to number to ensure correct data type
      const durationNum = Number(duration);
      
      if (isNaN(durationNum) || durationNum <= 0) {
        toast.error('Please enter a valid duration');
        return;
      }
      
      // If we already have a lunch break, update it
      if (lunchBreak) {
        // @ts-ignore - Supabase types issue
        const { error } = await supabase
          .from('barber_lunch_breaks')
          .update({
            start_time: startTime,
            duration: durationNum,
            is_active: isActive
          })
          .eq('id', lunchBreak.id);
          
        if (error) throw error;
      } else {
        // Create a new lunch break
        const newBreak: InsertableLunchBreak = {
          barber_id: barberId,
          start_time: startTime,
          duration: durationNum,
          is_active: isActive
        };
        
        // @ts-ignore - Supabase types issue
        const { error } = await supabase
          .from('barber_lunch_breaks')
          .insert(newBreak);
          
        if (error) throw error;
      }
      
      toast.success('Lunch break settings saved');
      fetchLunchBreak(); // Reload to get the updated data
      
      if (onSaved) {
        onSaved();
      }
    } catch (err: any) {
      console.error('Error saving lunch break:', err);
      toast.error('Error saving lunch break settings');
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
        <h3 className="text-lg font-medium">Lunch Break Settings</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="is-active">Enable Lunch Break</Label>
          <Switch 
            id="is-active"
            checked={isActive} 
            onCheckedChange={setIsActive}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="start-time">Start Time</Label>
          <Input 
            id="start-time"
            type="time" 
            value={startTime} 
            onChange={(e) => setStartTime(e.target.value)}
            disabled={!isActive}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input 
            id="duration"
            type="number" 
            value={duration.toString()} 
            onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
            min="15"
            max="120"
            step="15"
            disabled={!isActive}
          />
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save Lunch Break Settings'}
        </Button>
      </div>
    </div>
  );
};
