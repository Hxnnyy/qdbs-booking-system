
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';
import { useBarbers } from '@/hooks/useBarbers';

const FeaturedBarbers: React.FC = () => {
  const { barbers, isLoading } = useBarbers();
  
  // Display only first 3 barbers on homepage
  const featuredBarbers = barbers.slice(0, 3);

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <motion.span 
            className="inline-block px-3 py-1 text-xs font-medium bg-burgundy/20 text-burgundy rounded-full mb-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Meet Our Team
          </motion.span>
          <motion.h2 
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-playfair"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Featured Barbers
          </motion.h2>
          <motion.p 
            className="text-muted-foreground text-lg font-playfair"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our skilled professionals are ready to give you the perfect cut
          </motion.p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBarbers.length > 0 ? (
              featuredBarbers.map((barber, index) => (
                <motion.div
                  key={barber.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass rounded-none shadow-subtle border border-white/5 overflow-hidden transition-all duration-300 hover:shadow-elevated group"
                >
                  <div className="relative aspect-[3/4]">
                    <img 
                      src={barber.image_url || 'https://images.unsplash.com/photo-1612837017391-4b6b7b0f0b0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'} 
                      alt={barber.name} 
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1612837017391-4b6b7b0f0b0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-lg font-semibold mb-1 font-playfair">{barber.name}</h3>
                      <p className="text-sm text-muted-foreground mb-5 font-playfair">{barber.specialty || 'Master Barber'}</p>
                      <Button asChild className="w-full rounded-none bg-burgundy hover:bg-burgundy-light">
                        <Link to={`/book?barber=${barber.id}`}>Book Now</Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground mb-4">No barbers available at this time.</p>
              </div>
            )}
          </div>
        )}
        
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button asChild variant="outline" size="lg" className="rounded-none border-burgundy hover:bg-burgundy/10">
            <Link to="/barbers">View All Barbers</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedBarbers;
