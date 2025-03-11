
import React from 'react';
import { useBarbers } from '@/hooks/useBarbers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface BarberFilterProps {
  selectedBarberId: string | null;
  onChange: (barberId: string | null) => void;
}

export const BarberFilter: React.FC<BarberFilterProps> = ({ selectedBarberId, onChange }) => {
  const { barbers, isLoading } = useBarbers();

  if (isLoading) {
    return <div className="flex gap-2 mb-4">Loading barbers...</div>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Button
        variant={selectedBarberId === null ? "default" : "outline"}
        className="flex items-center gap-2"
        onClick={() => onChange(null)}
      >
        <User className="h-4 w-4" />
        All Barbers
      </Button>
      
      {barbers.map(barber => (
        <Button
          key={barber.id}
          variant={selectedBarberId === barber.id ? "default" : "outline"}
          className="flex items-center gap-2"
          onClick={() => onChange(barber.id)}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={barber.image_url || undefined} alt={barber.name} />
            <AvatarFallback>
              {barber.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {barber.name}
        </Button>
      ))}
    </div>
  );
};
