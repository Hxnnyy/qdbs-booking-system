
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { page = 0, pageSize = 10, filters = {} } = await req.json()

    console.log('Request received for bookings with profiles:')
    console.log('- Page:', page)
    console.log('- Page Size:', pageSize)
    console.log('- Filters:', filters)

    // Build the query with relations
    let query = supabaseClient
      .from('bookings')
      .select(`
        *,
        barber:barber_id(*),
        service:service_id(*)
      `, { count: 'exact' })

    // Apply filters if provided
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.date) query = query.eq('booking_date', filters.date)
    if (filters.barber_id) query = query.eq('barber_id', filters.barber_id)
    
    // Add pagination
    const from = page * pageSize
    const to = from + pageSize - 1
    
    // Execute query with range
    const { data: bookings, error, count } = await query
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('Error fetching bookings:', error)
      throw error
    }

    console.log(`Fetched ${bookings?.length || 0} bookings out of ${count} total`)
    
    // Now separately fetch user profiles to avoid the RLS issues with the join
    const userIds = bookings
      ?.filter(booking => booking.user_id && !booking.guest_booking)
      .map(booking => booking.user_id) || []
    
    console.log(`Fetching profiles for ${userIds.length} users`)
    
    // Create a map of user profiles
    const userProfiles = {}
    
    if (userIds.length > 0) {
      // Get profiles from the profiles table (which should have RLS that allows the admin role)
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('id', userIds)
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        // Don't throw here, just log and continue with what we have
      } else {
        console.log(`Fetched ${profiles?.length || 0} user profiles`)
        
        // Create a map for faster lookup
        profiles?.forEach(profile => {
          userProfiles[profile.id] = profile
        })
      }
    }
    
    // Attach profiles to bookings
    const bookingsWithProfiles = bookings?.map(booking => {
      if (!booking.guest_booking && booking.user_id && userProfiles[booking.user_id]) {
        return {
          ...booking,
          profile: userProfiles[booking.user_id]
        }
      }
      
      // For guest bookings or if profile not found, add an empty profile object
      return {
        ...booking,
        profile: booking.guest_booking ? null : {
          first_name: undefined,
          last_name: undefined,
          email: undefined,
          phone: undefined
        }
      }
    }) || []
    
    // Log profile data to debug
    bookingsWithProfiles?.forEach((booking, index) => {
      console.log(`Booking ${index} user_id: ${booking.user_id}, guest: ${booking.guest_booking}, has profile:`, booking.profile !== null)
    })

    // Return the bookings with profiles
    return new Response(
      JSON.stringify({ 
        bookings: bookingsWithProfiles || [], 
        totalCount: count || 0 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in get-bookings-with-profiles function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
