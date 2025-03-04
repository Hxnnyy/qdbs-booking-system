
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';

const AssignAdmin = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, fetch the user data by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, is_admin')
        .eq('email', email)
        .single();
      
      if (userError) {
        // We'll use our RPC function to get the user ID by email
        const { data: userId, error: authUserError } = await supabase.rpc('get_user_id_by_email', {
          user_email: email
        });
        
        if (authUserError) {
          throw new Error('User not found');
        }
        
        if (!userId) {
          throw new Error('User not found');
        }
        
        // Check if this user has a profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          // Create a profile if one doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email,
              is_admin: true
            });
            
          if (insertError) {
            throw new Error('Failed to create user profile');
          }
          
          toast.success(`Admin privileges granted to ${email}`);
          setEmail('');
          return;
        }
        
        // Update the existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', userId);
          
        if (updateError) {
          throw new Error('Failed to update user profile');
        }
      } else {
        // Update the user's admin status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', userData.id);
          
        if (updateError) {
          throw new Error('Failed to update user profile');
        }
      }
      
      toast.success(`Admin privileges granted to ${email}`);
      setEmail('');
    } catch (error) {
      console.error('Error assigning admin:', error);
      // Fix for the TypeScript error - use type assertion instead of complex conditionals
      let errorMessage = 'Error assigning admin privileges';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">Assign Admin Privileges</h1>
        
        <div className="max-w-md">
          <form onSubmit={handleAssignAdmin} className="space-y-4">
            <div>
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter user email"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Assigning...
                </>
              ) : (
                'Grant Admin Privileges'
              )}
            </Button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AssignAdmin;
