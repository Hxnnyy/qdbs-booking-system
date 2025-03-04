
import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import NavLink from './NavLink';

const DesktopNav = () => {
  return (
    <nav className="hidden md:flex items-center space-x-6">
      <NavLink to="/">Home</NavLink>
      <NavLink to="/services">Services</NavLink>
      <NavLink to="/barbers">Barbers</NavLink>
      <NavLink to="/about">About</NavLink>
      <NavLink to="/verify-booking">
        <span className="flex items-center">
          <CalendarCheck className="mr-1 h-4 w-4" />
          Manage Booking
        </span>
      </NavLink>
      <Link to="/book">
        <Button size="sm" className="ml-2 bg-burgundy hover:bg-burgundy-light">
          Book Now
        </Button>
      </Link>
    </nav>
  );
};

export default DesktopNav;
