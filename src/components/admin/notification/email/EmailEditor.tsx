
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface EmailEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const EmailEditor = ({ value, onChange }: EmailEditorProps) => {
  const availableVariables = [
    { label: 'Name', variable: '{{name}}' },
    { label: 'Booking Code', variable: '{{bookingCode}}' },
    { label: 'Booking Date', variable: '{{bookingDate}}' },
    { label: 'Booking Time', variable: '{{bookingTime}}' },
    { label: 'Barber Name', variable: '{{barberName}}' },
    { label: 'Service Name', variable: '{{serviceName}}' }
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 mb-2">
        <div className="text-sm text-muted-foreground">
          Available variables: {availableVariables.map(v => v.variable).join(', ')}
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[300px] font-mono"
      />
    </div>
  );
};
