
import React, { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { useGuestBookings } from '@/hooks/useGuestBookings';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import VerificationForm from '@/components/guest-booking/VerificationForm';
import BookingsList from '@/components/guest-booking/BookingsList';
import ModifyBookingDialog from '@/components/guest-booking/ModifyBookingDialog';

const VerifyGuestBooking = () => {
  const { getGuestBookingByCode, cancelGuestBooking, updateGuestBooking, isLoading } = useGuestBookings();
  const { barbers } = useBarbers();
  const { services } = useServices();
  
  const [phone, setPhone] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isModifying, setIsModifying] = useState<boolean>(false);
  
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [newBookingDate, setNewBookingDate] = useState<Date | undefined>(undefined);
  const [newBookingTime, setNewBookingTime] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = i % 2 === 0 ? '00' : '30';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute} ${period}`;
  });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    if (!code.trim()) {
      toast.error('Please enter your booking code');
      return;
    }
    
    try {
      const foundBookings = await getGuestBookingByCode(phone, code);
      setBookings(foundBookings);
      setIsVerified(true);
      toast.success('Booking found!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to find booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setIsCancelling(true);
    
    try {
      const success = await cancelGuestBooking(bookingId, phone, code);
      
      if (success) {
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: 'cancelled' } 
              : booking
          )
        );
      }
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenModifyDialog = (booking: any) => {
    setSelectedBooking(booking);
    setNewBookingDate(new Date(booking.booking_date));
    setNewBookingTime(null);
    setIsModifyDialogOpen(true);
    
    fetchExistingBookings(booking.barber_id, booking.booking_date);
  };

  const fetchExistingBookings = async (barberId: string, date: string) => {
    try {
      setExistingBookings([]);
      updateAvailableTimeSlots(date);
    } catch (error) {
      console.error('Error fetching existing bookings:', error);
    }
  };

  const updateAvailableTimeSlots = (dateString: string) => {
    setAvailableTimeSlots(timeSlots);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setNewBookingDate(date);
      setNewBookingTime(null);
      
      if (selectedBooking) {
        updateAvailableTimeSlots(format(date, 'yyyy-MM-dd'));
      }
    }
  };

  const handleTimeSelection = (time: string) => {
    setNewBookingTime(time);
  };

  const handleModifyBooking = async () => {
    if (!selectedBooking || !newBookingDate || !newBookingTime) {
      toast.error('Please select a new date and time');
      return;
    }

    setIsModifying(true);
    
    try {
      const formattedDate = format(newBookingDate, 'yyyy-MM-dd');
      
      const success = await updateGuestBooking(
        selectedBooking.id,
        phone,
        code,
        formattedDate,
        newBookingTime
      );
      
      if (success) {
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === selectedBooking.id 
              ? { 
                  ...booking, 
                  booking_date: formattedDate,
                  booking_time: newBookingTime
                } 
              : booking
          )
        );
        
        setIsModifyDialogOpen(false);
        toast.success('Booking updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setIsModifying(false);
    }
  };

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
            onResetVerification={() => {
              setIsVerified(false);
              setBookings([]);
            }}
            onModify={handleOpenModifyDialog}
            onCancel={handleCancelBooking}
            isCancelling={isCancelling}
          />
        )}
      </div>

      <ModifyBookingDialog 
        isOpen={isModifyDialogOpen}
        onOpenChange={setIsModifyDialogOpen}
        selectedBooking={selectedBooking}
        newBookingDate={newBookingDate}
        newBookingTime={newBookingTime}
        availableTimeSlots={availableTimeSlots}
        isModifying={isModifying}
        onDateChange={handleDateChange}
        onTimeSelection={handleTimeSelection}
        onModifyBooking={handleModifyBooking}
      />
    </Layout>
  );
};

export default VerifyGuestBooking;
