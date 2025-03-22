
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create a Supabase client with the service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generate all possible time slots for a day given opening and closing times
 */
function generatePossibleTimeSlots(openTime, closeTime) {
  const slots = [];
  
  let [openHours, openMinutes] = openTime.split(':').map(Number);
  const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
  
  const closeTimeInMinutes = closeHours * 60 + closeMinutes;
  
  // Safety counter to prevent infinite loops
  let counter = 0;
  const maxIterations = 100;
  
  while (counter < maxIterations) {
    const timeInMinutes = openHours * 60 + openMinutes;
    if (timeInMinutes >= closeTimeInMinutes) {
      break;
    }
    
    const formattedHours = openHours.toString().padStart(2, '0');
    const formattedMinutes = openMinutes.toString().padStart(2, '0');
    const timeSlot = `${formattedHours}:${formattedMinutes}`;
    
    slots.push({
      time: timeSlot,
      minutes: timeInMinutes
    });
    
    openMinutes += 30; // 30-minute increments
    if (openMinutes >= 60) {
      openHours += 1;
      openMinutes -= 60;
    }
    
    counter++;
  }
  
  return slots;
}

/**
 * Check if a time slot is in the past
 */
function isTimeSlotInPast(date, timeSlot) {
  const now = new Date();
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  const slotDate = new Date(date);
  slotDate.setHours(hours, minutes, 0, 0);
  
  return slotDate <= now;
}

/**
 * Check if a time slot overlaps with a lunch break
 */
function hasLunchBreakConflict(timeSlot, lunchBreaks, serviceDuration) {
  if (!lunchBreaks || lunchBreaks.length === 0) return false;
  
  // Only consider active lunch breaks
  const activeLunchBreaks = lunchBreaks.filter(lb => lb.is_active);
  if (activeLunchBreaks.length === 0) return false;
  
  // Convert time slot to minutes for easier comparison
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  // Calculate end time of the appointment in minutes
  const endTimeInMinutes = timeInMinutes + serviceDuration;
  
  // Check against each lunch break
  for (const lunch of activeLunchBreaks) {
    // Convert lunch break time to minutes
    const [lunchHours, lunchMinutes] = lunch.start_time.split(':').map(Number);
    const lunchStartMinutes = lunchHours * 60 + lunchMinutes;
    const lunchEndMinutes = lunchStartMinutes + lunch.duration;
    
    // Check for overlap:
    // If the appointment starts before lunch ends AND appointment ends after lunch starts,
    // then there's an overlap
    if (timeInMinutes < lunchEndMinutes && endTimeInMinutes > lunchStartMinutes) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a time slot is already booked
 */
function isTimeSlotBooked(timeSlot, serviceDuration, existingBookings) {
  if (!existingBookings || existingBookings.length === 0) return false;

  // Convert time slot to minutes for easier calculation
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  const appointmentEndTimeInMinutes = timeInMinutes + serviceDuration;

  // Check if any existing booking overlaps with this time slot
  return existingBookings.some(booking => {
    // Parse booking time
    const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
    const bookingTimeInMinutes = bookingHours * 60 + bookingMinutes;
    
    // Get booking service duration
    const bookingServiceLength = booking.services ? booking.services.duration : 60; // Default to 60 if unknown
    
    // Calculate the end time of the existing booking
    const bookingEndTimeInMinutes = bookingTimeInMinutes + bookingServiceLength;
    
    // Check if there's an overlap
    return (
      (timeInMinutes >= bookingTimeInMinutes && timeInMinutes < bookingEndTimeInMinutes) ||
      (appointmentEndTimeInMinutes > bookingTimeInMinutes && appointmentEndTimeInMinutes <= bookingEndTimeInMinutes) ||
      (timeInMinutes <= bookingTimeInMinutes && appointmentEndTimeInMinutes >= bookingEndTimeInMinutes) ||
      (timeInMinutes >= bookingTimeInMinutes && appointmentEndTimeInMinutes <= bookingEndTimeInMinutes)
    );
  });
}

/**
 * Check if barber is on holiday
 */
async function isBarberOnHoliday(barberId, date) {
  const formattedDate = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('barber_holidays')
    .select('*')
    .eq('barber_id', barberId)
    .lte('start_date', formattedDate)
    .gte('end_date', formattedDate);
    
  if (error) {
    console.error('Error checking holidays:', error);
    return false;
  }
  
  return data && data.length > 0;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { barberId, date, serviceDuration } = await req.json();
    
    // Validate required parameters
    if (!barberId || !date || !serviceDuration) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: barberId, date, and serviceDuration are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Processing request for barber: ${barberId}, date: ${date}, duration: ${serviceDuration}`);
    
    // Parse the date
    const requestDate = new Date(date);
    const dayOfWeek = requestDate.getDay();
    
    // 1. Check if barber is on holiday
    const isHoliday = await isBarberOnHoliday(barberId, requestDate);
    
    if (isHoliday) {
      return new Response(JSON.stringify({ 
        timeSlots: [],
        message: 'Barber is on holiday on this date' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Get barber's opening hours for this day
    const { data: openingHours, error: openingHoursError } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
      
    if (openingHoursError) {
      console.error('Error fetching opening hours:', openingHoursError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch opening hours',
        details: openingHoursError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check if barber is closed on this day
    if (!openingHours || openingHours.is_closed) {
      return new Response(JSON.stringify({ 
        timeSlots: [],
        message: 'Barber is not working on this day' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 3. Get barber's lunch breaks
    const { data: lunchBreaks, error: lunchBreaksError } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId)
      .eq('is_active', true);
      
    if (lunchBreaksError) {
      console.error('Error fetching lunch breaks:', lunchBreaksError);
      // Continue without lunch breaks
    }
    
    // 4. Get existing bookings for this barber and date
    const formattedDate = requestDate.toISOString().split('T')[0];
    
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        booking_time,
        services:service_id (
          duration
        )
      `)
      .eq('barber_id', barberId)
      .eq('booking_date', formattedDate)
      .neq('status', 'cancelled');
      
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      // Continue without bookings
    }
    
    // 5. Generate all possible time slots
    const possibleSlots = generatePossibleTimeSlots(
      openingHours.open_time, 
      openingHours.close_time
    );
    
    // 6. Filter out unavailable slots
    const availableSlots = possibleSlots.filter(slot => {
      // Filter out slots in the past (for today only)
      const today = new Date();
      if (
        requestDate.getDate() === today.getDate() &&
        requestDate.getMonth() === today.getMonth() &&
        requestDate.getFullYear() === today.getFullYear() &&
        isTimeSlotInPast(requestDate, slot.time)
      ) {
        return false;
      }
      
      // Filter out booked slots
      if (existingBookings && isTimeSlotBooked(slot.time, serviceDuration, existingBookings)) {
        return false;
      }
      
      // Filter out lunch break slots
      if (lunchBreaks && hasLunchBreakConflict(slot.time, lunchBreaks, serviceDuration)) {
        return false;
      }
      
      return true;
    });
    
    // Return only the time strings
    const finalTimeSlots = availableSlots.map(slot => slot.time);
    
    console.log(`Found ${finalTimeSlots.length} available time slots`);
    
    return new Response(JSON.stringify({ timeSlots: finalTimeSlots }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
