
import React from 'react';
import Logo from '@/components/navigation/Logo';

interface EmailTemplateProps {
  children: React.ReactNode;
}

export const EmailTemplate = ({ children }: EmailTemplateProps) => {
  return (
    <div className="email-template bg-white">
      <div className="header bg-white border-b p-6 text-center">
        <div className="max-w-[200px] mx-auto text-black">
          <Logo />
        </div>
      </div>
      
      <div className="content p-6">
        {children}
      </div>
      
      <div className="footer text-sm text-gray-600 border-t p-6 text-center">
        <p className="mb-2">Queens Dock Barbershop</p>
        <p className="mb-2">52 Bank Street, Rossendale, BB4 8DY</p>
        <p className="mb-2">Phone: 01706 831878</p>
        <p>© {new Date().getFullYear()} Queens Dock Barbershop. All rights reserved.</p>
      </div>
    </div>
  );
};
