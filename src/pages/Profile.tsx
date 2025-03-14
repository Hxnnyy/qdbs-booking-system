import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { AlertCircle, RefreshCw, ShieldAlert, Key, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const Profile = () => {
  const {
    user,
    profile,
    refreshProfile,
    signOut
  } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isAccountDeleteDialogOpen, setIsAccountDeleteDialogOpen] = useState(false);

  // Bookings state
  const {
    getUserBookings,
    cancelBooking
  } = useBookings();
  const [isCancelling, setIsCancelling] = useState(false);

  // Use React Query for better data fetching
  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    error: fetchError,
    refetch: refetchBookings,
    isRefetching
  } = useQuery({
    queryKey: ['userBookings', user?.id],
    queryFn: getUserBookings,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Password change form schema
  const passwordFormSchema = z.object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required")
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // @ts-ignore - Supabase types issue
      const {
        error
      } = await supabase.from('profiles').update({
        first_name: firstName,
        last_name: lastName,
        phone: phone
      }).eq('id', user?.id);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
      await refreshProfile();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (values: z.infer<typeof passwordFormSchema>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword
      }, {
        emailRedirectTo: window.location.origin
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      passwordForm.reset();
      setIsPasswordDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    try {
      setIsResettingPassword(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset link sent to your email');
      setResetEmail('');
      setIsResetPasswordDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // First delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user?.id);
        
      if (profileError) throw profileError;
      
      // Then delete the user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user?.id as string
      );
      
      if (authError) throw authError;
      
      await signOut();
      toast.success('Your account has been deleted');
    } catch (error: any) {
      // If the error is related to permissions, give a more specific message
      if (error.message.includes('permission') || error.code === 'PGRST301') {
        toast.error('Unable to delete account. Please contact support for assistance.');
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setIsCancelling(true);
      const success = await cancelBooking(bookingId);
      if (success) {
        // Refresh bookings after cancellation
        refetchBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderBookings = () => {
    if (bookingsLoading && !isRefetching) {
      return <div className="space-y-4">
          {[1, 2].map(i => <Card key={i}>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>)}
        </div>;
    }
    if (fetchError) {
      return <div className="text-center py-8">
          <div className="bg-red-50 text-red-700 p-4 mb-4 rounded-md flex flex-col items-center">
            <AlertCircle className="h-6 w-6 mb-2" />
            <p className="mb-4">{fetchError instanceof Error ? fetchError.message : 'Error loading bookings'}</p>
            <Button variant="outline" onClick={() => refetchBookings()} className="flex items-center gap-2" disabled={isRefetching}>
              {isRefetching ? <Spinner className="h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4" />}
              {isRefetching ? 'Loading...' : 'Retry'}
            </Button>
          </div>
        </div>;
    }
    if (bookings.length === 0) {
      return <div className="text-center py-12 text-muted-foreground">
          You don't have any bookings yet. 
          <div className="mt-4">
            <Button onClick={() => window.location.href = '/book'}>
              Book an Appointment
            </Button>
          </div>
        </div>;
    }
    return <div className="space-y-4">
        {bookings.map(booking => {
        const isPastBooking = isPast(parseISO(booking.booking_date)) && !isToday(parseISO(booking.booking_date));
        const canCancel = booking.status === 'confirmed' && !isPastBooking;
        return <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">
                        {booking.service?.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      with {booking.barber?.name} on {format(parseISO(booking.booking_date), 'PP')} at {booking.booking_time}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      £{booking.service?.price?.toFixed(2)} • {booking.service?.duration} min
                    </p>
                  </div>
                  
                  {canCancel && <Button variant="destructive" size="sm" onClick={() => handleCancelBooking(booking.id)} disabled={isCancelling}>
                      {isCancelling ? <>
                          <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Cancelling...
                        </> : 'Cancel Booking'}
                    </Button>}
                </div>
                
                {booking.notes && <div className="mt-4 p-2 rounded text-sm bg-gray-700">
                    <p className="font-medium">Notes:</p>
                    <p>{booking.notes}</p>
                  </div>}
              </CardContent>
            </Card>;
      })}
        
        {isRefetching && <div className="flex justify-center py-2">
            <Spinner className="h-6 w-6" />
          </div>}
      </div>;
  };

  return <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="bookings">Your Bookings</TabsTrigger>
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="security">Security & Privacy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Appointments</h2>
              {bookings.length > 0 && !bookingsLoading && <Button variant="outline" size="sm" onClick={() => refetchBookings()} disabled={isRefetching} className="flex items-center gap-2">
                  {isRefetching ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                  {isRefetching ? 'Refreshing...' : 'Refresh'}
                </Button>}
            </div>
            {renderBookings()}
          </TabsContent>
          
          <TabsContent value="profile" className="mt-0">
            <form onSubmit={handleUpdateProfile} className="max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input type="text" id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input type="text" id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                
                <Button type="submit" className="bg-burgundy hover:bg-burgundy-light" disabled={isSubmitting}>
                  {isSubmitting ? <>
                      <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Updating...
                    </> : 'Update Profile'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <div className="max-w-md mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" /> Password Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Your Password</DialogTitle>
                          <DialogDescription>
                            Enter your current password and a new password to update your credentials.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...passwordForm}>
                          <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                            <FormField
                              control={passwordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={passwordForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm New Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                                {passwordForm.formState.isSubmitting ? 
                                  <><Spinner className="mr-2 h-4 w-4" /> Updating...</> : 
                                  'Update Password'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                          Forgot Password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Your Password</DialogTitle>
                          <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email Address</Label>
                            <Input 
                              id="reset-email" 
                              type="email" 
                              value={resetEmail} 
                              onChange={(e) => setResetEmail(e.target.value)}
                              placeholder="Enter your email address"
                            />
                          </div>
                          
                          <DialogFooter>
                            <Button type="submit" disabled={isResettingPassword}>
                              {isResettingPassword ? 
                                <><Spinner className="mr-2 h-4 w-4" /> Sending...</> : 
                                'Send Reset Link'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <UserX className="h-5 w-5" /> Delete Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  
                  <AlertDialog open={isAccountDeleteDialogOpen} onOpenChange={setIsAccountDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your account and all of your data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>;
};

export default Profile;
