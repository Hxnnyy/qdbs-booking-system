
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { barberId, date, serviceDuration, clientDayOfWeek, excludeBookingId } = await req.json()
    
    // Validate required parameters
    if (!barberId || !date) {
      return new Response(
        JSON.stringify({ error: 'Barber ID and date are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    console.log(`🚀 Processing request for barber: ${barberId}, date: ${date}, duration: ${serviceDuration}, exclude booking: ${excludeBookingId || 'none'}`)
    
    // Create a clean date string (YYYY-MM-DD)
    const cleanDateString = date.replace(/T.*$/, '')
    console.log(`🧹 Clean date string: ${cleanDateString}`)
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get day of week (0-6, Sunday to Saturday)
    // We use the client-provided day of week to ensure consistency
    let finalDayOfWeek = clientDayOfWeek
    
    if (finalDayOfWeek === undefined || finalDayOfWeek === null) {
      // Fallback - Calculate server-side if client didn't provide it
      const dateObj = new Date(cleanDateString)
      finalDayOfWeek = dateObj.getUTCDay()
    }
    
    console.log(`📅 Using client-provided day of week: ${finalDayOfWeek}`)
    
    // Parse the date for debugging
    const parsedDate = new Date(cleanDateString)
    console.log(`📅 Parsed date: ${parsedDate.toUTCString()}`)
    console.log(`📅 Final day of week used: ${finalDayOfWeek}`)
    
    // Fetch opening hours for the barber on this day
    const { data: openingHours, error: openingHoursError } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', finalDayOfWeek)
      .maybeSingle()
    
    if (openingHoursError) {
      console.error('Error fetching opening hours:', openingHoursError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch opening hours' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    if (!openingHours || openingHours.is_closed) {
      return new Response(
        JSON.stringify({ 
          timeSlots: [],
          message: 'Barber is not working on this day'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`⏰ Opening hours for this day: ${JSON.stringify(openingHours)}`)
    
    // Fetch lunch breaks for this barber
    const { data: lunchBreaks, error: lunchBreaksError } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId)
      .eq('is_active', true)
    
    if (lunchBreaksError) {
      console.error('Error fetching lunch breaks:', lunchBreaksError)
    }
    
    console.log(`🍽️ Fetched lunch breaks: ${JSON.stringify(lunchBreaks || [])}`)
    
    // Fetch existing bookings for this date and barber
    const bookingsQuery = supabase
      .from('bookings')
      .select('booking_time, service_id, services(duration)')
      .eq('barber_id', barberId)
      .eq('booking_date', cleanDateString)
      .eq('status', 'confirmed')
    
    // Exclude a specific booking ID if needed (for rebooking scenarios)
    if (excludeBookingId) {
      bookingsQuery.neq('id', excludeBookingId)
    }
    
    const { data: existingBookings, error: bookingsError } = await bookingsQuery
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    }
    
    console.log(`📋 Fetched existing bookings with durations: ${JSON.stringify(existingBookings || [])}`)
    
    // Get the service duration (or use default)
    const duration = serviceDuration || 60
    console.log(`⏱️ Service duration: ${duration} mins`)
    
    // Generate all possible time slots based on opening hours
    const [openHours, openMinutes] = openingHours.open_time.split(':').map(Number)
    const [closeHours, closeMinutes] = openingHours.close_time.split(':').map(Number)
    
    const openTimeInMinutes = openHours * 60 + openMinutes
    const closeTimeInMinutes = closeHours * 60 + closeMinutes
    
    console.log(`🕐 Generating slots from ${openingHours.open_time} (${openTimeInMinutes} mins) to ${openingHours.close_time} (${closeTimeInMinutes} mins)`)
    
    const possibleTimeSlots = []
    
    // Generate time slots in 15-minute intervals
    for (let minutes = openTimeInMinutes; minutes < closeTimeInMinutes; minutes += 15) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
      possibleTimeSlots.push({
        time: timeString,
        minutes: minutes
      })
    }
    
    // Filter available time slots
    const availableTimeSlots = []
    
    for (const slot of possibleTimeSlots) {
      const slotEndMinutes = slot.minutes + duration
      
      console.log(`Slot: ${slot.time} (${slot.minutes}-${slotEndMinutes} mins)`)
      
      // Check if slot is within opening hours
      // Note: We allow slots that END exactly at closing time, but not after
      if (slotEndMinutes > closeTimeInMinutes) {
        console.log(`❌ Slot ${slot.time} would end after closing time (${slotEndMinutes} > ${closeTimeInMinutes})`)
        continue
      }
      
      // Check for conflicts with existing bookings
      console.log(`Checking booking conflicts for slot ${slot.time} (${slot.minutes}-${slotEndMinutes} mins)`)
      
      let hasBookingConflict = false
      
      if (existingBookings && existingBookings.length > 0) {
        for (const booking of existingBookings) {
          const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number)
          const bookingTimeInMinutes = bookingHours * 60 + bookingMinutes
          const bookingDuration = booking.services?.duration || 60
          const bookingEndTimeInMinutes = bookingTimeInMinutes + bookingDuration
          
          const hasOverlap = (
            (slot.minutes >= bookingTimeInMinutes && slot.minutes < bookingEndTimeInMinutes) ||
            (slotEndMinutes > bookingTimeInMinutes && slotEndMinutes <= bookingEndTimeInMinutes) ||
            (slot.minutes <= bookingTimeInMinutes && slotEndMinutes >= bookingEndTimeInMinutes)
          )
          
          if (hasOverlap) {
            console.log(`❌ Slot ${slot.time} conflicts with existing booking at ${booking.booking_time}`)
            hasBookingConflict = true
            break
          }
        }
      }
      
      if (hasBookingConflict) {
        continue
      }
      
      // Check for lunch break conflicts
      console.log(`Checking lunch break: ${lunchBreaks?.[0]?.start_time} (${(lunchBreaks?.[0]?.start_time || '').split(':').map(Number)[0] * 60 + (lunchBreaks?.[0]?.start_time || '').split(':').map(Number)[1]}-${(lunchBreaks?.[0]?.start_time || '').split(':').map(Number)[0] * 60 + (lunchBreaks?.[0]?.start_time || '').split(':').map(Number)[1] + (lunchBreaks?.[0]?.duration || 0)} mins)`)
      
      let hasLunchBreakConflict = false
      
      if (lunchBreaks && lunchBreaks.length > 0) {
        for (const lunchBreak of lunchBreaks) {
          const [breakHours, breakMinutes] = lunchBreak.start_time.split(':').map(Number)
          const breakStartInMinutes = breakHours * 60 + breakMinutes
          const breakEndInMinutes = breakStartInMinutes + lunchBreak.duration
          
          const hasOverlap = (
            (slot.minutes >= breakStartInMinutes && slot.minutes < breakEndInMinutes) ||
            (slotEndMinutes > breakStartInMinutes && slotEndMinutes <= breakEndInMinutes) ||
            (slot.minutes <= breakStartInMinutes && slotEndMinutes >= breakEndInMinutes)
          )
          
          if (hasOverlap) {
            console.log(`⚠️ Lunch break conflict detected`)
            hasLunchBreakConflict = true
            break
          }
        }
      }
      
      if (hasLunchBreakConflict) {
        console.log(`🍽️ Skipping slot ${slot.time} due to lunch break conflict`)
        continue
      }
      
      // If all checks pass, add this slot to available slots
      availableTimeSlots.push(slot.time)
    }
    
    console.log(`✅ Found ${availableTimeSlots.length} available time slots`)
    
    return new Response(
      JSON.stringify({ 
        timeSlots: availableTimeSlots,
        dayOfWeek: finalDayOfWeek
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`❌ Error processing request:`, error.message)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        message: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
