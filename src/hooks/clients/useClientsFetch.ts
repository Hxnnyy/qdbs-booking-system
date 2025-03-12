
import { useState, useEffect } from 'react';
import { Client } from '@/types/client';
import { toast } from 'sonner';
import { fetchBookingsData } from './services/bookingService';
import { processBookingsToClients } from './utils/clientDataUtils';

export const useClientsFetch = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuestBookings, setShowGuestBookings] = useState(true);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch bookings data
      const bookings = await fetchBookingsData();
      
      // Process bookings to extract client information
      const processedClients = await processBookingsToClients(bookings);
      
      setClients(processedClients);
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
