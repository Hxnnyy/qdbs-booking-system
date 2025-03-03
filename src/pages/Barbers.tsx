
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Scissors, Star } from 'lucide-react';

const barbers = [
  {
    id: 1,
    name: 'Chris Skeggs',
    specialty: 'Classic Cuts & Styling',
    experience: '12 years',
    rating: 4.9,
    bio: 'With over a decade of experience, Chris specializes in classic cuts and modern styling techniques. Known for his attention to detail and personalized service.',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Thomas Mayfield',
    specialty: 'Modern Styles & Fades',
    experience: '8 years',
    rating: 4.8,
    bio: 'Thomas brings creativity and precision to every haircut. He excels in modern styles, fades, and texture work, always staying on top of the latest trends.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Conor McKernan',
    specialty: 'Beard Grooming & Shaves',
    experience: '7 years',
    rating: 4.7,
    bio: 'Conor is a master of beard styling and traditional hot towel shaves. His careful approach and steady hand deliver exceptional results every time.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  }
];

const Barbers = () => {
  return (
    <Layout>
      {/* Hero section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <motion.span 
              className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Professional Team
            </motion.span>
            <motion.h1 
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Meet Our Expert Barbers
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-lg md:text-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Our skilled professionals at Queen&apos;s Dock Barbershop are dedicated to providing you with the perfect cut and grooming experience
            </motion.p>
          </div>
        </div>
      </section>

      {/* Barbers grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {barbers.map((barber, index) => (
              <motion.div
                key={barber.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass rounded-xl shadow-subtle border border-border overflow-hidden transition-all duration-300 hover:shadow-elevated"
              >
                <div className="relative aspect-[3/2]">
                  <img 
                    src={barber.image} 
                    alt={barber.name} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold">{barber.name}</h3>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Star size={16} className="fill-current" />
                      <span className="text-sm font-medium text-foreground">{barber.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <Scissors size={16} className="text-primary mr-2" />
                    <span className="text-sm font-medium">{barber.specialty}</span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{barber.experience}</span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-5">
                    {barber.bio}
                  </p>
                  
                  <div className="flex space-x-3">
                    <Button asChild className="flex-1 rounded-full">
                      <Link to={`/book?barber=${barber.id}`}>Book Now</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link to={`/barbers/${barber.id}`}>View Profile</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
            <h2 className="text-3xl font-bold mb-6">Ready to get your best look?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Choose your preferred barber and book your appointment today
            </p>
            <Button asChild size="lg" className="rounded-full">
              <Link to="/book">Book Appointment</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Barbers;
