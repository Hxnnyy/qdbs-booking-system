
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useCreateGuestBooking } from '@/hooks/useCreateGuestBooking';
import { BookingFormState } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';
import { Spinner } from '@/components/ui/spinner';

interface NotesAndConfirmationStepProps {
  notes: string;
  setNotes: (notes: string) => void;
  formData: BookingFormState;
  barbers: Barber[];
  services: Service[];
  isLoading: boolean;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  onNext: () => void;
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
  const { selectedBarber, selectedService, selectedDate, selectedTime, guestName, guestPhone, guestEmail } = formData;
  
  const selectedBarberData = barbers.find(b => b.id === selectedBarber);
  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <Textarea
            id="notes"
            placeholder="Any special requests or notes for your appointment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span>
              <p>{guestName}</p>
            </div>
            <div>
              <span className="font-medium">Phone:</span>
              <p>{guestPhone}</p>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <p>{guestEmail}</p>
            </div>
            <div>
              <span className="font-medium">Barber:</span>
              <p>{selectedBarberData?.name}</p>
            </div>
            <div>
              <span className="font-medium">Service:</span>
              <p>{selectedServiceData?.name}</p>
            </div>
            <div>
              <span className="font-medium">Duration:</span>
              <p>{selectedServiceData?.duration} minutes</p>
            </div>
            <div>
              <span className="font-medium">Date:</span>
              <p>{selectedDate ? format(selectedDate, 'EEEE, MMMM do, yyyy') : ''}</p>
            </div>
            <div>
              <span className="font-medium">Time:</span>
              <p>{selectedTime}</p>
            </div>
          </div>
          
          {notes && (
            <div>
              <span className="font-medium text-sm">Notes:</span>
              <p className="text-sm text-gray-600 mt-1">{notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button 
          type="button" 
          onClick={onSubmit}
          disabled={isLoading}
          className="bg-burgundy hover:bg-burgundy-dark text-white"
        >
          {isLoading ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Confirming Booking...
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
