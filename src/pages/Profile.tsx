import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { User, Calendar, Clock, Pencil } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/hooks/useBookings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

interface Booking {
  id: string;
  barber: { name: string };
  service: { name: string; price: number; duration: number };
  booking_date: string;
  booking_time: string;
  notes?: string;
  status: string;
}

const Profile = () => {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const { getUserBookings, cancelBooking } = useBookings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoadingBookings(true);
      const userBookings = await getUserBookings();
      setBookings(userBookings as Booking[]);
      setLoadingBookings(false);
    };

    fetchBookings();
  }, [getUserBookings]);

  // Function to update profile
  const updateProfile = async (userId: string, profileData: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone
        })
        .eq('id', userId);

      if (error) throw error;
    
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      toast.error('Failed to update profile');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    const profileData = {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
    };

    const success = await updateProfile(user.id, profileData);

    if (success) {
      toast.success('Profile updated successfully');
      await refreshProfile();
      setOpen(false);
    }

    setIsSubmitting(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const success = await cancelBooking(bookingId);
    if (success) {
      // Optimistically update the UI
      setBookings(bookings.map(booking =>
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      ));
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingBookings = bookings.filter(b => isAfter(parseISO(b.booking_date), new Date()) || b.booking_date === today);
  const pastBookings = bookings.filter(b => isAfter(new Date(), parseISO(b.booking_date)) && b.booking_date !== today);

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-2xl font-bold">Profile</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="firstName" className="text-right">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lastName" className="text-right">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Updating...
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading || !profile ? (
              <div className="flex justify-center">
                <Spinner className="w-6 h-6" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <CardDescription>
                    {profile.first_name} {profile.last_name}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <CardDescription>{user?.email}</CardDescription>
                </div>
                {profile.phone && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <CardDescription>{profile.phone}</CardDescription>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Your Appointments</h2>
          {loadingBookings ? (
            <div className="flex justify-center py-6">
              <Spinner className="w-6 h-6" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No appointments found.</p>
            </div>
          ) : (
            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <CardTitle>{booking.service.name}</CardTitle>
                        <CardDescription>
                          {booking.barber.name} | {format(parseISO(booking.booking_date), 'PPP')} at {formatTime(booking.booking_time)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {booking.notes && <p className="text-sm text-gray-500">Notes: {booking.notes}</p>}
                      </CardContent>
                      <CardFooter className="justify-end">
                        {booking.status === 'confirmed' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive">Cancel</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will cancel your appointment.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelBooking(booking.id)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {booking.status === 'cancelled' && (
                          <p className="text-sm text-gray-500">Cancelled</p>
                        )}
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No upcoming appointments.</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="past" className="space-y-4">
                {pastBookings.length > 0 ? (
                  pastBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <CardTitle>{booking.service.name}</CardTitle>
                        <CardDescription>
                          {booking.barber.name} | {format(parseISO(booking.booking_date), 'PPP')} at {formatTime(booking.booking_time)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {booking.notes && <p className="text-sm text-gray-500">Notes: {booking.notes}</p>}
                      </CardContent>
                      <CardFooter className="justify-end">
                        {booking.status === 'cancelled' && (
                          <p className="text-sm text-gray-500">Cancelled</p>
                        )}
                        {booking.status === 'completed' && (
                          <p className="text-sm text-gray-500">Completed</p>
                        )}
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No past appointments.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
