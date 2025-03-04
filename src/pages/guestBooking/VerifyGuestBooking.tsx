
import React from 'react';
import Layout from '@/components/Layout';
import VerificationForm from './components/VerificationForm';
import BookingsList from './components/BookingsList';
import { useVerifyGuestBooking } from './hooks/useVerifyGuestBooking';

const VerifyGuestBooking = () => {
  const {
    phone,
    setPhone,
    code,
    setCode,
    bookings,
    isVerified,
    isLoading,
    isCancelling,
    handleVerify,
    handleCancelBooking,
    resetVerification
  } = useVerifyGuestBooking();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 font-playfair">Manage Guest Booking</h1>
        <p className="text-muted-foreground mb-8 font-playfair">
          Enter your phone number and booking code to view or manage your booking
        </p>
        
        {!isVerified ? (
          <VerificationForm
            phone={phone}
            code={code}
            isLoading={isLoading}
            onPhoneChange={setPhone}
            onCodeChange={setCode}
            onSubmit={handleVerify}
          />
        ) : (
          <BookingsList
            bookings={bookings}
            isCancelling={isCancelling}
            onCancelBooking={handleCancelBooking}
            onVerifyAnother={resetVerification}
          />
        )}
      </div>
    </Layout>
  );
};

export default VerifyGuestBooking;
