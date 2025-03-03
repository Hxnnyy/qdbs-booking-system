
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
  rating: number;
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
            <div className="flex items-center space-x-1 text-yellow-500 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill={i < Math.floor(barber.rating) ? "currentColor" : "none"} stroke="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-sm text-foreground ml-1">{barber.rating}</span>
            </div>
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
          <div className="flex items-center space-x-1 text-yellow-500 text-xs">
            <span className="font-medium">{barber.rating}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
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
              <div className="flex items-center space-x-1 text-yellow-500 text-xs mb-2">
                <span className="font-medium">{barber.rating}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
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
