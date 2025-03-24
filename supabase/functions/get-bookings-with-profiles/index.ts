
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
        service:service_id(*),
        profile:user_id(id, first_name, last_name, email, phone)
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
    
    // Log profile data to debug
    bookings?.forEach((booking, index) => {
      console.log(`Booking ${index} user_id: ${booking.user_id}, has profile:`, booking.profile !== null)
    })

    // Return the bookings with profiles
    return new Response(
      JSON.stringify({ 
        bookings: bookings || [], 
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
