
import { toast } from 'sonner';
import { Barber, Service } from '@/supabase-types';

export interface ParsedBookingEntry {
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

export const parseCSV = (text: string, barbers: Barber[], services: Service[]): ParsedBookingEntry[] => {
  const lines = text.split('\n');
  if (lines.length < 2) {
    toast.error("CSV file appears to be empty or improperly formatted");
    return [];
  }
  
  const headers = lines[0].split(',');
  const expectedHeaders = ["Guest Name", "Phone Number", "Barber Name", "Service Name", "Date (DD/MM/YYYY)", "Time (HH:MM)", "Notes"];
  
  // Check if headers are as expected
  const allHeadersPresent = expectedHeaders.every(header => 
    headers.some(h => h.trim().toLowerCase() === header.toLowerCase())
  );
  
  if (!allHeadersPresent) {
    toast.error("CSV headers don't match the expected format. Download the template for reference.");
    return [];
  }
  
  const results: ParsedBookingEntry[] = [];
  
  // Skip header row, process each data row
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = lines[i].split(',');
    if (values.length < 6) continue; // Skip invalid lines
    
    const guestName = values[0].trim();
    const guestPhone = values[1].trim();
    const barberName = values[2].trim();
    const serviceName = values[3].trim();
    const dateRaw = values[4].trim();
    const time = values[5].trim();
    const notes = values[6] ? values[6].trim() : '';
    
    const errors: string[] = [];
    
    // Find matching barber and service
    const matchedBarber = barbers.find(b => 
      b.name.toLowerCase() === barberName.toLowerCase()
    );
    
    const matchedService = services.find(s => 
      s.name.toLowerCase() === serviceName.toLowerCase()
    );
    
    if (!matchedBarber) errors.push(`Barber "${barberName}" not found`);
    if (!matchedService) errors.push(`Service "${serviceName}" not found`);
    
    // Parse date
    let date: Date | undefined;
    try {
      // Try to parse date in DD/MM/YYYY format
      const [day, month, year] = dateRaw.split('/').map(Number);
      date = new Date(year, month - 1, day);
      
      if (isNaN(date.getTime())) {
        errors.push("Invalid date format");
        date = undefined;
      }
    } catch (e) {
      errors.push("Invalid date format");
    }
    
    // Validate time format (HH:MM)
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      errors.push("Invalid time format");
    }
    
    results.push({
      guestName,
      guestPhone,
      barberName,
      barberId: matchedBarber?.id,
      serviceName,
      serviceId: matchedService?.id,
      dateRaw,
      date,
      time,
      notes,
      isValid: errors.length === 0,
      errors
    });
  }
  
  return results;
};
