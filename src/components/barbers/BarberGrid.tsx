
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { useBarbers } from '@/hooks/useBarbers';
import { Spinner } from '@/components/ui/spinner';

const BarberGrid: React.FC = () => {
  const { barbers, isLoading, error } = useBarbers();
  
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

export default BarberGrid;
