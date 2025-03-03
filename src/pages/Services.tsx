
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Scissors, Clock, SparkleIcon, Brush } from 'lucide-react';

const ServicesPage = () => {
  const services = [
    {
      id: 1,
      name: 'Classic Haircut',
      description: 'A traditional barber cut with attention to detail and precision. Includes consultation, shampoo, and styling.',
      price: '$30',
      duration: '30 min',
      icon: <Scissors className="h-6 w-6" />
    },
    {
      id: 2,
      name: 'Beard Trim',
      description: 'Professional beard shaping and trimming to maintain or create a new style for your facial hair.',
      price: '$20',
      duration: '20 min',
      icon: <Brush className="h-6 w-6" />
    },
    {
      id: 3,
      name: 'Premium Package',
      description: 'The complete experience: haircut, beard trim, hot towel, facial massage, and styling.',
      price: '$60',
      duration: '60 min',
      icon: <SparkleIcon className="h-6 w-6" />
    },
    {
      id: 4,
      name: 'Kids Haircut',
      description: 'Gentle haircuts for children under 12. Fun and comfortable environment with experienced barbers.',
      price: '$25',
      duration: '25 min',
      icon: <Scissors className="h-6 w-6" />
    },
    {
      id: 5,
      name: 'Hot Towel Shave',
      description: 'Classic straight razor shave with hot towel treatment for the smoothest results and relaxing experience.',
      price: '$35',
      duration: '30 min',
      icon: <Brush className="h-6 w-6" />
    },
    {
      id: 6,
      name: 'Hair & Beard Coloring',
      description: 'Professional color application to cover gray hair or create a new look for hair or beard.',
      price: '$45+',
      duration: '45+ min',
      icon: <SparkleIcon className="h-6 w-6" />
    }
  ];

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
              Professional Services
            </motion.span>
            <motion.h1 
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Our Barber Services
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-lg md:text-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Discover our range of premium grooming services designed for the modern man
            </motion.p>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full glass shadow-subtle border border-border transition-all duration-300 hover:shadow-elevated">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        {service.icon}
                      </div>
                      <div className="flex items-center space-x-2 text-base font-semibold">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{service.duration}</span>
                      </div>
                    </div>
                    <CardTitle className="mt-4 text-xl">{service.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {service.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start space-y-4">
                    <div className="text-2xl font-bold text-primary">
                      {service.price}
                    </div>
                    <Button asChild className="w-full rounded-full">
                      <Link to={`/book?service=${service.id}`}>Book This Service</Link>
                    </Button>
                  </CardFooter>
                </Card>
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
            <h2 className="text-3xl font-bold mb-6">Ready for your next grooming experience?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Book an appointment with one of our skilled barbers today
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

export default ServicesPage;
