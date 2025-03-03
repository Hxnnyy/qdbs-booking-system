
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, CheckCircle, User } from 'lucide-react';

const barbers = [
  {
    id: 1,
    name: 'Chris Skeggs',
    specialty: 'Classic Cuts',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Thomas Mayfield',
    specialty: 'Modern Styles',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Conor McKernan',
    specialty: 'Beard Grooming',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
  }
];

const Index: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <Features />
      
      {/* How It Works Section */}
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
            {[
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
            ].map((step, index) => (
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
      
      {/* Featured Barbers Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <motion.span 
              className="inline-block px-3 py-1 text-xs font-medium bg-burgundy/20 text-burgundy rounded-full mb-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Meet Our Team
            </motion.span>
            <motion.h2 
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-playfair"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Featured Barbers
            </motion.h2>
            <motion.p 
              className="text-muted-foreground text-lg font-playfair"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Our skilled professionals are ready to give you the perfect cut
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {barbers.map((barber, index) => (
              <motion.div
                key={barber.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass rounded-none shadow-subtle border border-white/5 overflow-hidden transition-all duration-300 hover:shadow-elevated group"
              >
                <div className="relative aspect-[3/4]">
                  <img 
                    src={barber.image} 
                    alt={barber.name} 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-lg font-semibold mb-1 font-playfair">{barber.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 font-playfair">{barber.specialty}</p>
                    <div className="flex items-center space-x-1 text-yellow-500 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill={i < Math.floor(barber.rating) ? "currentColor" : "none"} stroke="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-sm text-foreground ml-1">{barber.rating}</span>
                    </div>
                    <Button asChild className="w-full rounded-none bg-burgundy hover:bg-burgundy-light">
                      <Link to={`/book?barber=${barber.id}`}>Book Now</Link>
                    </Button>
                  </div>
                </div>
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
            <Button asChild variant="outline" size="lg" className="rounded-none border-burgundy hover:bg-burgundy/10">
              <Link to="/barbers">View All Barbers</Link>
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-1/2 h-1/2 bg-burgundy/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-1/2 h-1/2 bg-burgundy/5 rounded-full blur-[120px]" />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              className="glass rounded-none shadow-elevated border border-white/5 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                  <div className="space-y-4 md:max-w-xl">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-playfair">Ready for your next appointment?</h2>
                    <p className="text-muted-foreground font-playfair">
                      Join our platform today and experience the simplicity of modern barber booking. No more waiting in line or phone calls.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <Button asChild size="lg" className="rounded-none bg-burgundy hover:bg-burgundy-light">
                        <Link to="/signup">Sign up now</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="rounded-none border-burgundy hover:bg-burgundy/10">
                        <Link to="/book">Book as guest</Link>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 hidden md:block">
                    <div className="p-1 bg-burgundy/10 rounded-full">
                      <Clock className="w-32 h-32 text-burgundy/80" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
