
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Scissors, ImageOff } from 'lucide-react';
import { BookingStepProps } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';

interface BarberSelectionStepProps extends BookingStepProps {
  barbers: Barber[];
  onSelectBarber: (barberId: string) => void;
}

const BarberSelectionStep: React.FC<BarberSelectionStepProps> = ({ 
  barbers, 
  onSelectBarber 
}) => {
  // Filter barbers to show only active ones first, then inactive ones
  const sortedBarbers = [...barbers].sort((a, b) => {
    // Sort by active status first (active barbers first)
    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }
    // Then sort by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedBarbers.map((barber) => (
        <Card 
          key={barber.id}
          className={`transition-all ${barber.active 
            ? 'cursor-pointer hover:shadow-md' 
            : 'opacity-50 cursor-not-allowed'
          }`}
          onClick={() => barber.active && onSelectBarber(barber.id)}
        >
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
              {barber.image_url ? (
                <img 
                  src={barber.image_url} 
                  alt={barber.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/150?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-lg">{barber.name}</h3>
            <p className="text-sm text-muted-foreground">{barber.specialty}</p>
            {!barber.active && (
              <p className="text-sm text-red-500 mt-2">Currently unavailable</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BarberSelectionStep;
