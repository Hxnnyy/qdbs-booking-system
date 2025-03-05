
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { User, CalendarDays, CheckCircle } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <User size={24} />,
      title: "Choose a Barber",
      description: "Browse and select from our skilled professionals based on their specialties and availability."
    },
    {
      icon: <CalendarDays size={24} />,
      title: "Select a Date & Time",
      description: "Pick a convenient time slot from the real-time availability calendar."
    },
    {
      icon: <CheckCircle size={24} />,
      title: "Confirm Booking",
      description: "Receive immediate confirmation and reminder notifications for your appointment."
    }
  ];
  
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <motion.span 
            className="inline-block px-3 py-1 text-xs font-medium bg-burgundy/20 text-burgundy rounded-full mb-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Simplified Process
          </motion.span>
          <motion.h2 
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-playfair"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            How Our Booking Works
          </motion.h2>
          <motion.p 
            className="text-muted-foreground text-lg font-playfair"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Book your next appointment in three simple steps
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center p-6"
            >
              <div className="w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center mb-6 relative">
                <div className="text-burgundy">{step.icon}</div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-burgundy text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 font-playfair">{step.title}</h3>
              <p className="text-muted-foreground text-sm font-playfair">{step.description}</p>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button asChild size="lg" className="rounded-none bg-burgundy hover:bg-burgundy-light">
            <Link to="/book">Book Your Appointment</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
