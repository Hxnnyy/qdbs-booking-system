
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Scissors, User, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBookings, Booking } from '@/hooks/useBookings';
import { format, parseISO } from 'date-fns';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { getUserBookings, cancelBooking, isLoading: bookingsLoading } = useBookings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (user) {
        const userBookings = await getUserBookings();
        setBookings(userBookings || []);
      }
    };

    fetchBookings();
  }, [user, getUserBookings]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone
        })
        .eq('id', user.id) as { error: any };

      if (error) throw error;
      
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const success = await cancelBooking(bookingId);
    if (success) {
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      ));
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold mb-2 font-playfair">My Profile</h1>
          <p className="text-muted-foreground font-playfair">
            Manage your account and view your bookings
          </p>
        </motion.div>

        <Tabs defaultValue="bookings" className="space-y-8">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="profile">Personal Info</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair">My Appointments</CardTitle>
                <CardDescription className="font-playfair">
                  View and manage your upcoming barbershop appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="w-8 h-8" />
                  </div>
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id} className={`overflow-hidden ${booking.status === 'cancelled' ? 'opacity-70' : ''}`}>
                        <div className="p-4 border-l-4 border-burgundy flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Calendar className="h-4 w-4 mr-2 text-burgundy" />
                              <span className="font-medium">
                                {format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center mb-2">
                              <Clock className="h-4 w-4 mr-2 text-burgundy" />
                              <span>{formatTime(booking.booking_time)}</span>
                            </div>
                            <div className="flex items-center mb-2">
                              <Scissors className="h-4 w-4 mr-2 text-burgundy" />
                              <span>{booking.service?.name}</span>
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-burgundy" />
                              <span>{booking.barber?.name}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <div className="mb-2 font-medium text-burgundy">
                              £{booking.service?.price.toFixed(2)}
                            </div>
                            
                            {booking.status === 'cancelled' ? (
                              <span className="text-muted-foreground text-sm px-3 py-1 bg-secondary rounded-full">
                                Cancelled
                              </span>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex items-center">
                                    <X className="h-4 w-4 mr-1" /> Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. The appointment will be cancelled and you'll need to book again if you change your mind.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep appointment</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => booking.id && handleCancelBooking(booking.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Yes, cancel it
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4 font-playfair">
                      You don't have any appointments yet
                    </p>
                    <Button asChild className="bg-burgundy hover:bg-burgundy-light">
                      <a href="/book">Book an Appointment</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair">Personal Information</CardTitle>
                <CardDescription className="font-playfair">
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user?.email || ''}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground font-playfair">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="07700 900000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleUpdateProfile} 
                  className="w-full bg-burgundy hover:bg-burgundy-light"
                  disabled={isLoading || isUpdating}
                >
                  {isLoading || isUpdating ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
