
import React from 'react';
import { format, parseISO } from 'date-fns';
import { User, Phone, Edit, Mail } from 'lucide-react';
import { Booking } from '@/supabase-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BookingCardProps {
  booking: Booking;
  onEditBooking: (booking: Booking) => void;
}

// Extract guest info from notes field for guest bookings
const extractGuestInfo = (notes: string | null) => {
  if (!notes) return { name: 'Unknown', phone: 'Unknown', code: 'Unknown' };
  
  const nameMatch = notes.match(/Guest booking by (.+?) \(/);
  const phoneMatch = notes.match(/\((.+?)\)/);
  const codeMatch = notes.match(/Verification code: (\d+)/);
  
  return {
    name: nameMatch ? nameMatch[1] : 'Unknown',
    phone: phoneMatch ? phoneMatch[1] : 'Unknown',
    code: codeMatch ? codeMatch[1] : 'Unknown'
  };
};

const getStatusBadgeClass = (status: string) => {
  switch(status) {
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'no-show':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onEditBooking }) => {
  const isGuestBooking = booking.guest_booking === true;
  
  // Client information container - will be populated differently for guest vs registered users
  let clientInfo = {
    name: 'Unknown Client',
    email: null,
    phone: null
  };
  
  if (isGuestBooking && booking.notes) {
    // For guest bookings, extract info from notes field
    const guestInfo = extractGuestInfo(booking.notes);
    clientInfo = {
      name: guestInfo.name,
      phone: guestInfo.phone !== 'Unknown' ? guestInfo.phone : null,
      email: booking.guest_email || null
    };
  } else if (booking.profile) {
    // For registered users, get info from profile data
    const profile = booking.profile;
    
    // Get full name from profile
    if (profile.first_name || profile.last_name) {
      clientInfo.name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    
    // Get email from profile (should always exist for registered users)
    clientInfo.email = profile.email || null;
    
    // Get phone from profile (optional)
    clientInfo.phone = profile.phone || null;
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold">
                {booking.service?.name}
              </h3>
              <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeClass(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              
              {isGuestBooking && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Guest Booking
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              with {booking.barber?.name} on {format(parseISO(booking.booking_date), 'PP')} at {booking.booking_time}
            </p>
            
            <p className="text-sm font-medium mt-1">
              £{booking.service?.price?.toFixed(2)} • {booking.service?.duration} min
            </p>
            
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 font-medium">{clientInfo.name}</span>
              </div>
              
              {clientInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{clientInfo.email}</span>
                </div>
              )}
              
              {clientInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{clientInfo.phone}</span>
                </div>
              )}
              
              {isGuestBooking && booking.notes && (
                <div className="text-xs text-gray-500 mt-1">
                  Booking Code: <span className="font-mono">{extractGuestInfo(booking.notes).code}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEditBooking(booking)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Booking
            </Button>
          </div>
        </div>
        
        {booking.notes && !isGuestBooking && (
          <div className="mt-4 p-2 bg-gray-50 rounded text-sm">
            <p className="font-medium">Notes:</p>
            <p>{booking.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
