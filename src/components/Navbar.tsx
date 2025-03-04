
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from './navigation/Logo';
import DesktopNav from './navigation/DesktopNav';
import UserMenu from './navigation/UserMenu';
import MobileMenu from './navigation/MobileMenu';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo onClick={closeMobileMenu} />

        {/* Desktop Navigation */}
        <DesktopNav />

        {/* User Profile/Authentication Buttons */}
        <UserMenu />

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
      <MobileMenu isOpen={isMobileMenuOpen} closeMobileMenu={closeMobileMenu} />
    </header>
  );
};

export default Navbar;
