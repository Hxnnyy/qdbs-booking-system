
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isMobile?: boolean;
}

const NavLink = ({ to, children, className = '', onClick, isMobile = false }: NavLinkProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const baseClasses = isMobile 
    ? "text-lg font-medium transition-colors hover:text-foreground/80" 
    : "text-sm font-medium transition-colors hover:text-foreground/80";
    
  const activeClasses = isActive(to) ? 'text-foreground' : 'text-foreground/60';

  return (
    <Link
      to={to}
      className={`${baseClasses} ${activeClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export default NavLink;
