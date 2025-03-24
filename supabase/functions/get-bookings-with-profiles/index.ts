
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
    
    // Then get the paginated data
    const from = page * pageSize
    const to = from + pageSize - 1
    
    // First get the bookings with their related data (barber, service)
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select(`
        *,
        barber:barber_id(name, color),
        service:service_id(name, price, duration)
      `)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: true })
      .range(from, to)
    
    if (error) {
      console.error('Bookings fetch error:', error)
      throw error
    }
    
    if (!bookingsData || bookingsData.length === 0) {
      return { bookings: [], totalCount: count || 0 }
    }
    
    // Extract user IDs for registered users
    const userIds = bookingsData
      .filter(booking => booking.user_id && !booking.guest_booking)
      .map(booking => booking.user_id)
    
    console.log(`Found ${userIds.length} user IDs for registered bookings`)
    
    let profilesById = {}
    
    if (userIds.length > 0) {
      // Fetch profiles directly - with service role we can access this data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, email')
        .in('id', userIds)
      
      if (profilesError) {
        console.error('Profiles fetch error:', profilesError)
      } else if (profilesData) {
        // Create a map of user_id to profile
        profilesById = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile
          return acc
        }, {})
        
        console.log(`Successfully fetched ${profilesData.length} profiles`)
      }
    }
    
    // Attach profile data to each booking
    const bookingsWithProfiles = bookingsData.map(booking => {
      const result = { ...booking }
      
      if (!booking.guest_booking && booking.user_id && profilesById[booking.user_id]) {
        result.profile = profilesById[booking.user_id]
        console.log(`Attached profile to booking ${booking.id}:`, {
          userId: booking.user_id,
          profileName: `${profilesById[booking.user_id].first_name || ''} ${profilesById[booking.user_id].last_name || ''}`.trim()
        })
      }
      
      return result
    })
    
    return {
      bookings: bookingsWithProfiles,
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
