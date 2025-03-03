
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
        
        if (authUserError || !userId) {
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
          await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email,
              is_admin: true
            });
          
          toast.success(`Admin privileges granted to ${email}`);
          return;
        }
        
        // Update the existing profile
        await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', userId);
      } else {
        // Update the user's admin status
        await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', userData.id);
      }
      
      toast.success(`Admin privileges granted to ${email}`);
      setEmail('');
    } catch (error) {
      console.error('Error assigning admin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error assigning admin privileges';
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
