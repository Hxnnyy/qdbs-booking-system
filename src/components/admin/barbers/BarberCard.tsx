
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Barber } from '@/supabase-types';

interface BarberCardProps {
  barber: Barber;
  onEdit: (barber: Barber) => void;
  onServices: (barber: Barber) => void;
  onHours: (barber: Barber) => void;
  onLunch: (barber: Barber) => void;
  onColor: (barber: Barber) => void;
  onHoliday: (barber: Barber) => void;
  onDeactivate: (barber: Barber) => void;
  onReactivate: (barber: Barber) => void;
  onDelete: (barber: Barber) => void;
}

export const BarberCard: React.FC<BarberCardProps> = ({
  barber,
  onEdit,
  onServices,
  onHours,
  onLunch,
  onColor,
  onHoliday,
  onDeactivate,
  onReactivate,
  onDelete,
}) => {
  return (
    <Card 
      className={`overflow-hidden transition-all duration-200 ${
        barber.active 
          ? 'hover:shadow-md hover:border-primary/20' 
          : 'opacity-60'
      }`}
    >
      <CardContent className="p-0">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-lg leading-none">{barber.name}</h3>
              <p className="text-sm text-muted-foreground">{barber.specialty}</p>
            </div>
            <div>
              {barber.active ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                  Inactive
                </span>
              )}
            </div>
          </div>
          
          {barber.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{barber.bio}</p>
          )}
          
          {barber.color && (
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: barber.color }}
              />
              <span className="text-xs text-muted-foreground">Calendar Color</span>
            </div>
          )}
        </div>
        
        <div className="border-t">
          <div className="grid grid-cols-3 divide-x">
            <Button 
              variant="ghost" 
              className="rounded-none h-10"
              onClick={() => onServices(barber)}
            >
              Services
            </Button>
            <Button 
              variant="ghost"
              className="rounded-none h-10"
              onClick={() => onHours(barber)}
            >
              Hours
            </Button>
            <Button 
              variant="ghost"
              className="rounded-none h-10"
              onClick={() => onHoliday(barber)}
            >
              Holidays
            </Button>
          </div>
        </div>
        
        <div className="border-t p-4 bg-muted/5">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(barber)}
            >
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onLunch(barber)}
            >
              Lunch
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onColor(barber)}
            >
              Color
            </Button>
            
            {barber.active ? (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onDeactivate(barber)}
              >
                Deactivate
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onReactivate(barber)}
              >
                Reactivate
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete(barber)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
