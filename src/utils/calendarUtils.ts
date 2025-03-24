// Re-export all calendar utilities from separate files
export * from './barberColorUtils';
export * from './eventColorUtils';
export * from './eventCreationUtils';
export * from './eventFilterUtils';
export * from './bookingUpdateUtils';
export * from './holidayIndicatorUtils';

export const bookingToCalendarEvent = (booking: Booking): CalendarEvent => {
  try {
    const bookingDate = booking.booking_date;
    const bookingTime = booking.booking_time;
    
    if (!bookingDate || !bookingTime) {
      throw new Error(`Invalid booking date or time: ${bookingDate} ${bookingTime}`);
    }
    
    // Convert booking date and time to start Date object
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const start = parseISO(`${bookingDate}T${bookingTime}`);
    
    if (isNaN(start.getTime())) {
      throw new Error(`Invalid start date: ${start}`);
    }
    
    // Determine service duration
    const duration = booking.service?.duration || 30; // Default to 30 minutes if no duration available
    
    // Calculate end time
    const end = new Date(start.getTime() + duration * 60 * 1000);
    
    // Determine event title based on data available
    let title;
    let clientName = '';
    
    // Check for profile data first
    if (booking.profile) {
      clientName = `${booking.profile.first_name || ''} ${booking.profile.last_name || ''}`.trim();
      if (!clientName && booking.profile.email) {
        clientName = booking.profile.email.split('@')[0];
      }
    } 
    // If no profile data but not a guest booking, try to extract from notes
    else if (!booking.guest_booking && booking.notes) {
      const userMatch = booking.notes.match(/User: (.+?)\n/);
      if (userMatch && userMatch[1]) {
        clientName = userMatch[1];
      }
    }
    // Guest bookings - extract from notes
    else if (booking.guest_booking && booking.notes) {
      const nameMatch = booking.notes.match(/Guest booking by (.+?) \(/);
      if (nameMatch && nameMatch[1]) {
        clientName = nameMatch[1];
      }
    }
    
    // If we still don't have a name, use a default
    if (!clientName) {
      if (booking.guest_booking) {
        clientName = 'Guest Client';
      } else {
        clientName = 'Client';
      }
    }
    
    title = `${clientName} - ${booking.service?.name || 'Service'}`;
    
    // Generate the booking calendar event
    const event: CalendarEvent = {
      id: booking.id,
      title,
      start,
      end,
      allDay: false,
      status: booking.status,
      barber: booking.barber?.name || 'Unknown',
      barberId: booking.barber_id,
      service: booking.service?.name || 'Unknown Service',
      serviceId: booking.service_id,
      serviceDuration: duration,
      clientName,
      clientEmail: booking.profile?.email || booking.guest_email || '',
      clientPhone: booking.profile?.phone || '',
      isGuest: !!booking.guest_booking,
      notes: booking.notes || '',
      backgroundColor: booking.barber?.color || getRandomColor(booking.barber_id),
      borderColor: 'transparent',
      extendedProps: {
        booking
      }
    };
    
    return event;
  } catch (error) {
    console.error('Error converting booking to calendar event:', error);
    throw error;
  }
};
