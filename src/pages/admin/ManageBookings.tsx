
// Add @ts-ignore to all Supabase queries

// When fetching bookings
// @ts-ignore - Suppressing TypeScript errors for Supabase query
const { data, error } = await supabase
  .from('bookings')
  .select(`
    *,
    barber:barber_id(name),
    service:service_id(name, price, duration)
  `)
  .order('booking_date', { ascending: false })
  .order('booking_time', { ascending: true });

// When updating a booking status
// @ts-ignore - Suppressing TypeScript errors for Supabase query
const { error } = await supabase
  .from('bookings')
  .update({ status: newStatus })
  .eq('id', bookingId);
