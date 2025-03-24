
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

// Extract guest info from notes field
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
  
  // Client information based on booking type
  let clientName = '';
  let clientPhone = '';
  let clientEmail = '';
  
  if (isGuestBooking) {
    // For guest bookings, extract info from notes
    const guestInfo = extractGuestInfo(booking.notes);
    clientName = guestInfo.name;
    clientPhone = guestInfo.phone;
    // Guest email might be in guest_email field if available
    clientEmail = booking.guest_email || '';
  } else if (booking.profile) {
    // For registered users, use profile information
    clientName = `${booking.profile.first_name || ''} ${booking.profile.last_name || ''}`.trim();
    clientPhone = booking.profile.phone || '';
    clientEmail = booking.profile.email || '';
    
    // If name is still empty, try to use email
    if (!clientName && clientEmail) {
      clientName = clientEmail.split('@')[0];
    }
  }
  
  // If we still don't have a name, use a default
  if (!clientName) {
    clientName = 'Unknown Client';
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
            
            <div className="mt-2 text-sm space-y-1">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-gray-700">{clientName}</span>
              </div>
              {clientPhone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-700">{clientPhone}</span>
                </div>
              )}
              {clientEmail && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-700">{clientEmail}</span>
                </div>
              )}
              {isGuestBooking && extractGuestInfo(booking.notes).code !== 'Unknown' && (
                <div className="text-xs text-gray-500">
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
