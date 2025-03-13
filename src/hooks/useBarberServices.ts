
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/supabase-types';
import { toast } from 'sonner';

export const useBarberServices = () => {
  const [barberServices, setBarberServices] = useState<Service[]>([]);
  const [isLoadingBarberServices, setIsLoadingBarberServices] = useState<boolean>(false);
  
  const fetchBarberServices = async (barberId: string, allServices: Service[]) => {
    try {
      setIsLoadingBarberServices(true);
      
      const { data: barberServiceLinks, error: barberServicesError } = await supabase
        .from('barber_services')
        .select('service_id')
        .eq('barber_id', barberId);
      
      if (barberServicesError) throw barberServicesError;
      
      if (barberServiceLinks && barberServiceLinks.length > 0) {
        const serviceIds = barberServiceLinks.map(item => item.service_id);
        
        const { data: serviceDetails, error: serviceDetailsError } = await supabase
          .from('services')
          .select('*')
          .in('id', serviceIds)
          .eq('active', true)
          .order('name');
        
        if (serviceDetailsError) throw serviceDetailsError;
        
        setBarberServices(serviceDetails || []);
      } else {
        setBarberServices(allServices.filter(service => service.active));
      }
    } catch (error) {
      console.error('Error fetching barber services:', error);
      toast.error('Failed to load services for this barber');
      setBarberServices(allServices.filter(service => service.active));
    } finally {
      setIsLoadingBarberServices(false);
    }
  };

  return {
    barberServices,
    isLoadingBarberServices,
    fetchBarberServices
  };
};
