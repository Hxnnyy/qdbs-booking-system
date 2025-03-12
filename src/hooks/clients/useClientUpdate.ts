
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClientUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Update client information
  const updateClientProfile = async (clientId: string, data: { name?: string, phone?: string, email?: string }, isGuest: boolean) => {
    try {
      setIsLoading(true);
      
      let success = false;
      
      // Different update logic for guests vs registered users
      if (isGuest) {
        // For guest clients, we need to update all bookings with this information
        // First, identify all bookings that might belong to this guest
        const matchQuery = [];
        if (data.phone) matchQuery.push(`notes.ilike.%${data.phone}%`);
        if (data.email) matchQuery.push(`guest_email.eq.${data.email}`);
        
        if (matchQuery.length === 0) {
          throw new Error('Cannot identify guest bookings to update');
        }
        
        // Update guest bookings
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            guest_email: data.email,
            notes: data.name || data.phone 
              ? `Guest booking by ${data.name}${data.phone ? ` (${data.phone})` : ''}`
              : undefined
          })
          .or(matchQuery.join(','));
          
        if (updateError) throw updateError;
        success = true;
      } else {
        // For registered users, update the profile table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: data.name ? data.name.split(' ')[0] : undefined,
            last_name: data.name && data.name.split(' ').length > 1 
              ? data.name.split(' ').slice(1).join(' ') 
              : undefined,
            phone: data.phone,
            email: data.email
          })
          .eq('id', clientId);
          
        if (updateError) throw updateError;
        success = true;
      }
      
      if (success) {
        toast.success('Client profile updated successfully');
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Error updating client profile:', err);
      toast.error(`Failed to update client: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateClientProfile,
    isLoading
  };
};
