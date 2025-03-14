
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsSubmitting(true);
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset error:', error);
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
            {isSubmitted ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold font-playfair mb-2">Check Your Email</h2>
                <p className="text-muted-foreground mb-6">
                  We've sent password reset instructions to {email}
                </p>
                <div className="text-sm text-center">
                  <Link to="/login" className="text-burgundy hover:underline font-playfair">
                    Return to login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold font-playfair">Reset Password</CardTitle>
                  <CardDescription className="font-playfair">
                    Enter your email address below and we'll send you instructions to reset your password.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-playfair">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      className="rounded-none" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
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
                        <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Sending...
                      </>
                    ) : (
                      'Send Reset Instructions'
                    )}
                  </Button>
                  <div className="text-sm text-center text-muted-foreground font-playfair">
                    Remember your password?{' '}
                    <Link to="/login" className="text-burgundy hover:underline">
                      Back to login
                    </Link>
                  </div>
                </CardFooter>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
