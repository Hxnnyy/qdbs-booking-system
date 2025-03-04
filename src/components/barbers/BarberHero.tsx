
import React from 'react';
import { motion } from 'framer-motion';

const BarberHero: React.FC = () => {
  return (
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
  );
};

export default BarberHero;
