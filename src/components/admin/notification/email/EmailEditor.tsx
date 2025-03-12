
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface EmailEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const EmailEditor = ({ value, onChange }: EmailEditorProps) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 mb-2">
        <div className="text-sm text-muted-foreground">
          Available variables: {{name}}, {{bookingCode}}, {{bookingDate}}, {{bookingTime}}, {{barberName}}, {{serviceName}}
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
