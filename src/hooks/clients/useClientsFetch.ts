
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { toast } from 'sonner';

export const useClientsFetch = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuestBookings, setShowGuestBookings] = useState(true);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all bookings to extract client information
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, user_id, guest_booking, guest_email, notes, barber_id, service_id')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Map to track unique clients by user_id, phone, and email
      const clientsMap = new Map();
      const guestClientsMap = new Map();

      // Process all bookings
      for (const booking of bookings) {
        if (booking.user_id === '00000000-0000-0000-0000-000000000000' || booking.guest_booking === true) {
          // This is a guest booking
          let guestName = 'Guest User';
          let guestPhone = null;
          
          // Try to extract name and phone from notes
          if (booking.notes) {
            const nameMatch = booking.notes.match(/Guest booking by ([^(]+)/);
            if (nameMatch && nameMatch[1]) {
              guestName = nameMatch[1].trim();
            }
            
            const phoneMatch = booking.notes.match(/\(([^)]+)\)/);
            if (phoneMatch && phoneMatch[1]) {
              guestPhone = phoneMatch[1].trim();
            }
          }
          
          // Use phone as the key if available, otherwise use email or a random ID
          const guestKey = guestPhone || booking.guest_email || `guest-${booking.id}`;
          
          if (guestKey) {
            const existingGuest = guestClientsMap.get(guestKey);
            if (existingGuest) {
              guestClientsMap.set(guestKey, {
                ...existingGuest,
                bookingCount: existingGuest.bookingCount + 1
              });
            } else {
              guestClientsMap.set(guestKey, {
                id: booking.id, // Use booking ID as temporary client ID
                name: guestName,
                email: booking.guest_email || null,
                phone: guestPhone,
                bookingCount: 1,
                isGuest: true
              });
            }
          }
        } else {
          // This is a registered user booking
          const userId = booking.user_id;
          const existingClient = clientsMap.get(userId);
          
          if (existingClient) {
            clientsMap.set(userId, {
              ...existingClient,
              bookingCount: existingClient.bookingCount + 1
            });
          } else {
            clientsMap.set(userId, {
              id: userId,
              bookingCount: 1,
              isGuest: false
            });
          }
        }
      }

      // Get profile data for registered users
      const userIds = Array.from(clientsMap.keys());
      if (userIds.length > 0) {
        // First get profile data
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create a map to store user emails and data
        const userDataMap = new Map();
        
        // Add profile data to the map
        profiles.forEach(profile => {
          userDataMap.set(profile.id, {
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null,
            email: profile.email || null,
            phone: profile.phone || null
          });
        });
        
        // IMPROVED: Get auth users emails directly with a function call
        // This fixes the email retrieval problem for registered users
        try {
          const { data: emailsData, error: emailsError } = await supabase.functions.invoke('get-user-emails', {
            body: { userIds }
          });
          
          if (!emailsError && emailsData) {
            // Process the returned emails and update the user data map
            emailsData.forEach((userData: { id: string, email: string }) => {
              if (userData.id && userData.email) {
                const existingData = userDataMap.get(userData.id) || {};
                userDataMap.set(userData.id, {
                  ...existingData,
                  email: userData.email // Priority is given to auth emails
                });
              }
            });
          }
        } catch (err) {
          console.error('Error fetching auth emails:', err);
          // Non-blocking, continue with existing profile emails
        }

        // Add profile data to client records
        userIds.forEach(userId => {
          const client = clientsMap.get(userId);
          const userData = userDataMap.get(userId) || {};
          
          if (client) {
            clientsMap.set(userId, {
              ...client,
              name: userData.name || 'No Name',
              email: userData.email || null,
              phone: userData.phone || null
            });
          }
        });

        // For any clients without a name, try to use email username part
        clientsMap.forEach((client, userId) => {
          if (!client.name || client.name === 'No Name') {
            if (client.email) {
              clientsMap.set(userId, {
                ...client,
                name: client.email.split('@')[0] || 'No Name'
              });
            }
          }
        });
      }

      // Combine registered and guest clients
      const allClients: Client[] = [
        ...Array.from(clientsMap.values()),
        ...Array.from(guestClientsMap.values())
      ];

      // Better deduplication by phone and email
      // Create a map of phones and emails to prioritize registered users
      const phoneMap = new Map();
      const emailMap = new Map();
      
      // First, prioritize registered users
      allClients
        .filter(client => !client.isGuest)
        .forEach(client => {
          if (client.phone) phoneMap.set(client.phone, client);
          if (client.email) emailMap.set(client.email, client);
        });
      
      // Deduplicate clients
      const uniqueClients: Client[] = [];
      const addedIds = new Set();
      
      // Add all registered users first
      allClients
        .filter(client => !client.isGuest)
        .forEach(client => {
          if (!addedIds.has(client.id)) {
            uniqueClients.push(client);
            addedIds.add(client.id);
          }
        });
      
      // Then add guests only if their phone/email doesn't conflict with a registered user
      allClients
        .filter(client => client.isGuest)
        .forEach(client => {
          // Skip if the phone or email is already associated with a registered user
          if (
            (client.phone && phoneMap.has(client.phone) && !phoneMap.get(client.phone).isGuest) ||
            (client.email && emailMap.has(client.email) && !emailMap.get(client.email).isGuest)
          ) {
            return;
          }
          
          // Skip if this guest already has a duplicate in our list
          if (
            (client.phone && phoneMap.has(client.phone)) ||
            (client.email && emailMap.has(client.email))
          ) {
            return;
          }
          
          // Add this guest to our unique clients
          uniqueClients.push(client);
          
          // Mark this phone and email as used
          if (client.phone) phoneMap.set(client.phone, client);
          if (client.email) emailMap.set(client.email, client);
        });
      
      // Sort by name
      const sortedClients = uniqueClients.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });

      setClients(sortedClients);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError(err.message);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
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
    allClients: clients,
    isLoading,
    error,
    fetchClients,
    showGuestBookings,
    toggleShowGuestBookings
  };
};
