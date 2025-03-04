
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { Calendar } from '@/components/ui/calendar';
import { format, parse, addDays, isAfter, isBefore, endOfDay } from 'date-fns';
import TimeSlot from '@/components/booking/TimeSlot';
import { Phone, KeyRound, Calendar as CalendarIcon } from 'lucide-react';
import { useGuestBookings } from '@/hooks/useGuestBookings';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const VerifyGuestBooking = () => {
  const navigate = useNavigate();
  const { getGuestBookingByCode, cancelGuestBooking, updateGuestBooking, isLoading } = useGuestBookings();
  const { barbers } = useBarbers();
  const { services } = useServices();
  
  const [phone, setPhone] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isModifying, setIsModifying] = useState<boolean>(false);
  
  // Modification state
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [newBookingDate, setNewBookingDate] = useState<Date | undefined>(undefined);
  const [newBookingTime, setNewBookingTime] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  // Generate time slots from 9 AM to 6 PM
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
        // Update the status in the local state
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: 'cancelled' } 
              : booking
          )
        );
      }
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenModifyDialog = (booking: any) => {
    setSelectedBooking(booking);
    setNewBookingDate(parse(booking.booking_date, 'yyyy-MM-dd', new Date()));
    setNewBookingTime(null);
    setIsModifyDialogOpen(true);
    
    // Fetch existing bookings for the barber on that date
    fetchExistingBookings(booking.barber_id, booking.booking_date);
  };

  const fetchExistingBookings = async (barberId: string, date: string) => {
    try {
      // This would typically be a function that gets bookings for a specific date/barber
      // For now, we're just setting a placeholder
      setExistingBookings([]);
      
      // Generate available time slots
      updateAvailableTimeSlots(date);
    } catch (error) {
      console.error('Error fetching existing bookings:', error);
    }
  };

  const updateAvailableTimeSlots = (dateString: string) => {
    // Filter out times that are already booked
    // In a real implementation, you would compare with existing bookings
    // For now, we're just providing all time slots
    setAvailableTimeSlots(timeSlots);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setNewBookingDate(date);
      setNewBookingTime(null);
      
      // Update available time slots based on the new date
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
        // Update the booking in the local state
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
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">Verify Your Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter the phone number used for booking"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Booking Code</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter your 6-digit booking code"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-burgundy hover:bg-burgundy-light"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Verifying...
                    </>
                  ) : (
                    'Verify Booking'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold font-playfair">Your Bookings</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setIsVerified(false);
                  setBookings([]);
                }}
              >
                Verify Another Booking
              </Button>
            </div>
            
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">No bookings found</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="overflow-hidden">
                    <div 
                      className={`h-2 ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-500' 
                          : booking.status === 'cancelled' 
                            ? 'bg-red-500' 
                            : 'bg-yellow-500'
                      }`}
                    />
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Appointment with</p>
                        <h3 className="text-lg font-semibold">{booking.barber?.name}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                        <div className="text-muted-foreground">Service:</div>
                        <div>{booking.service?.name}</div>
                        
                        <div className="text-muted-foreground">Date:</div>
                        <div>
                          {format(new Date(booking.booking_date), 'MMMM d, yyyy')}
                        </div>
                        
                        <div className="text-muted-foreground">Time:</div>
                        <div>{booking.booking_time}</div>
                        
                        <div className="text-muted-foreground">Price:</div>
                        <div>£{booking.service?.price.toFixed(2)}</div>
                        
                        <div className="text-muted-foreground">Status:</div>
                        <div className={`font-medium ${
                          booking.status === 'confirmed' 
                            ? 'text-green-600' 
                            : booking.status === 'cancelled' 
                              ? 'text-red-600' 
                              : 'text-yellow-600'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </div>
                      </div>
                      
                      {booking.status === 'confirmed' && (
                        <div className="flex flex-col space-y-2 items-center">
                          <Button
                            variant="default"
                            className="bg-burgundy hover:bg-burgundy-light w-full"
                            onClick={() => handleOpenModifyDialog(booking)}
                          >
                            Modify Booking
                          </Button>
                          
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={isCancelling}
                          >
                            {isCancelling ? (
                              <>
                                <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Cancelling...
                              </>
                            ) : (
                              'Cancel Booking'
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modify Booking Dialog */}
      <Dialog open={isModifyDialogOpen} onOpenChange={setIsModifyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select New Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newBookingDate ? format(newBookingDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newBookingDate}
                      onSelect={handleDateChange}
                      initialFocus
                      disabled={(date) => 
                        isBefore(date, addDays(new Date(), 0)) || 
                        isAfter(date, addDays(new Date(), 30))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {newBookingDate && (
                <div className="space-y-2">
                  <Label>Select New Time</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimeSlots.map((time) => (
                      <TimeSlot
                        key={time}
                        time={time}
                        selected={newBookingTime || ''}
                        onClick={() => handleTimeSelection(time)}
                        disabled={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleModifyBooking} 
              disabled={isModifying || !newBookingDate || !newBookingTime}
              className="bg-burgundy hover:bg-burgundy-light"
            >
              {isModifying ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Updating...
                </>
              ) : (
                'Update Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default VerifyGuestBooking;
