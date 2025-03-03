
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckCircle, Scissors } from 'lucide-react';

const Hero: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  };
  
  const staggerDelay = 0.1;

  return (
    <section className="relative overflow-hidden bg-background pt-20 md:pt-32 pb-16 md:pb-24">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-burgundy/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-burgundy/5 rounded-full blur-[120px]" />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-12">
          <div className="flex-1 space-y-8">
            <motion.div 
              className="space-y-4"
              initial="initial"
              animate="animate"
              variants={{
                animate: {
                  transition: {
                    staggerChildren: staggerDelay
                  }
                }
              }}
            >
              <motion.span 
                className="inline-block px-3 py-1 text-xs font-medium bg-burgundy/20 text-burgundy rounded-full"
                variants={fadeInUp}
              >
                Traditional Craftsmanship. Modern Style.
              </motion.span>
              
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground"
                variants={fadeInUp}
              >
                Queens Dock
                <span className="text-burgundy"> Barbershop</span>
              </motion.h1>
              
              <motion.p 
                className="max-w-xl text-lg text-muted-foreground"
                variants={fadeInUp}
              >
                Premium grooming services in Rossendale. Experience traditional barbering with a modern touch.
              </motion.p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: staggerDelay * 4, duration: 0.5 }}
            >
              <Button asChild size="lg" className="rounded-full bg-burgundy hover:bg-burgundy-light">
                <Link to="/book">Book Appointment</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-burgundy hover:bg-burgundy/10">
                <Link to="/services">Our Services</Link>
              </Button>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: staggerDelay * 5, duration: 0.5 }}
            >
              {[
                { text: "Classic & modern cuts" },
                { text: "Expert beard styling" },
                { text: "Hot towel shaves" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-burgundy" />
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
          
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative aspect-square md:aspect-[4/3] shadow-elevated rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-90"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6">
                <div className="glass rounded-lg p-4 shadow-glass border border-white/5">
                  <div className="flex items-center text-white">
                    <Scissors className="w-4 h-4 mr-2 text-burgundy" />
                    <div className="text-sm font-medium">Est. 2015</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Traditional barbering in Rossendale</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
