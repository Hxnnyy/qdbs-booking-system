
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

const MakeJosephAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  
  useEffect(() => {
    const makeAdmin = async () => {
      try {
        setStatus('Searching for user...');
        
        // Use the RPC function to get the user ID by email
        const { data: userId, error: userError } = await supabase.rpc('get_user_id_by_email', {
          user_email: 'josephdraper@hotmail.com'
        });
        
        if (userError || !userId) {
          setStatus('User not found');
          toast.error('User not found');
          return;
        }
        
        setStatus(`User found with ID: ${userId}`);
        
        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          // Create profile if not exists
          setStatus('Creating profile...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: 'josephdraper@hotmail.com',
              is_admin: true,
              is_super_admin: true
            });
          
          if (insertError) {
            throw insertError;
          }
        } else {
          // Update existing profile
          setStatus('Updating profile...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              is_admin: true,
              is_super_admin: true 
            })
            .eq('id', userId);
          
          if (updateError) {
            throw updateError;
          }
        }
        
        setStatus('Admin privileges granted successfully!');
        toast.success('SuperAdmin privileges granted to josephdraper@hotmail.com');
      } catch (error: any) {
        console.error('Error:', error);
        setStatus(`Error: ${error.message}`);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    makeAdmin();
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Privileges Assignment</h1>
        
        <div className="my-6 text-center">
          {loading ? (
            <Spinner className="mx-auto h-8 w-8" />
          ) : null}
          
          <p className="mt-4 text-gray-600">{status}</p>
          
          {!loading && status.includes('success') ? (
            <p className="mt-4 text-green-600 font-medium">
              josephdraper@hotmail.com now has SuperAdmin privileges!
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MakeJosephAdmin;
