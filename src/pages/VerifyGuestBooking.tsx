
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import VerificationForm from '@/components/guest-booking/VerificationForm';
import BookingStatusCard from '@/components/guest-booking/BookingStatusCard';
import { useManageGuestBooking } from '@/hooks/useManageGuestBooking';
import ModifyBookingDialog from '@/components/guest-booking/ModifyBookingDialog';
import { Spinner } from '@/components/ui/spinner';

const VerifyGuestBooking = () => {
  const { bookingId = '' } = useParams<{ bookingId: string }>();
  const [verificationCode, setVerificationCode] = React.useState('');
  const [phone, setPhone] = React.useState('');
  
  const {
    booking,
    formattedBookingDateTime,
    isLoading,
    error,
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
  } = useManageGuestBooking(bookingId, verificationCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Verification logic is handled in the hook
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
