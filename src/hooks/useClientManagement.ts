
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
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Add profile data to client records
        for (const profile of profiles) {
          const client = clientsMap.get(profile.id);
          if (client) {
            clientsMap.set(profile.id, {
              ...client,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name',
              email: profile.email,
              phone: profile.phone
            });
          }
        }
      }

      // Combine registered and guest clients
      const allClients: Client[] = [
        ...Array.from(clientsMap.values()),
        ...Array.from(guestClientsMap.values())
      ];

      // Remove duplicates by phone and email
      const clientsByPhone = new Map();
      const clientsByEmail = new Map();
      const uniqueClients: Client[] = [];

      // First, process registered users (prioritize them over guests)
      allClients
        .filter(client => !client.isGuest)
        .forEach(client => {
          if (client.phone) {
            clientsByPhone.set(client.phone, client);
          } else if (client.email) {
            clientsByEmail.set(client.email, client);
          } else {
            uniqueClients.push(client);
          }
        });

      // Then process guests, only add if we don't already have a registered user with same phone/email
      allClients
        .filter(client => client.isGuest)
        .forEach(client => {
          if (client.phone && !clientsByPhone.has(client.phone)) {
            clientsByPhone.set(client.phone, client);
          } else if (client.email && !clientsByEmail.has(client.email)) {
            clientsByEmail.set(client.email, client);
          } else if (!client.phone && !client.email) {
            uniqueClients.push(client);
          }
        });

      // Combine all unique clients
      uniqueClients.push(...clientsByPhone.values(), ...clientsByEmail.values());

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
