
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Scissors, Clock, Brush, SparkleIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';
import { Service } from '@/supabase-types';
import { supabase } from '@/integrations/supabase/client';

// Function to fetch services
const fetchServices = async (): Promise<Service[]> => {
  // @ts-ignore - Supabase types issue
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('name');
    
  if (error) throw error;
  return data || [];
};

// Icon mapping for services
const getServiceIcon = (serviceName: string) => {
  const name = serviceName.toLowerCase();
  if (name.includes('beard') || name.includes('shave')) return <Brush className="h-6 w-6" />;
  if (name.includes('treatment') || name.includes('facial')) return <SparkleIcon className="h-6 w-6" />;
  return <Scissors className="h-6 w-6" />; // Default to scissors
};

const ServicesPage = () => {
  // Use React Query to fetch services
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <Layout>
      {/* Hero section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <motion.span 
              className="inline-block px-3 py-1 text-xs font-medium bg-burgundy/20 text-burgundy rounded-full mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Premium Services
            </motion.span>
            <motion.h1 
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4 font-playfair"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Our Barber Services
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-lg md:text-xl font-playfair"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Discover our range of premium grooming services at Queens Dock Barbershop
            </motion.p>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">
              Error loading services. Please try again later.
            </div>
          ) : services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col glass shadow-subtle border border-white/5 transition-all duration-300 hover:shadow-elevated rounded-none">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-full bg-burgundy/20 text-burgundy">
                          {getServiceIcon(service.name)}
                        </div>
                        <div className="flex items-center space-x-2 text-base font-semibold">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground font-playfair">{service.duration} min</span>
                        </div>
                      </div>
                      <CardTitle className="mt-4 text-xl font-playfair">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-muted-foreground text-sm font-playfair min-h-[3rem]">
                        {service.description || 'Experience our premium service tailored to your needs.'}
                      </p>
                    </CardContent>
                    <CardFooter className="mt-auto flex flex-col items-start space-y-4">
                      <div className="text-2xl font-bold text-burgundy font-playfair">
                        £{service.price.toFixed(2)}
                      </div>
                      <Button asChild className="w-full rounded-none bg-burgundy hover:bg-burgundy-light">
                        <Link to={`/book?service=${service.id}`}>Book This Service</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No services available at the moment. Please check back later.
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-6 font-playfair">Ready for your next grooming experience?</h2>
            <p className="text-muted-foreground text-lg mb-8 font-playfair">
              Book an appointment with one of our skilled barbers today
            </p>
            <Button asChild size="lg" className="rounded-none bg-burgundy hover:bg-burgundy-light">
              <Link to="/book">Book Appointment</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default ServicesPage;
