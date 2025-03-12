
import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { BookingStepProps, BookingFormState } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';

interface NotesAndConfirmationStepProps extends BookingStepProps {
  notes: string;
  setNotes: (notes: string) => void;
  formData: BookingFormState;
  barbers: Barber[];
  services: Service[];
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void; // Changed from Promise<void> to void
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
  const { selectedBarber, selectedService, selectedDate, selectedTime, guestName, guestPhone } = formData;
  
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4 font-playfair">Additional Notes (Optional)</h3>
        <textarea
          className="w-full p-2 border rounded-md"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requests or information for your barber..."
        />
      </div>
      
      <div className="pt-4">
        <h3 className="text-xl font-bold mb-4 font-playfair">Review Your Booking</h3>
        <div className="bg-gray-100 p-4 rounded-md border text-gray-800">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Barber</div>
            <div className="text-sm">{barbers.find(b => b.id === selectedBarber)?.name}</div>
            
            <div className="text-sm font-medium">Service</div>
            <div className="text-sm">{services.find(s => s.id === selectedService)?.name}</div>
            
            <div className="text-sm font-medium">Date</div>
            <div className="text-sm">{selectedDate ? format(selectedDate, 'EEEE, MMMM do, yyyy') : ''}</div>
            
            <div className="text-sm font-medium">Time</div>
            <div className="text-sm">{selectedTime}</div>
            
            <div className="text-sm font-medium">Name</div>
            <div className="text-sm">{guestName}</div>
            
            <div className="text-sm font-medium">Phone</div>
            <div className="text-sm">{guestPhone}</div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-4">
        <Button 
          type="button"
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        
        <Button 
          type="submit" 
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
    </form>
  );
};

export default NotesAndConfirmationStep;
