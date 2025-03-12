
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

        // Create a map to store user emails from profiles first
        const emailMap = new Map();
        
        // Add profile emails as initial data
        profiles.forEach(profile => {
          if (profile.email) {
            emailMap.set(profile.id, profile.email);
          }
        });
        
        // Get auth users emails directly with a custom function call
        // Note: We're using the get_user_id_by_email function to help get emails
        // We'll fetch emails one by one for each user since we can't pass arrays
        for (const userId of userIds) {
          try {
            // Call the existing function to help determine email 
            const { data: emailData, error: emailError } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', userId)
              .single();
              
            if (!emailError && emailData && emailData.email) {
              // If we have an email in the profile, look up the auth email
              const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
              
              if (!authUserError && authUser && authUser.user && authUser.user.email) {
                // Store the authenticated user email which has higher priority
                emailMap.set(userId, authUser.user.email);
              }
            }
          } catch (err) {
            console.error(`Error fetching email for user ${userId}:`, err);
            // Non-blocking, continue with next user
          }
        }

        // Add profile data to client records
        for (const profile of profiles) {
          const client = clientsMap.get(profile.id);
          if (client) {
            // Use email from our map, which prioritizes auth emails over profile emails
            const email = emailMap.get(profile.id) || null;
            
            clientsMap.set(profile.id, {
              ...client,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name',
              email: email,
              phone: profile.phone
            });
          }
        }

        // For any clients that don't have profile data, try to use just the email if available
        clientsMap.forEach((client, userId) => {
          if (!client.name || client.name === 'No Name') {
            const email = emailMap.get(userId);
            if (email) {
              clientsMap.set(userId, {
                ...client,
                email: email,
                name: email.split('@')[0] || 'No Name' // Use part of email as name if nothing else
              });
            }
          } else if (!client.email) {
            // If we have a name but no email, check if we have an email in our map
            const email = emailMap.get(userId);
            if (email) {
              clientsMap.set(userId, {
                ...client,
                email: email
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
