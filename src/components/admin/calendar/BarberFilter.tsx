
import React from 'react';
import { useBarbers } from '@/hooks/useBarbers';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UsersRound, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BarberFilterProps {
  selectedBarberId: string | null;
  onSelectBarber: (barberId: string | null) => void;
}

export const BarberFilter: React.FC<BarberFilterProps> = ({
  selectedBarberId,
  onSelectBarber,
}) => {
  const { barbers, isLoading, error } = useBarbers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-12">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Error loading barbers: {error}
      </div>
    );
  }

  const activeBarbers = barbers.filter(barber => barber.active);

  if (activeBarbers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No active barbers found.
      </div>
    );
  }

  return (
    <div className="p-2 bg-background border rounded-lg shadow-sm">
      <h3 className="px-3 text-sm font-medium mb-2">Filter by Barber</h3>
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant={selectedBarberId === null ? "default" : "outline"}
          size="sm"
          className="h-auto py-1.5 gap-2"
          onClick={() => onSelectBarber(null)}
        >
          <UsersRound className="h-4 w-4" />
          <span>All</span>
        </Button>
        
        {activeBarbers.map((barber) => (
          <Button
            key={barber.id}
            variant={selectedBarberId === barber.id ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-auto py-1.5 gap-2",
              selectedBarberId === barber.id && "relative pl-8"
            )}
            onClick={() => onSelectBarber(barber.id)}
          >
            <Avatar className="h-5 w-5 mr-1">
              {barber.image_url ? (
                <AvatarImage src={barber.image_url} alt={barber.name} />
              ) : (
                <AvatarFallback className="text-xs">
                  {barber.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <span>{barber.name}</span>
            {selectedBarberId === barber.id && (
              <X className="h-3.5 w-3.5 ml-1 text-primary-foreground" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};
