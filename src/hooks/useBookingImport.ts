
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { InsertableBooking } from '@/supabase-types';
import { useAuth } from '@/context/AuthContext';

interface BookingEntry {
  id: string;
  guestName: string;
  guestPhone: string;
  barberId: string;
  serviceId: string;
  date: Date | undefined;
  time: string;
  notes: string;
}

interface ParsedBookingEntry {
  guestName: string;
  guestPhone: string;
  barberName: string;
  barberId?: string;
  serviceName: string;
  serviceId?: string;
  dateRaw: string;
  date?: Date;
  time: string;
  notes: string;
  isValid: boolean;
  errors: string[];
}

interface ImportResult {
  successCount: number;
  failedCount: number;
  errors: string[];
}

export const useBookingImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const { isAdmin, user } = useAuth();
  
  const importBookings = async (entries: BookingEntry[]): Promise<ImportResult> => {
    setIsImporting(true);
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    
    try {
      if (!isAdmin) {
        throw new Error("Only admins can import bookings");
      }
      
      const validEntries = entries.filter(
        entry => entry.guestName && entry.barberId && entry.serviceId && entry.date && entry.time
      );
      
      if (validEntries.length === 0) {
        throw new Error("No valid bookings to import");
      }
      
      // Process in smaller batches to prevent timeouts
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < validEntries.length; i += batchSize) {
        batches.push(validEntries.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        const bookingsToInsert = batch.map(entry => {
          const formattedDate = format(entry.date!, 'yyyy-MM-dd');
          
          // Create guest booking with proper structure
          // For current DB schema, we need to provide the admin's user_id
          const booking: InsertableBooking = {
            user_id: user?.id || 'admin-import', // Use current admin's ID
            barber_id: entry.barberId,
            service_id: entry.serviceId,
            booking_date: formattedDate,
            booking_time: entry.time,
            status: 'confirmed',
            notes: `Guest booking by ${entry.guestName} (${entry.guestPhone})${entry.notes ? '\n' + entry.notes : ''}`,
            guest_booking: true
          };
          
          return booking;
        });
        
        console.log("Inserting bookings:", bookingsToInsert);
        
        // @ts-ignore - Supabase types issue
        const { data, error } = await supabase
          .from('bookings')
          .insert(bookingsToInsert)
          .select();
        
        if (error) {
          console.error("Error inserting bookings:", error);
          failedCount += batch.length;
          errors.push(error.message);
        } else {
          successCount += data.length;
          failedCount += (batch.length - data.length);
        }
      }
      
      return { successCount, failedCount, errors };
    } catch (error: any) {
      console.error("Import error:", error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };
  
  const importBookingsFromCsv = async (entries: ParsedBookingEntry[]): Promise<ImportResult> => {
    setIsImporting(true);
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    
    try {
      if (!isAdmin) {
        throw new Error("Only admins can import bookings");
      }
      
      const validEntries = entries.filter(entry => entry.isValid);
      
      if (validEntries.length === 0) {
        throw new Error("No valid bookings to import");
      }
      
      // Process in smaller batches to prevent timeouts
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < validEntries.length; i += batchSize) {
        batches.push(validEntries.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        const bookingsToInsert = batch.map(entry => {
          if (!entry.date || !entry.barberId || !entry.serviceId) {
            throw new Error("Invalid entry found in valid entries");
          }
          
          const formattedDate = format(entry.date, 'yyyy-MM-dd');
          
          // Create guest booking with proper structure
          // For current DB schema, we need to provide the admin's user_id
          const booking: InsertableBooking = {
            user_id: user?.id || 'admin-import', // Use current admin's ID
            barber_id: entry.barberId,
            service_id: entry.serviceId,
            booking_date: formattedDate,
            booking_time: entry.time,
            status: 'confirmed',
            notes: `Guest booking by ${entry.guestName} (${entry.guestPhone})${entry.notes ? '\n' + entry.notes : ''}`,
            guest_booking: true
          };
          
          return booking;
        });
        
        console.log("Inserting CSV bookings:", bookingsToInsert);
        
        // @ts-ignore - Supabase types issue
        const { data, error } = await supabase
          .from('bookings')
          .insert(bookingsToInsert)
          .select();
        
        if (error) {
          console.error("Error inserting bookings:", error);
          failedCount += batch.length;
          errors.push(error.message);
        } else {
          successCount += data.length;
          failedCount += (batch.length - data.length);
        }
      }
      
      return { successCount, failedCount, errors };
    } catch (error: any) {
      console.error("Import error:", error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };
  
  return {
    importBookings,
    importBookingsFromCsv,
    isImporting
  };
};
