
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Scissors } from 'lucide-react';

export interface Barber {
  id: number;
  name: string;
  specialty: string;
  bio?: string;
  location?: string;
  experience?: string;
  image: string;
}

interface BarberCardProps {
  barber: Barber;
  index: number;
  variant?: 'default' | 'compact' | 'horizontal';
}

const BarberCard: React.FC<BarberCardProps> = ({ 
  barber, 
  index, 
  variant = 'default' 
}) => {
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  // Default card (vertical)
  if (variant === 'default') {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="glass rounded-xl shadow-subtle border border-border overflow-hidden transition-all duration-300 hover:shadow-elevated group h-full"
      >
        <div className="relative aspect-[3/4]">
          <img 
            src={barber.image} 
            alt={barber.name} 
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-lg font-semibold mb-1">{barber.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{barber.specialty}</p>
            <Button asChild className="w-full rounded-full">
              <Link to={`/book?barber=${barber.id}`}>Book Now</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Compact card (smaller vertical)
  if (variant === 'compact') {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="glass rounded-lg shadow-subtle border border-border overflow-hidden transition-all duration-300 hover:shadow-elevated h-full"
      >
        <div className="relative aspect-square">
          <img 
            src={barber.image} 
            alt={barber.name} 
            className="object-cover w-full h-full"
            loading="lazy"
          />
        </div>
        <div className="p-4">
          <h3 className="text-base font-semibold mb-1">{barber.name}</h3>
          <p className="text-xs text-muted-foreground mb-2">{barber.specialty}</p>
        </div>
      </motion.div>
    );
  }
  
  // Horizontal card (for dashboard/selection)
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="glass rounded-lg shadow-subtle border border-border overflow-hidden transition-all duration-300 hover:shadow-elevated group"
    >
      <div className="flex">
        <div className="relative w-24 h-24 flex-shrink-0">
          <img 
            src={barber.image} 
            alt={barber.name} 
            className="object-cover w-full h-full"
            loading="lazy"
          />
        </div>
        <div className="p-4 flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-semibold mb-1">{barber.name}</h3>
            </div>
            <Button asChild size="sm" variant="outline" className="h-8 rounded-full">
              <Link to={`/book?barber=${barber.id}`}>Select</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Scissors className="h-3 w-3" />
              <span>{barber.specialty}</span>
            </div>
            {barber.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{barber.location}</span>
              </div>
            )}
            {barber.experience && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{barber.experience}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BarberCard;
