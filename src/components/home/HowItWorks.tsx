
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { User, CalendarDays, CheckCircle, Calendar, Clock, Bell, Users, Scissors, CalendarClock } from 'lucide-react';

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
  
  const features = [
    {
      icon: <Calendar size={20} />,
      title: "Smart Scheduling",
      description: "Book appointments with an intuitive calendar interface showing real-time availability."
    },
    {
      icon: <Clock size={20} />,
      title: "Time Management",
      description: "Easily reschedule or cancel appointments with just a few clicks."
    },
    {
      icon: <Bell size={20} />,
      title: "Automated Reminders",
      description: "Receive timely notifications via email and SMS to prevent missed appointments."
    },
    {
      icon: <Users size={20} />,
      title: "Barber Selection",
      description: "Browse profiles and select from our team of skilled barbers based on expertise and style."
    },
    {
      icon: <Scissors size={20} />,
      title: "Service Options",
      description: "Choose from a variety of services from classic cuts to premium grooming packages."
    },
    {
      icon: <CalendarClock size={20} />,
      title: "Personal Dashboard",
      description: "Manage all your appointments and preferences from a personalized dashboard."
    }
  ];
  
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* How It Works Header */}
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
        
        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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
        
        {/* Features Header */}
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 font-playfair">Streamlined Booking Experience</h2>
          <p className="text-muted-foreground text-base font-playfair">
            Every feature is designed with simplicity and elegance in mind, ensuring a seamless scheduling process.
          </p>
        </motion.div>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative p-6 glass rounded-none shadow-subtle border border-white/5 transition-all duration-300 hover:shadow-elevated"
            >
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-full bg-burgundy/10 text-burgundy w-fit">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold font-playfair">{feature.title}</h3>
                <p className="text-muted-foreground text-sm font-playfair">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* CTA Button */}
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
