
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const BarberCTA: React.FC = () => {
  return (
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
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="rounded-none bg-burgundy hover:bg-burgundy-light">
              <Link to="/book">Book Appointment</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-none border-burgundy text-burgundy hover:bg-burgundy/10">
              <Link to="/book-guest">Book as Guest</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BarberCTA;
