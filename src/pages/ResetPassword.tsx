
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  // Check if user is authenticated via the reset password link
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        toast.error('Invalid or expired reset link. Please request a new one.');
        navigate('/forgot-password');
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setPasswordError('');
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setIsResetComplete(true);
      toast.success('Your password has been reset successfully');
      
      // Automatically redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-12 pb-24 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-subtle border border-border rounded-none">
            {isResetComplete ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold font-playfair mb-2">Password Reset Complete</h2>
                <p className="text-muted-foreground mb-6">
                  Your password has been successfully updated. You will be redirected to the login page shortly.
                </p>
                <div className="text-sm text-center">
                  <Link to="/login" className="text-burgundy hover:underline font-playfair">
                    Go to login now
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold font-playfair">Create New Password</CardTitle>
                  <CardDescription className="font-playfair">
                    Enter your new password below
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-playfair">New Password</Label>
                    <Input 
                      id="password" 
                      type="password"
                      className="rounded-none" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="font-playfair">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      className="rounded-none" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    {passwordError && (
                      <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full rounded-none bg-burgundy hover:bg-burgundy-light"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </CardFooter>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
