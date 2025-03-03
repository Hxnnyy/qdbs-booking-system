
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Scissors, Star } from 'lucide-react';

const barbers = [
  {
    id: 1,
    name: 'James Wilson',
    specialty: 'Classic Cuts',
    experience: '8 years',
    rating: 4.9,
    bio: 'Specializing in classic and traditional cuts with a modern twist. James has worked with celebrities and has a loyal client base.',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Michael Reynolds',
    specialty: 'Modern Styles',
    experience: '6 years',
    rating: 4.8,
    bio: 'Michael is known for his contemporary approach to hair styling and ability to create trendy, fashion-forward looks.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'David Kim',
    specialty: 'Beard Grooming',
    experience: '7 years',
    rating: 4.7,
    bio: 'David is a master of beard styling and facial hair grooming. His precision with a straight razor is unmatched.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 4,
    name: 'Sarah Johnson',
    specialty: 'Fades & Tapers',
    experience: '5 years',
    rating: 4.8,
    bio: 'Sarah has a natural talent for creating perfect fades and tapers. Her attention to detail makes her one of our most requested barbers.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 5,
    name: 'Robert Garcia',
    specialty: 'Textured Hair',
    experience: '9 years',
    rating: 4.9,
    bio: 'Robert specializes in working with all types of textured hair, creating styles that enhance natural texture and volume.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 6,
    name: 'Alex Martinez',
    specialty: 'Creative Color',
    experience: '6 years',
    rating: 4.7,
    bio: 'Alex brings artistic vision to hair coloring, offering everything from subtle highlights to bold, creative color transformations.',
    image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
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
              Our skilled professionals are dedicated to providing you with the perfect cut and grooming experience
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
