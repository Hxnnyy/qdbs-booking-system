
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { useBarbers } from '@/hooks/useBarbers';
import { Spinner } from '@/components/ui/spinner';

const Barbers = () => {
  const { barbers, isLoading, error } = useBarbers();
  
  const renderBarberContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <Spinner className="h-8 w-8" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Failed to load barbers: {error}</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      );
    }
    
    if (barbers.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No barbers available at this time.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {barbers.map((barber, index) => (
          <motion.div
            key={barber.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="glass rounded-none shadow-subtle border border-white/5 overflow-hidden transition-all duration-300 hover:shadow-elevated"
          >
            <div className="relative aspect-[3/2]">
              <img 
                src={barber.image_url || 'https://images.unsplash.com/photo-1612837017391-4b6b7b0f0b0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'} 
                alt={barber.name} 
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1612837017391-4b6b7b0f0b0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>
            <div className="p-6">
              <div className="mb-3">
                <h3 className="text-xl font-semibold font-playfair">{barber.name}</h3>
              </div>
              
              <div className="flex items-center mb-4">
                <Scissors size={16} className="text-burgundy mr-2" />
                <span className="text-sm font-medium font-playfair">{barber.specialty || 'Master Barber'}</span>
              </div>
              
              <p className="text-muted-foreground text-sm mb-5 font-playfair">
                {barber.bio || `${barber.name} is one of our professional barbers with expertise in various cutting and styling techniques.`}
              </p>
              
              <Button asChild className="w-full rounded-none bg-burgundy hover:bg-burgundy-light">
                <Link to={`/book?barber=${barber.id}`}>Book Now</Link>
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

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
              Professional Team
            </motion.span>
            <motion.h1 
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4 font-playfair"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Meet Our Expert Barbers
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-lg md:text-xl font-playfair"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Our skilled professionals at Queens Dock Barbershop are dedicated to providing you with the perfect cut and grooming experience
            </motion.p>
          </div>
        </div>
      </section>

      {/* Barbers grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          {renderBarberContent()}
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
            <h2 className="text-3xl font-bold mb-6 font-playfair">Ready to get your best look?</h2>
            <p className="text-muted-foreground text-lg mb-8 font-playfair">
              Choose your preferred barber and book your appointment today
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

export default Barbers;
