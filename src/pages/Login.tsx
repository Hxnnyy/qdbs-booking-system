
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 pt-12 pb-24 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-subtle border border-border rounded-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold font-playfair">Welcome back</CardTitle>
              <CardDescription className="font-playfair">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-playfair">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" className="rounded-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-playfair">Password</Label>
                <Input id="password" type="password" className="rounded-none" />
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-burgundy hover:underline font-playfair">
                  Forgot password?
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full rounded-none bg-burgundy hover:bg-burgundy-light">Sign in</Button>
              <div className="text-sm text-center text-muted-foreground font-playfair">
                Don't have an account?{' '}
                <Link to="/signup" className="text-burgundy hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Login;
