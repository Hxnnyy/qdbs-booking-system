
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { Phone, KeyRound } from 'lucide-react';
import { format } from 'date-fns';
import { useGuestBookings } from '@/hooks/useGuestBookings';

const VerifyGuestBooking = () => {
  const navigate = useNavigate();
  const { getGuestBookingByCode, cancelGuestBooking, isLoading } = useGuestBookings();
  
  const [phone, setPhone] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

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
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerifyGuestBooking;
