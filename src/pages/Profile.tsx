import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBookings } from '@/hooks/useBookings';

const Profile = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const { getUserBookings, cancelBooking } = useBookings();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
    }
    
    fetchBookings();
  }, [profile]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await getUserBookings();
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const updateProfile = async (profileData: { first_name: string; last_name: string; phone: string }) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user?.id) as unknown as { error: any };
      
      if (error) throw error;
      
      await refreshProfile();
      toast.success('Profile updated successfully');
      setIsLoading(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmed) return;
    
    const success = await cancelBooking(bookingId);
    if (success) {
      await fetchBookings();
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-12">
          <p>Please log in to view your profile.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 font-playfair">Your Profile</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile Details</TabsTrigger>
            <TabsTrigger value="bookings">Your Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="glass shadow-subtle border border-border">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details here
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Input id="email" value={user.email} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="Your phone number"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={signOut}>Sign Out</Button>
                <Button 
                  onClick={() => updateProfile({ first_name: firstName, last_name: lastName, phone: phone })}
                  disabled={isLoading}
                  className="bg-burgundy hover:bg-burgundy-light"
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Saving...
                    </>
                  ) : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="bookings">
            <Card className="glass shadow-subtle border border-border">
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>
                  Manage your upcoming appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="w-8 h-8" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You don't have any bookings yet.</p>
                    <Button 
                      className="mt-4 bg-burgundy hover:bg-burgundy-light"
                      onClick={() => window.location.href = '/book'}
                    >
                      Book an Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{booking.service?.name}</h3>
                            <p className="text-sm text-muted-foreground">with {booking.barber?.name}</p>
                          </div>
                          <div>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm mb-4">
                          <span>
                            {new Date(booking.booking_date).toLocaleDateString('en-GB', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                          <span>{booking.booking_time}</span>
                        </div>
                        {booking.notes && (
                          <div className="text-sm text-muted-foreground bg-secondary/30 p-2 rounded-md mb-4">
                            <p className="font-medium">Notes:</p>
                            <p>{booking.notes}</p>
                          </div>
                        )}
                        {booking.status === 'confirmed' && (
                          <div className="flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel Booking
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-burgundy hover:bg-burgundy-light"
                  onClick={() => window.location.href = '/book'}
                >
                  Book New Appointment
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
