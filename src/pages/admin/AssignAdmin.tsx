
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';

// Define explicit types for Supabase responses to avoid deep type instantiation
interface ProfileData {
  id: string;
}

type ProfileQueryResponse = { 
  data: ProfileData[] | null; 
  error: Error | null 
};

type RPCResponse = {
  data: string | null;
  error: Error | null;
};

type MutationResponse = {
  error: Error | null;
};

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
      // First check if the user exists in profiles
      const profileQuery: ProfileQueryResponse = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1);
      
      const { data: profileData, error: profileError } = profileQuery;
      
      if (profileError) {
        throw new Error('Error checking user profile');
      }
      
      // If profile exists, update it
      if (profileData && profileData.length > 0) {
        const profileId = profileData[0].id;
        
        const updateResult: MutationResponse = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', profileId);
          
        if (updateResult.error) {
          throw new Error('Failed to update user profile');
        }
        
        toast.success(`Admin privileges granted to ${email}`);
        setEmail('');
        return;
      }
      
      // If no profile, try to get user ID by email
      const rpcResult: RPCResponse = await supabase.rpc('get_user_id_by_email', {
        user_email: email
      });
      
      const { data: userId, error: userIdError } = rpcResult;
      
      if (userIdError || !userId) {
        throw new Error('User not found');
      }
      
      // Create a profile for the user
      const insertResult: MutationResponse = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          is_admin: true
        });
        
      if (insertResult.error) {
        throw new Error('Failed to create user profile');
      }
      
      toast.success(`Admin privileges granted to ${email}`);
      setEmail('');
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast.error(error instanceof Error ? error.message : 'Error assigning admin privileges');
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
