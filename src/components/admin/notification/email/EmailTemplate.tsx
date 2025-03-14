
import React from 'react';

interface EmailTemplateProps {
  children: React.ReactNode;
}

export const EmailTemplate = ({ children }: EmailTemplateProps) => {
  return (
    <div className="email-template">
      <div className="header bg-[#800020] p-6 text-center">
        <h1 className="text-2xl font-normal text-white">Queens Dock Barbershop</h1>
      </div>
      
      <div className="content bg-white p-8 border border-gray-200">
        {children}
      </div>
      
      <div className="footer text-sm text-gray-600 p-6 text-center bg-gray-50">
        <p className="mb-2">© {new Date().getFullYear()} Queens Dock Barbershop. All rights reserved.</p>
        <p className="mb-2">52 Bank Street, Rossendale, BB4 8DY</p>
        <p className="mb-2">Phone: 01706 831878</p>
      </div>
    </div>
  );
};
