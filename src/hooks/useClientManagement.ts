import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { toast } from 'sonner';

export const useClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuestBookings, setShowGuestBookings] = useState(true);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, get all unique user IDs from bookings
      const { data: bookingUsers, error: bookingError } = await supabase
        .from('bookings')
        .select('user_id, guest_email, guest_booking, notes')
        .order('user_id');

      if (bookingError) throw bookingError;

      // Process booking data to extract client information
      const clientMap = new Map<string, { 
        id: string, 
        email: string | null, 
        bookingCount: number, 
        guest: boolean, 
        notes: string | null 
      }>();

      // Process regular user bookings
      bookingUsers.forEach(booking => {
        const userId = booking.user_id;
        const existingClient = clientMap.get(userId);
        
        if (existingClient) {
          clientMap.set(userId, {
            ...existingClient,
            bookingCount: existingClient.bookingCount + 1
          });
        } else {
          clientMap.set(userId, {
            id: userId,
            email: booking.guest_email || null,
            bookingCount: 1,
            guest: booking.guest_booking || false,
            notes: booking.notes
          });
        }
      });

      // Get profile data for registered users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('id', Array.from(clientMap.keys()));

      if (profilesError) throw profilesError;

      // Combine data to create final client list
      const clientList: Client[] = [];
      
      // Process registered users
      profiles.forEach(profile => {
        const bookingInfo = clientMap.get(profile.id);
        if (bookingInfo) {
          clientList.push({
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name',
            email: profile.email,
            phone: profile.phone,
            bookingCount: bookingInfo.bookingCount,
            isGuest: false
          });
        }
      });

      // Process guest bookings
      for (const [id, bookingInfo] of clientMap.entries()) {
        // Skip if already processed as a registered user
        if (profiles.some(p => p.id === id)) continue;
        
        if (bookingInfo.guest) {
          // Extract name and phone from notes for guest bookings
          let name = 'Guest User';
          let phone = null;
          
          if (bookingInfo.notes) {
            const nameMatch = bookingInfo.notes.match(/Guest booking by ([^(]+)/);
            if (nameMatch && nameMatch[1]) {
              name = nameMatch[1].trim();
            }
            
            const phoneMatch = bookingInfo.notes.match(/\(([^)]+)\)/);
            if (phoneMatch && phoneMatch[1]) {
              phone = phoneMatch[1].trim();
            }
          }
          
          clientList.push({
            id: id,
            name: name,
            email: bookingInfo.email,
            phone: phone,
            bookingCount: bookingInfo.bookingCount,
            isGuest: true
          });
        }
      }

      // Remove duplicates by phone number and email
      const uniqueClients = removeDuplicatesByPhoneAndEmail(clientList);
      const sortedClients = uniqueClients.sort((a, b) => a.name.localeCompare(b.name));
      
      setClients(sortedClients);
      
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError(err.message);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to remove duplicates by phone and email
  const removeDuplicatesByPhoneAndEmail = (clientList: Client[]): Client[] => {
    const uniquePhones = new Map<string, Client>();
    const uniqueEmails = new Map<string, Client>();
    const result: Client[] = [];
    
    // First process clients with phone numbers
    clientList.forEach(client => {
      if (client.phone) {
        // If we already have a client with this phone, keep the registered one or the one with more bookings
        const existingClient = uniquePhones.get(client.phone);
        if (!existingClient || (!client.isGuest && existingClient.isGuest) || 
            (client.isGuest === existingClient.isGuest && client.bookingCount > existingClient.bookingCount)) {
          uniquePhones.set(client.phone, client);
        }
      } 
      else if (client.email) {
        // For clients without phone but with email
        const existingClient = uniqueEmails.get(client.email);
        if (!existingClient || (!client.isGuest && existingClient.isGuest) || 
            (client.isGuest === existingClient.isGuest && client.bookingCount > existingClient.bookingCount)) {
          uniqueEmails.set(client.email, client);
        }
      }
      else {
        // Clients with neither phone nor email are always included
        result.push(client);
      }
    });
    
    // Add all unique phone clients
    result.push(...uniquePhones.values());
    
    // Add email clients that don't already have a phone match
    uniqueEmails.forEach(emailClient => {
      // Only add if this email client's phone isn't already in the results
      if (!emailClient.phone || !uniquePhones.has(emailClient.phone)) {
        result.push(emailClient);
      }
    });
    
    return result;
  };

  // Send email to selected clients
  const sendEmailToClients = async (recipients: string[], subject: string, content: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-clients-email', {
        body: {
          recipients,
          subject,
          content
        },
      });

      if (error) throw error;
      
      toast.success('Email sent successfully');
      return true;
    } catch (err: any) {
      console.error('Error sending email:', err);
      toast.error(`Failed to send email: ${err.message}`);
      return false;
    }
  };

  // Toggle showing guest bookings
  const toggleShowGuestBookings = () => {
    setShowGuestBookings(prev => !prev);
  };

  // Get filtered clients based on guest booking filter
  const getFilteredClients = () => {
    if (showGuestBookings) {
      return clients;
    }
    return clients.filter(client => !client.isGuest);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients: getFilteredClients(),
    isLoading,
    error,
    fetchClients,
    sendEmailToClients,
    showGuestBookings,
    toggleShowGuestBookings
  };
};
