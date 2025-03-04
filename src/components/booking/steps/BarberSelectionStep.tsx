
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Scissors } from 'lucide-react';
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {barbers.map((barber) => (
        <Card 
          key={barber.id}
          className="cursor-pointer transition-all hover:shadow-md"
          onClick={() => onSelectBarber(barber.id)}
        >
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
              {barber.image_url ? (
                <img 
                  src={barber.image_url} 
                  alt={barber.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Scissors className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-lg">{barber.name}</h3>
            <p className="text-sm text-muted-foreground">{barber.specialty}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BarberSelectionStep;
