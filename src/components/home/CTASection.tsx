
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

const CTASection: React.FC = () => {
  return (
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
  );
};

export default CTASection;
