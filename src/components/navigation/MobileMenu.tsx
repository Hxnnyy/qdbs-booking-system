
import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Calendar, Settings, CalendarCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import NavLink from './NavLink';

interface MobileMenuProps {
  isOpen: boolean;
  closeMobileMenu: () => void;
}

const MobileMenu = ({ isOpen, closeMobileMenu }: MobileMenuProps) => {
  const { user, signOut, isAdmin } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-background px-4">
      <nav className="flex flex-col space-y-4 pt-6 pb-8 bg-background">
        <NavLink to="/" onClick={closeMobileMenu} isMobile>Home</NavLink>
        <NavLink to="/services" onClick={closeMobileMenu} isMobile>Services</NavLink>
        <NavLink to="/barbers" onClick={closeMobileMenu} isMobile>Barbers</NavLink>
        <NavLink to="/about" onClick={closeMobileMenu} isMobile>About</NavLink>
        <NavLink to="/verify-booking" onClick={closeMobileMenu} isMobile>
          <span className="flex items-center">
            <CalendarCheck className="mr-2 h-5 w-5" />
            Manage Booking
          </span>
        </NavLink>
        <Link to="/book" onClick={closeMobileMenu}>
          <Button className="w-full bg-burgundy hover:bg-burgundy-light">
            Book Now
          </Button>
        </Link>
        
        <div className="border-t border-border/30 my-4 pt-4 bg-background">
          {user ? (
            <>
              <Link 
                to="/profile" 
                className="flex items-center py-2 text-lg font-medium" 
                onClick={closeMobileMenu}
              >
                <User className="mr-2 h-5 w-5" />
                Profile
              </Link>
              <Link 
                to="/profile" 
                className="flex items-center py-2 text-lg font-medium" 
                onClick={closeMobileMenu}
              >
                <Calendar className="mr-2 h-5 w-5" />
                My Bookings
              </Link>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="flex items-center py-2 text-lg font-medium" 
                  onClick={closeMobileMenu}
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Admin Panel
                </Link>
              )}
              <button 
                onClick={() => {
                  signOut();
                  closeMobileMenu();
                }} 
                className="flex items-center py-2 text-lg font-medium w-full"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="block py-2 text-lg font-medium"
                onClick={closeMobileMenu}
              >
                Sign in
              </Link>
              <Link 
                to="/signup" 
                className="block py-2 text-lg font-medium"
                onClick={closeMobileMenu}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
};

export default MobileMenu;
