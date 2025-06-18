
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code } from 'lucide-react';

interface EmailEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const EmailEditor = ({ value, onChange }: EmailEditorProps) => {
  const [activeTab, setActiveTab] = useState('code');
  
  const availableVariables = [
    { label: 'Name', variable: '{{name}}' },
    { label: 'Booking Code', variable: '{{bookingCode}}' },
    { label: 'Booking Date', variable: '{{bookingDate}}' },
    { label: 'Booking Time', variable: '{{bookingTime}}' },
    { label: 'Barber Name', variable: '{{barberName}}' },
    { label: 'Service Name', variable: '{{serviceName}}' },
    { label: 'Management Link', variable: '{{managementLink}}' }
  ];

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('email-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + variable + value.substring(end);
      onChange(newValue);
      
      // Reset cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  const previewContent = () => {
    // Replace variables with sample data for preview
    let preview = value;
    const sampleData = {
      '{{name}}': 'John Doe',
      '{{bookingCode}}': 'ABC123',
      '{{bookingDate}}': 'Monday, June 15, 2025',
      '{{bookingTime}}': '14:00',
      '{{barberName}}': 'Mike',
      '{{serviceName}}': 'Haircut',
      '{{managementLink}}': 'https://queensdockbarbershop.co.uk/verify-booking'
    };
    
    Object.entries(sampleData).forEach(([variable, value]) => {
      preview = preview.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    
    return preview;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="text-sm text-muted-foreground mb-2 w-full">
          Available variables (click to insert):
        </div>
        {availableVariables.map((variable) => (
          <Button
            key={variable.variable}
            variant="outline"
            size="sm"
            onClick={() => insertVariable(variable.variable)}
            className="text-xs"
          >
            {variable.label}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            HTML Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code">
          <Textarea
            id="email-content"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
            placeholder="Enter your HTML email template here..."
          />
        </TabsContent>

        <TabsContent value="preview">
          <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px] overflow-auto">
            <div 
              className="bg-white"
              dangerouslySetInnerHTML={{ __html: previewContent() }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
