
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/supabase-types';

interface BarberServicesFormProps {
  barberId: string;
  onSaved?: () => void;
}

export const BarberServicesForm: React.FC<BarberServicesFormProps> = ({ barberId, onSaved }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [barberId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all active services
      // @ts-ignore - Supabase types issue
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (servicesError) throw servicesError;
      
      // Fetch barber's current services
      // @ts-ignore - Supabase types issue
      const { data: barberServicesData, error: barberServicesError } = await supabase
        .from('barber_services')
        .select('service_id')
        .eq('barber_id', barberId);
      
      if (barberServicesError) throw barberServicesError;
      
      setServices(servicesData || []);
      setSelectedServices(barberServicesData?.map(item => item.service_id) || []);
    } catch (err: any) {
      toast.error('Error loading services: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, serviceId]);
    } else {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // First, delete all existing barber service entries
      // @ts-ignore - Supabase types issue
      const { error: deleteError } = await supabase
        .from('barber_services')
        .delete()
        .eq('barber_id', barberId);
      
      if (deleteError) throw deleteError;
      
      // Then insert the new selections
      if (selectedServices.length > 0) {
        const servicesToInsert = selectedServices.map(serviceId => ({
          barber_id: barberId,
          service_id: serviceId
        }));
        
        // @ts-ignore - Supabase types issue
        const { error: insertError } = await supabase
          .from('barber_services')
          .insert(servicesToInsert);
        
        if (insertError) throw insertError;
      }
      
      toast.success('Barber services saved successfully');
      
      if (onSaved) {
        onSaved();
      }
    } catch (err: any) {
      toast.error('Error saving barber services: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Services Offered</h3>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Services'}
        </Button>
      </div>
      
      {services.length === 0 ? (
        <p className="text-muted-foreground">No services available. Add services in the services management page.</p>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {services.map(service => (
                <div key={service.id} className="flex items-center space-x-3">
                  <Checkbox 
                    id={`service-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={(checked) => handleServiceToggle(service.id, checked === true)}
                  />
                  <div className="grid grid-cols-3 flex-1">
                    <label 
                      htmlFor={`service-${service.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {service.name}
                    </label>
                    <span className="text-sm text-muted-foreground">
                      £{service.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {service.duration} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
