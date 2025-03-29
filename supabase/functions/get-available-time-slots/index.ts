
// Follow Deno's ES modules approach
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Get available time slots for a barber on a specific date
 */
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      barberId,
      date,
      serviceDuration = 60, // Default to 60 minutes
      excludeBookingId,     // Optional: exclude a specific booking (for rebooking)
      clientDayOfWeek       // Optional: client-side day of week for verification
    } = await req.json();

    // Input validation
    if (!barberId || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`🚀 Processing request for barber: ${barberId}, date: ${date}, duration: ${serviceDuration}, exclude booking: ${excludeBookingId || 'none'}`);
    
    // Parse the date correctly
    const dateString = typeof date === 'string' ? date : String(date);
    
    // Generate a stable date object from the YYYY-MM-DD format
    // Make sure we're working with a clean YYYY-MM-DD format
    const cleanDateString = dateString.split('T')[0];
    console.log(`🧹 Clean date string: ${cleanDateString}`);
    
    // Create a date object at a fixed time (noon) to avoid timezone issues
    const requestDate = new Date(`${cleanDateString}T12:00:00Z`);
    
    // *** CRITICAL FIX: Use the client-side day of week if provided ***
    // This ensures consistency between client and server calculations
    let dayOfWeek;
    
    if (clientDayOfWeek !== undefined) {
      dayOfWeek = clientDayOfWeek;
      console.log(`📅 Using client-provided day of week: ${dayOfWeek}`);
    } else {
      // Calculate the day of week (0 = Sunday, 1 = Monday, etc.)
      dayOfWeek = requestDate.getUTCDay();
      console.log(`📅 Calculated day of week on server: ${dayOfWeek}`);
    }
    
    console.log(`📅 Parsed date: ${requestDate.toUTCString()}`);
    console.log(`📅 Final day of week used: ${dayOfWeek}`);
    
    // 1. Check if barber is on holiday
    const isHoliday = await isBarberOnHoliday(supabase, barberId, cleanDateString);
    if (isHoliday) {
      return new Response(
        JSON.stringify({ 
          timeSlots: [],
          error: 'Barber is on holiday on this date'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Get barber's opening hours for the specific day of week
    const { data: openingHours, error: openingHoursError } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
    
    if (openingHoursError) {
      console.error('❌ Error fetching opening hours:', openingHoursError);
      throw new Error('Failed to fetch barber opening hours');
    }
    
    console.log('⏰ Opening hours for this day:', openingHours);
    
    if (!openingHours || openingHours.is_closed) {
      return new Response(
        JSON.stringify({ 
          timeSlots: [],
          error: 'Barber is not available on this day of the week'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Get barber's lunch breaks
    const { data: lunchBreaks, error: lunchBreaksError } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId)
      .eq('is_active', true);
    
    if (lunchBreaksError) {
      console.error('❌ Error fetching lunch breaks:', lunchBreaksError);
      throw new Error('Failed to fetch barber lunch breaks');
    }
    
    console.log('🍽️ Fetched lunch breaks:', lunchBreaks);
    
    // 4. Get existing bookings for this barber and date with service durations
    const formattedDate = cleanDateString;
    
    // Get bookings with their service durations
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_time,
        service:service_id (
          duration
        )
      `)
      .eq('barber_id', barberId)
      .eq('booking_date', formattedDate)
      .eq('status', 'confirmed');
    
    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError);
      throw new Error('Failed to fetch existing bookings');
    }
    
    // If we're rebooking, exclude the current booking from the list
    let filteredBookings = existingBookings || [];
    if (excludeBookingId) {
      filteredBookings = filteredBookings.filter(booking => booking.id !== excludeBookingId);
    }
    
    console.log('📋 Fetched existing bookings with durations:', filteredBookings);
    
    // 5. Generate all possible time slots
    const timeSlots = generateAvailableTimeSlots(
      openingHours.open_time,
      openingHours.close_time,
      serviceDuration,
      filteredBookings,
      lunchBreaks || []
    );
    
    console.log(`✨ Found ${timeSlots.length} available time slots using 15-minute intervals`);
    
    // Log the last slot info for debugging
    if (timeSlots.length > 0) {
      const lastSlot = timeSlots[timeSlots.length - 1];
      console.log(`🔍 Last available time slot: ${lastSlot}, service duration: ${serviceDuration}min`);
      
      // Parse the last slot time
      const [hours, minutes] = lastSlot.split(':').map(Number);
      const lastSlotMinutes = hours * 60 + minutes;
      const endTimeMinutes = lastSlotMinutes + serviceDuration;
      const endTimeHours = Math.floor(endTimeMinutes / 60);
      const endTimeMinutesRemainder = endTimeMinutes % 60;
      const formattedEndTime = `${String(endTimeHours).padStart(2, '0')}:${String(endTimeMinutesRemainder).padStart(2, '0')}`;
      
      console.log(`🔍 Last slot starts at ${lastSlotMinutes} minutes from midnight`);
      console.log(`🔍 Last slot would end at ${endTimeMinutes} minutes from midnight (${formattedEndTime})`);
      
      const closeTimeFrags = openingHours.close_time.split(':');
      const closeMinutes = parseInt(closeTimeFrags[0]) * 60 + parseInt(closeTimeFrags[1]);
      console.log(`🔍 Closing time is ${closeMinutes} minutes from midnight (${openingHours.close_time})`);
      console.log(`🔍 Difference between end and close: ${closeMinutes - endTimeMinutes} minutes`);
    }
    
    return new Response(
      JSON.stringify({ timeSlots }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Generate all available time slots for a barber based on opening hours,
 * existing bookings, lunch breaks, and service duration
 */
function generateAvailableTimeSlots(
  openTime: string,
  closeTime: string,
  serviceDuration: number,
  existingBookings: any[],
  lunchBreaks: any[]
): string[] {
  // Convert opening and closing hours to minutes for easier calculations
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  
  // Create slots at 15-minute intervals
  const intervalMinutes = 15;
  const availableSlots: string[] = [];
  
  // Debug info
  console.log(`🕐 Generating slots from ${openTime} (${openMinutes} mins) to ${closeTime} (${closeMinutes} mins)`);
  console.log(`⏱️ Service duration: ${serviceDuration} mins`);
  
  // Loop through all possible time slots
  for (let minutes = openMinutes; minutes < closeMinutes; minutes += intervalMinutes) {
    const slotTime = minutesToTime(minutes);
    
    // Check if the service fits within opening hours
    const serviceEndMinutes = minutes + serviceDuration;
    
    // CRITICAL FIX: Allow appointments that end exactly at closing time
    if (serviceEndMinutes > closeMinutes) {
      console.log(`⏰ Skipping slot ${slotTime} because service would end at ${serviceEndMinutes} mins, after close at ${closeMinutes} mins`);
      continue; // This service would go past closing time
    }
    
    // Check if this slot conflicts with any existing booking
    if (hasBookingConflict(slotTime, serviceDuration, existingBookings)) {
      console.log(`📅 Skipping slot ${slotTime} due to booking conflict`);
      continue;
    }
    
    // Check if this slot conflicts with any lunch break
    if (hasLunchBreakConflict(slotTime, serviceDuration, lunchBreaks)) {
      console.log(`🍽️ Skipping slot ${slotTime} due to lunch break conflict`);
      continue;
    }
    
    // Double check calculations for slots near closing time
    if (closeMinutes - serviceEndMinutes < 30) {
      console.log(`⚠️ Close to closing time slot: ${slotTime}`);
      console.log(`   Slot end time: ${serviceEndMinutes} mins, Closing time: ${closeMinutes} mins`);
      console.log(`   Minutes until closing: ${closeMinutes - serviceEndMinutes}`);
      
      if (serviceEndMinutes === closeMinutes) {
        console.log(`✅ This slot ends EXACTLY at closing time, this is allowed`);
      }
    }
    
    // This slot is available
    availableSlots.push(slotTime);
  }
  
  // Double-check - log the last few slots if any exist
  if (availableSlots.length > 0) {
    const lastIndex = availableSlots.length - 1;
    const lastSlot = availableSlots[lastIndex];
    console.log(`🏁 Final check - last slot: ${lastSlot}`);
    
    // Check if the last slot would end at closing time
    const [hours, minutes] = lastSlot.split(':').map(Number);
    const lastSlotMinutes = hours * 60 + minutes;
    const endTimeMinutes = lastSlotMinutes + serviceDuration;
    
    console.log(`🏁 Last slot ends at ${endTimeMinutes} mins, closing time is ${closeMinutes} mins`);
    if (endTimeMinutes === closeMinutes) {
      console.log('✅ Confirmed that last slot ends exactly at closing time');
    }
  } else {
    console.log('⚠️ No available time slots were found');
  }
  
  return availableSlots;
}

/**
 * Check if a given slot conflicts with any existing booking
 */
function hasBookingConflict(
  slotTime: string,
  serviceDuration: number,
  existingBookings: any[]
): boolean {
  // Convert the slot time to minutes
  const slotMinutes = timeToMinutes(slotTime);
  
  // Calculate when this service would end
  const slotEndMinutes = slotMinutes + serviceDuration;
  
  // Debug log
  console.log(`Checking booking conflicts for slot ${slotTime} (${slotMinutes}-${slotEndMinutes} mins)`);
  
  // Check each existing booking
  for (const booking of existingBookings) {
    // Skip if booking doesn't have time or service
    if (!booking.booking_time || !booking.service) continue;
    
    const bookingMinutes = timeToMinutes(booking.booking_time);
    const bookingEndMinutes = bookingMinutes + (booking.service.duration || 60);
    
    console.log(`Comparing with booking at ${booking.booking_time} (${bookingMinutes}-${bookingEndMinutes} mins)`);
    
    // Check if these time ranges overlap
    const hasOverlap = (
      (slotMinutes >= bookingMinutes && slotMinutes < bookingEndMinutes) ||
      (slotEndMinutes > bookingMinutes && slotEndMinutes <= bookingEndMinutes) ||
      (slotMinutes <= bookingMinutes && slotEndMinutes >= bookingEndMinutes)
    );
    
    if (hasOverlap) {
      console.log(`❌ Booking conflict detected with booking at ${booking.booking_time}`);
      return true; // Conflict exists
    }
  }
  
  return false;
}

/**
 * Check if a given slot conflicts with any lunch break
 */
function hasLunchBreakConflict(
  slotTime: string,
  serviceDuration: number,
  lunchBreaks: any[]
): boolean {
  // Convert the slot time to minutes
  const slotMinutes = timeToMinutes(slotTime);
  
  // Calculate when this service would end
  const slotEndMinutes = slotMinutes + serviceDuration;
  
  // Check each lunch break
  for (const lunch of lunchBreaks) {
    // Skip if lunch break doesn't have time or duration
    if (!lunch.start_time || !lunch.duration) continue;
    
    const lunchMinutes = timeToMinutes(lunch.start_time);
    const lunchEndMinutes = lunchMinutes + lunch.duration;

    // Detailed logging for lunch breaks
    console.log(`Checking lunch break: ${lunch.start_time} (${lunchMinutes}-${lunchEndMinutes} mins)`);
    console.log(`Slot: ${slotTime} (${slotMinutes}-${slotEndMinutes} mins)`);
    
    // Check if these time ranges overlap
    const hasOverlap = (
      (slotMinutes >= lunchMinutes && slotMinutes < lunchEndMinutes) ||
      (slotEndMinutes > lunchMinutes && slotEndMinutes <= lunchEndMinutes) ||
      (slotMinutes <= lunchMinutes && slotEndMinutes >= lunchEndMinutes)
    );
    
    if (hasOverlap) {
      console.log('⚠️ Lunch break conflict detected');
      return true; // Conflict exists
    }
  }
  
  return false;
}

/**
 * Convert time string (HH:MM:SS or HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Check if a barber is on holiday on a specific date
 */
async function isBarberOnHoliday(supabase, barberId: string, dateStr: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('barber_holidays')
    .select('*')
    .eq('barber_id', barberId)
    .lte('start_date', dateStr)
    .gte('end_date', dateStr);
    
  if (error) {
    console.error('❌ Error checking barber holidays:', error);
    throw new Error('Failed to check barber holiday status');
  }
  
  return data && data.length > 0;
}
