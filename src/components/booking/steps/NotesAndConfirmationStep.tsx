
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { BookingStepProps, BookingFormState } from '@/types/booking';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Spinner } from '@/components/ui/spinner';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';

interface NotesAndConfirmationStepProps extends BookingStepProps {
  notes: string;
  setNotes: (notes: string) => void;
  formData: BookingFormState;
  barbers: Barber[];
  services: Service[];
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const NotesAndConfirmationStep: React.FC<NotesAndConfirmationStepProps> = ({ 
  notes, 
  setNotes, 
  formData, 
  barbers,
  services,
  isLoading,
  onSubmit,
  onBack
}) => {
  // Find selected barber and service without using hooks
  const selectedBarber = formData.selectedBarber === 'any'
    ? { name: 'Any Available Barber', id: 'any' } as Barber
    : barbers.find(b => b.id === formData.selectedBarber);
    
  const selectedService = services.find(s => s.id === formData.selectedService);

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xl font-semibold font-playfair">Booking Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Barber</h4>
              <p className="font-medium">
                {selectedBarber ? selectedBarber.name : formData.selectedBarber === 'any' ? 'Any Available Barber' : 'Selected Barber'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Service</h4>
              <p className="font-medium">{selectedService?.name || 'Selected Service'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Date</h4>
              <p className="font-medium">
                {formData.selectedDate ? format(formData.selectedDate, 'EEEE, MMMM d, yyyy') : ''}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Time</h4>
              <p className="font-medium">{formData.selectedTime}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Name</h4>
              <p className="font-medium">{formData.guestName}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact</h4>
              <p className="font-medium">{formData.guestPhone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">Additional Notes (optional)</label>
        <Textarea
          id="notes"
          placeholder="Any special requests or information for your barber..."
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        
        <Button 
          onClick={onSubmit}
          className="bg-burgundy hover:bg-burgundy-light"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Processing...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotesAndConfirmationStep;
