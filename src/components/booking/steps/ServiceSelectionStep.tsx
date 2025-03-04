
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BookingStepProps } from '@/types/booking';
import { Service } from '@/supabase-types';

interface ServiceSelectionStepProps extends BookingStepProps {
  services: Service[];
  onSelectService: (serviceId: string) => void;
}

const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({ 
  services, 
  onSelectService, 
  onBack 
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card 
            key={service.id}
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => onSelectService(service.id)}
          >
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">{service.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
              <div className="flex justify-between">
                <span className="font-medium">£{service.price.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">{service.duration} min</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {onBack && (
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Barbers
          </Button>
        </div>
      )}
    </>
  );
};

export default ServiceSelectionStep;
