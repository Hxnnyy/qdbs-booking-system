
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BookingsByBarber {
  barber_id: string;
  barber_name: string;
  barber_color: string;
  count: number;
}

interface BarberBookingStatsProps {
  barberBookings: BookingsByBarber[];
  total: number;
}

export const BarberBookingStats: React.FC<BarberBookingStatsProps> = ({ 
  barberBookings,
  total
}) => {
  // Find max count to create relative percentages
  const maxCount = barberBookings.length > 0 
    ? Math.max(...barberBookings.map(b => b.count))
    : 1;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Bookings by Barber</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {barberBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active barbers found</p>
          ) : (
            barberBookings.slice(0, 8).map(barber => (
              <div key={barber.barber_id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{barber.barber_name}</span>
                  <span className="text-muted-foreground">{barber.count} ({Math.round((barber.count / total) * 100) || 0}%)</span>
                </div>
                <Progress 
                  value={(barber.count / maxCount) * 100} 
                  className="h-2" 
                  style={{ 
                    '--progress-color': barber.barber_color 
                  } as React.CSSProperties}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
