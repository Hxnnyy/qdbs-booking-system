
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const About = () => {
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
              Our Story
            </motion.span>
            <motion.h1 
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              About Queen&apos;s Dock Barbershop
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-lg md:text-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Traditional barbering with a modern touch in the heart of the docks
            </motion.p>
          </div>
        </div>
      </section>

      {/* About content */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-elevated">
                <img 
                  src="https://images.unsplash.com/photo-1521490291151-20eb6fc613f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Queen's Dock Barbershop Team" 
                  className="object-cover w-full h-full"
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">Our Mission</h2>
              <p className="text-muted-foreground">
                At Queen&apos;s Dock Barbershop, we're dedicated to providing exceptional grooming services with a focus on 
                precision, quality, and customer satisfaction. Founded in 2015, our barbershop has become a staple in the community.
              </p>
              <p className="text-muted-foreground">
                With our team of skilled barbers led by Chris, Thomas, and Conor, we combine traditional barbering techniques 
                with contemporary styles to give our clients the best of both worlds.
              </p>
              <h2 className="text-3xl font-bold pt-4">Why Choose Us</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Expert barbers with years of experience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Relaxed, friendly atmosphere</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Quality products and tools</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Easy online booking system</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Convenient location in the heart of the docks</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground text-lg">
              The principles that guide everything we do at Queen&apos;s Dock
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Craftsmanship",
                description: "We take pride in our work, treating each haircut as a form of art that requires skill, precision, and attention to detail."
              },
              {
                title: "Community",
                description: "Our barbershop is more than just a place to get a haircut—it's a community hub where relationships are built and maintained."
              },
              {
                title: "Customer Service",
                description: "We believe in providing exceptional service that exceeds expectations, ensuring every client leaves feeling confident and satisfied."
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass rounded-lg p-6 shadow-subtle border border-border text-center"
              >
                <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-6">Visit Queen&apos;s Dock Barbershop Today</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Experience premium barbering services in a welcoming environment
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/book">Book an Appointment</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
