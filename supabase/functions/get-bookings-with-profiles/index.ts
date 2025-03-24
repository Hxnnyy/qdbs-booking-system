
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

    // Log some details about the bookings we found
    console.log(`Found ${bookingsData.length} bookings`)
    
    // Separate guest bookings and registered user bookings
    const guestBookings = bookingsData.filter(booking => booking.guest_booking === true)
    const registeredBookings = bookingsData.filter(booking => booking.guest_booking !== true)
    
    console.log(`Found ${guestBookings.length} guest bookings and ${registeredBookings.length} registered bookings`)
    
    // Extract user IDs for registered user bookings
    const userIds = registeredBookings
      .filter(booking => booking.user_id)
      .map(booking => booking.user_id)
    
    console.log(`Found ${userIds.length} user IDs for registered bookings`)
    
    let profilesById = {}
    
    if (userIds.length > 0) {
      // Fetch profiles for registered users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, email')
        .in('id', userIds)
      
      if (profilesError) {
        console.error('Profiles fetch error:', profilesError)
      } else if (profilesData) {
        console.log(`Successfully fetched ${profilesData.length} profiles`)
        
        // Create a map of user_id to profile
        profilesById = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile
          return acc
        }, {})
      }
      
      // If any profiles are missing email, fetch from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.error('Error fetching auth users:', authError)
      } else if (authUsers && authUsers.users) {
        console.log(`Got ${authUsers.users.length} auth users`)
        
        // Add email to profiles from auth users
        authUsers.users.forEach(user => {
          if (userIds.includes(user.id)) {
            if (!profilesById[user.id]) {
              // Create a new profile if one doesn't exist
              profilesById[user.id] = {
                id: user.id,
                email: user.email,
                first_name: '',
                last_name: '',
                phone: null
              }
              console.log(`Created new profile for user ${user.id} with email ${user.email}`)
            } else if (!profilesById[user.id].email) {
              // Update email if missing
              profilesById[user.id].email = user.email
              console.log(`Added email ${user.email} to profile ${user.id}`)
            }
          }
        })
      }
    }
    
    // Attach profile data to each booking
    const bookingsWithProfiles = bookingsData.map(booking => {
      const result = { ...booking }
      
      if (booking.guest_booking !== true && booking.user_id) {
        // Attach profile for registered user bookings
        const profile = profilesById[booking.user_id]
        if (profile) {
          result.profile = profile
          console.log(`Attached profile to booking ${booking.id}`)
        } else {
          console.log(`No profile found for user ${booking.user_id} (booking ${booking.id})`)
        }
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
