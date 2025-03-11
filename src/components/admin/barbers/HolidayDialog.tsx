
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';

interface HolidayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: Date, endDate: Date) => void;
}

export const HolidayDialog: React.FC<HolidayDialogProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [existingServiceId, setExistingServiceId] = useState<string | null>(null);

  // Fetch an existing service ID from the database when the dialog opens
  useEffect(() => {
    const fetchServiceId = async () => {
      if (!isOpen) return;
      
      try {
        setIsLoading(true);
        
        // Get the first active service from the database
        const { data: services, error } = await supabase
          .from('services')
          .select('id')
          .eq('active', true)
          .limit(1);
        
        if (error) {
          console.error('Error fetching service ID:', error);
          toast.error('Failed to fetch service ID for holiday booking');
          return;
        }
        
        if (services && services.length > 0) {
          setExistingServiceId(services[0].id);
        } else {
          toast.error('No active services found. Please create at least one service before booking holidays.');
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServiceId();
  }, [isOpen]);

  const handleSave = () => {
    if (startDate && endDate) {
      if (!existingServiceId) {
        toast.error('No active service found. Cannot book holiday.');
        return;
      }
      
      onSave(startDate, endDate);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Holiday</DialogTitle>
          <DialogDescription>
            Set the start and end dates for the barber's holiday period.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleSave}
                disabled={!startDate || !endDate || !existingServiceId}
              >
                Save Holiday
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
