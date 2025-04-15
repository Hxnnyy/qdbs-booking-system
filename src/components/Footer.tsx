import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Scissors, MapPin, Phone, Mail } from 'lucide-react';
import HunnyLogo from '@/assets/images/hunny-logo.svg';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center">
              <Scissors className="h-5 w-5 text-burgundy mr-2" />
              <h3 className="text-lg font-semibold font-playfair">Queens Dock Barbershop</h3>
            </div>
            <p className="text-sm text-muted-foreground font-playfair">
              Traditional barbering with a modern twist, providing premium grooming services in Rossendale since 2015.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground font-playfair">
                <MapPin size={16} className="mr-2 text-burgundy" />
                <span>52 Bank Street, Rossendale, BB4 8DY</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground font-playfair">
                <Phone size={16} className="mr-2 text-burgundy" />
                <span>01706 831878</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground font-playfair">
                <Mail size={16} className="mr-2 text-burgundy" />
                <span>info@queensdockbarbershop.co.uk</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-burgundy transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-burgundy transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-burgundy transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider font-playfair">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="text-sm text-muted-foreground hover:text-burgundy transition-colors font-playfair">
                  Haircuts
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm text-muted-foreground hover:text-burgundy transition-colors font-playfair">
                  Beard Trims
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm text-muted-foreground hover:text-burgundy transition-colors font-playfair">
                  Hot Towel Shaves
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm text-muted-foreground hover:text-burgundy transition-colors font-playfair">
                  Styling
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider font-playfair">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-burgundy transition-colors font-playfair">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/barbers" className="text-sm text-muted-foreground hover:text-burgundy transition-colors font-playfair">
                  Our Barbers
                </Link>
              </li>
              <li>
                <Link to="/book" className="text-sm text-muted-foreground hover:text-burgundy transition-colors font-playfair">
                  Book Appointment
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider font-playfair">Opening Hours</h3>
            <ul className="space-y-2">
              {[{
              day: "Monday",
              hours: "Closed"
            }, {
              day: "Tuesday",
              hours: "9:00 AM - 6:00 PM"
            }, {
              day: "Wednesday",
              hours: "9:00 AM - 5:00 PM"
            }, {
              day: "Thursday",
              hours: "10:00 AM - 8:00 PM"
            }, {
              day: "Friday",
              hours: "9:00 AM - 6:00 PM"
            }, {
              day: "Saturday",
              hours: "8:00 AM - 4:00 PM"
            }, {
              day: "Sunday",
              hours: "Closed"
            }].map((schedule, index) => <li key={index} className="text-sm font-playfair">
                  <span className="text-muted-foreground">{schedule.day}: </span>
                  <span className="text-foreground">{schedule.hours}</span>
                </li>)}
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground font-playfair">
            © {currentYear} Queens Dock Barbershop. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center text-burgundy text-xs px-3 py-1 rounded-full font-playfair bg-slate-50"
            >
              <a 
                href="https://hunny.agency/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center"
              >
                Made by <img 
                  src={HunnyLogo} 
                  alt="Hunny" 
                  className="h-6 w-auto ml-2" 
                />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>;
};

export default Footer;
