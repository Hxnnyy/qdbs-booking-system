
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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
        
        // Then get auth users data directly from the auth schema with RPC
        // This is a workaround since auth.admin.listUsers requires service role that can't be used client-side
        const { data: authEmails, error: authEmailsError } = await supabase
          .rpc('get_user_emails_by_ids', { 
            user_ids: userIds 
          });
        
        if (authEmailsError) {
          console.error('Error fetching auth emails:', authEmailsError);
          // Continue with profiles data only, this is non-blocking
        } else if (authEmails && Array.isArray(authEmails)) {
          // Update the email map with auth emails (which take priority)
          authEmails.forEach((item: { id: string, email: string }) => {
            if (item && item.id && item.email) {
              emailMap.set(item.id, item.email);
            }
          });
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

  // Update client information
  const updateClientProfile = async (clientId: string, data: { name?: string, phone?: string, email?: string }) => {
    try {
      setIsLoading(true);
      
      // Get the client to determine whether it's a guest or registered user
      const client = clients.find(c => c.id === clientId);
      if (!client) {
        throw new Error('Client not found');
      }
      
      let success = false;
      
      // Different update logic for guests vs registered users
      if (client.isGuest) {
        // For guest clients, we need to update all bookings with this information
        // First, identify all bookings that might belong to this guest
        const matchQuery = [];
        if (client.phone) matchQuery.push(`notes.ilike.%${client.phone}%`);
        if (client.email) matchQuery.push(`guest_email.eq.${client.email}`);
        
        if (matchQuery.length === 0) {
          throw new Error('Cannot identify guest bookings to update');
        }
        
        // Update guest bookings
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            guest_email: data.email || client.email,
            notes: data.name || data.phone 
              ? `Guest booking by ${data.name || client.name}${data.phone ? ` (${data.phone})` : client.phone ? ` (${client.phone})` : ''}`
              : undefined // Changed from client.notes to undefined since Client doesn't have a notes property
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
        await fetchClients(); // Refresh the client list
      }
      
    } catch (err: any) {
      console.error('Error updating client profile:', err);
      toast.error(`Failed to update client: ${err.message}`);
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

  // Export clients data to Excel
  const exportClientsData = (clientsToExport: Client[], fields: string[]) => {
    try {
      // Map client data to include only the selected fields
      const data = clientsToExport.map(client => {
        const row: Record<string, any> = {};
        
        fields.forEach(field => {
          if (field === 'isGuest') {
            // Format isGuest as a string
            row['Client Type'] = client.isGuest ? 'Guest' : 'Registered';
          } else if (field === 'bookingCount') {
            row['Appointment Count'] = client[field];
          } else {
            // Use the field name as the column header with proper capitalization
            const headerName = field.charAt(0).toUpperCase() + field.slice(1);
            row[headerName] = client[field as keyof Client] || 'N/A';
          }
        });
        
        return row;
      });
      
      // Create a new workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');
      
      // Generate the Excel file
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const fileName = `client_data_export_${timestamp}.xlsx`;
      
      // Save the file
      XLSX.writeFile(wb, fileName);
      
      toast.success('Client data exported successfully');
    } catch (err: any) {
      console.error('Error exporting client data:', err);
      toast.error(`Failed to export client data: ${err.message}`);
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
    toggleShowGuestBookings,
    updateClientProfile,
    exportClientsData
  };
};
