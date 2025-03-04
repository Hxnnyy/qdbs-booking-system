import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const getLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-gray-700 hover:text-burgundy transition-colors duration-200',
      isActive && 'text-burgundy font-medium'
    );

  const getMobileLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md',
      isActive && 'text-burgundy font-medium'
    );

  const renderDesktopMenu = () => (
    <nav className="hidden md:flex space-x-6 items-center">
      <NavLink to="/" className={getLinkClasses}>Home</NavLink>
      <NavLink to="/services" className={getLinkClasses}>Services</NavLink>
      <NavLink to="/barbers" className={getLinkClasses}>Barbers</NavLink>
      <NavLink to="/about" className={getLinkClasses}>About</NavLink>
      <NavLink to="/book" className={getLinkClasses}>Book Now</NavLink>
      <NavLink to="/verify-booking" className={getLinkClasses}>Manage Booking</NavLink>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.jpg" alt={profile?.first_name || user.email} />
                <AvatarFallback>{profile?.first_name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            {profile?.is_admin && (
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                <User className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button className="bg-burgundy hover:bg-burgundy-light" onClick={() => navigate('/signup')}>
            Sign Up
          </Button>
        </div>
      )}
    </nav>
  );
  
  const renderMobileMenu = () => (
    <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'} absolute right-0 top-16 w-full bg-white shadow-lg z-20`}>
      <div className="flex flex-col p-4 space-y-3">
        <NavLink onClick={closeMobileMenu} to="/" className={getMobileLinkClasses}>Home</NavLink>
        <NavLink onClick={closeMobileMenu} to="/services" className={getMobileLinkClasses}>Services</NavLink>
        <NavLink onClick={closeMobileMenu} to="/barbers" className={getMobileLinkClasses}>Barbers</NavLink>
        <NavLink onClick={closeMobileMenu} to="/about" className={getMobileLinkClasses}>About</NavLink>
        <NavLink onClick={closeMobileMenu} to="/book" className={getMobileLinkClasses}>Book Now</NavLink>
        <NavLink onClick={closeMobileMenu} to="/verify-booking" className={getMobileLinkClasses}>Manage Booking</NavLink>
        {user ? (
          <>
            <NavLink onClick={closeMobileMenu} to="/profile" className={getMobileLinkClasses}>Profile</NavLink>
            {profile?.is_admin && (
              <NavLink onClick={closeMobileMenu} to="/admin" className={getMobileLinkClasses}>Admin Dashboard</NavLink>
            )}
            <button 
              onClick={() => {
                handleSignOut();
                closeMobileMenu();
              }} 
              className="py-2 px-4 text-left text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Log out
            </button>
          </>
        ) : (
          <div className="flex flex-col space-y-2 pt-2">
            <Button variant="outline" onClick={() => {
              navigate('/login');
              closeMobileMenu();
            }}>
              Login
            </Button>
            <Button className="bg-burgundy hover:bg-burgundy-light" onClick={() => {
              navigate('/signup');
              closeMobileMenu();
            }}>
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-200",
      scrolled ? "bg-white shadow-md py-2" : "bg-white/80 backdrop-blur-sm py-4"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <NavLink to="/" className="text-2xl font-bold text-burgundy">
              <img src="/logo.png" alt="Barber Shop Logo" className="h-10" />
            </NavLink>
          </div>
          
          {renderDesktopMenu()}
          
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>
      
      {renderMobileMenu()}
    </header>
  );
};

export default Navbar;
