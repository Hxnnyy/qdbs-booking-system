
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar, Clock, Bell, Users, Scissors, CalendarClock } from 'lucide-react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative p-6 glass rounded-lg shadow-subtle border border-border transition-all duration-300 hover:shadow-elevated"
    >
      <div className="flex flex-col gap-4">
        <div className="p-3 rounded-full bg-primary/10 text-primary w-fit">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </motion.div>
  );
};

const Features: React.FC = () => {
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
      description: "Browse profiles and select from up to 10 skilled barbers based on expertise and style."
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

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section className="py-16 md:py-24 bg-secondary/30" id="features">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Streamlined Booking Experience</h2>
          <p className="text-muted-foreground text-lg">
            Every feature is designed with simplicity and elegance in mind, ensuring a seamless scheduling process.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
