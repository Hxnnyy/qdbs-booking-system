
import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

interface LogoProps {
  onClick?: () => void;
}

const Logo = ({ onClick }: LogoProps) => {
  return (
    <div className="flex items-center">
      <Link to="/" className="flex items-center space-x-2" onClick={onClick}>
        <Scissors className="h-6 w-6 text-burgundy" />
        <span className="text-xl font-bold font-playfair text-foreground tracking-tight">Queens Dock</span>
      </Link>
    </div>
  );
};

export default Logo;
