
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scissors, Menu, X, User, LogOut, Calendar, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
            <Scissors className="h-6 w-6 text-burgundy" />
            <span className="text-xl font-bold font-playfair text-foreground tracking-tight">Queens Dock</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
              isActive('/') ? 'text-foreground' : 'text-foreground/60'
            }`}
          >
            Home
          </Link>
          <Link
            to="/services"
            className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
              isActive('/services') ? 'text-foreground' : 'text-foreground/60'
            }`}
          >
            Services
          </Link>
          <Link
            to="/barbers"
            className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
              isActive('/barbers') ? 'text-foreground' : 'text-foreground/60'
            }`}
          >
            Barbers
          </Link>
          <Link
            to="/about"
            className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
              isActive('/about') ? 'text-foreground' : 'text-foreground/60'
            }`}
          >
            About
          </Link>
          <Link to="/book">
            <Button size="sm" className="ml-2 bg-burgundy hover:bg-burgundy-light">
              Book Now
            </Button>
          </Link>
        </nav>

        {/* User Profile/Authentication Buttons */}
        <div className="hidden md:flex items-center space-x-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Account menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" variant="outline">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="inline-flex md:hidden items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background pt-16 px-4">
          <nav className="flex flex-col space-y-4 pt-6 pb-8">
            <Link
              to="/"
              className={`text-lg font-medium transition-colors hover:text-foreground/80 ${
                isActive('/') ? 'text-foreground' : 'text-foreground/60'
              }`}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            <Link
              to="/services"
              className={`text-lg font-medium transition-colors hover:text-foreground/80 ${
                isActive('/services') ? 'text-foreground' : 'text-foreground/60'
              }`}
              onClick={closeMobileMenu}
            >
              Services
            </Link>
            <Link
              to="/barbers"
              className={`text-lg font-medium transition-colors hover:text-foreground/80 ${
                isActive('/barbers') ? 'text-foreground' : 'text-foreground/60'
              }`}
              onClick={closeMobileMenu}
            >
              Barbers
            </Link>
            <Link
              to="/about"
              className={`text-lg font-medium transition-colors hover:text-foreground/80 ${
                isActive('/about') ? 'text-foreground' : 'text-foreground/60'
              }`}
              onClick={closeMobileMenu}
            >
              About
            </Link>
            <Link to="/book" onClick={closeMobileMenu}>
              <Button className="w-full bg-burgundy hover:bg-burgundy-light">
                Book Now
              </Button>
            </Link>
            
            <div className="border-t border-border/30 my-4 pt-4">
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
      )}
    </header>
  );
};

export default Navbar;
