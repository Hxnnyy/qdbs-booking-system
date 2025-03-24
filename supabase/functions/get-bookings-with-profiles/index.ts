
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const handleOptions = () => {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  })
}

const getServiceRole = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function fetchPaginatedBookings(page = 0, pageSize = 10) {
  try {
    const supabase = getServiceRole()
    console.log(`Fetching paginated bookings: page ${page}, pageSize ${pageSize}`)
    
    // Get the total count first
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Count error:', countError)
      throw countError
    }
    
    // Calculate pagination range
    const from = page * pageSize
    const to = from + pageSize - 1
    
    console.log(`Fetching bookings with profiles from ${from} to ${to}`)
    
    // Fetch bookings with related data including profiles for registered users
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select(`
        *,
        barber:barber_id(name, color),
        service:service_id(name, price, duration),
        profile:user_id(id, first_name, last_name, phone, email)
      `)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: true })
      .range(from, to)
    
    if (error) {
      console.error('Bookings fetch error:', error)
      throw error
    }
    
    if (!bookingsData || bookingsData.length === 0) {
      console.log('No bookings found')
      return { bookings: [], totalCount: count || 0 }
    }

    console.log(`Found ${bookingsData.length} bookings`)
    
    // Process the bookings to handle guest bookings and ensure email is available
    const processedBookings = await Promise.all(bookingsData.map(async (booking) => {
      const isGuestBooking = booking.guest_booking === true
      
      if (isGuestBooking) {
        // For guest bookings, extract guest info from notes
        if (booking.notes) {
          const nameMatch = booking.notes.match(/Guest booking by (.+?) \(/);
          const phoneMatch = booking.notes.match(/\((.+?)\)/);
          
          if (nameMatch) {
            booking.guest_name = nameMatch[1];
          }
          
          if (phoneMatch) {
            booking.guest_phone = phoneMatch[1];
          }
        }
        
        return booking;
      } else {
        // For registered users, ensure profile has email
        if (booking.profile && !booking.profile.email) {
          // If profile exists but email is missing, fetch it from auth.users
          try {
            const { data: authUsers } = await supabase.auth.admin.listUsers({
              perPage: 1,
              page: 1,
              filter: {
                id: booking.user_id,
              },
            });
            
            if (authUsers && authUsers.users && authUsers.users.length > 0) {
              booking.profile.email = authUsers.users[0].email;
              console.log(`Added email ${booking.profile.email} to profile for booking ${booking.id}`);
            }
          } catch (authError) {
            console.error(`Failed to fetch email for user ${booking.user_id}:`, authError);
          }
        }
        
        return booking;
      }
    }));
    
    return {
      bookings: processedBookings,
      totalCount: count || 0
    }
  } catch (error) {
    console.error('Error in fetchPaginatedBookings:', error)
    throw error
  }
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleOptions()
  }

  try {
    const { page, pageSize } = await req.json()
    
    const result = await fetchPaginatedBookings(page || 0, pageSize || 10)
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
