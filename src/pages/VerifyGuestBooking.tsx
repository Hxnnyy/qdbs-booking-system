
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import VerificationForm from '@/components/guest-booking/VerificationForm';
import BookingStatusCard from '@/components/guest-booking/BookingStatusCard';
import { useManageGuestBooking } from '@/hooks/useManageGuestBooking';
import ModifyBookingDialog from '@/components/guest-booking/ModifyBookingDialog';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

const VerifyGuestBooking = () => {
  const { bookingId = '' } = useParams<{ bookingId: string }>();
  const [verificationCode, setVerificationCode] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  
  const {
    booking,
    formattedBookingDateTime,
    isLoading,
    isVerified,
    newBookingDate,
    setNewBookingDate,
    newBookingTime,
    setNewBookingTime,
    availableTimeSlots,
    isDialogOpen,
    setIsDialogOpen,
    isModifying,
    isCancelling,
    modifyBooking,
    cancelBooking,
    allCalendarEvents,
    verifyBooking,
  } = useManageGuestBooking(bookingId, verificationCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!phone || !verificationCode) {
      setError('Phone number and booking code are required');
      return;
    }
    
    try {
      console.log('Attempting to verify booking with:', {
        phone,
        code: verificationCode,
        bookingId
      });
      
      // Clean the phone number by removing spaces, dashes, etc.
      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
      
      // Fetch the booking information using just the code and phone number
      // instead of relying on the bookingId from URL which might be missing
      const result = await verifyBooking(cleanedPhone);
      console.log('Verification result:', result);
      
      if (!result) {
        setError('Booking verification failed. Please check your phone number and booking code.');
        toast.error('Verification failed');
      } else {
        toast.success('Booking verified successfully!');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed. Please check your details and try again.');
      toast.error('Verification failed');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 font-playfair">Manage Your Booking</h1>
        <p className="text-muted-foreground mb-8 font-playfair">
          Verify your booking to reschedule or cancel
        </p>
        
        {!isVerified ? (
          <VerificationForm
            phone={phone}
            code={verificationCode}
            isLoading={isLoading}
            onPhoneChange={setPhone}
            onCodeChange={setVerificationCode}
            onSubmit={handleSubmit}
            error={error || undefined}
          />
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <>
            <BookingStatusCard
              booking={booking}
              onModify={() => setIsDialogOpen(true)}
              onCancel={cancelBooking}
              isCancelling={isCancelling}
            />
            
            <ModifyBookingDialog
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              selectedBooking={booking}
              newBookingDate={newBookingDate}
              newBookingTime={newBookingTime}
              availableTimeSlots={availableTimeSlots}
              isModifying={isModifying}
              onDateChange={setNewBookingDate}
              onTimeSelection={setNewBookingTime}
              onModifyBooking={modifyBooking}
              allEvents={allCalendarEvents}
              barberId={booking?.barber_id}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default VerifyGuestBooking;
