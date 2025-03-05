
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadCsvTemplate } from '@/utils/csvUtils';

export const ImportInstructions: React.FC = () => {
  return (
    <div className="bg-secondary/30 p-4 rounded-lg mb-6 border border-border">
      <h3 className="font-medium mb-2">CSV Import Instructions:</h3>
      <ul className="text-sm space-y-1 list-disc pl-5">
        <li>Upload a CSV file with bookings information</li>
        <li>File must contain: Guest Name, Phone, Barber, Service, Date, and Time</li>
        <li>Date format should be DD/MM/YYYY (e.g., 25/12/2023)</li>
        <li>Time format should be HH:MM in 24-hour format (e.g., 14:30)</li>
        <li>Barber names must exactly match those in the system</li>
      </ul>
      <Button 
        type="button" 
        variant="link" 
        onClick={downloadCsvTemplate} 
        className="mt-2 p-0 h-auto text-sm text-primary"
      >
        <Download className="h-3 w-3 mr-1" />
        Download CSV Template
      </Button>
    </div>
  );
};
