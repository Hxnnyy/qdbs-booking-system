
import React, { useState } from 'react';
import { toast } from 'sonner';
import { FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Barber, Service } from '@/supabase-types';
import { parseCSV, ParsedBookingEntry } from '@/utils/csvParser';

interface FileUploadAreaProps {
  barbers: Barber[];
  services: Service[];
  onFileProcessed: (file: File, data: ParsedBookingEntry[]) => void;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({ 
  barbers, 
  services, 
  onFileProcessed 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileUpload = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text, barbers, services);
        
        const validCount = parsed.filter(entry => entry.isValid).length;
        const totalCount = parsed.length;
        
        if (validCount === 0) {
          toast.error("No valid bookings found in the CSV file");
        } else if (validCount < totalCount) {
          toast.warning(`Found ${validCount} valid bookings out of ${totalCount} entries`);
        } else {
          toast.success(`Found ${validCount} valid bookings ready to import`);
        }
        
        onFileProcessed(file, parsed);
      } catch (error) {
        toast.error("Failed to parse CSV file");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };
  
  return (
    <div 
      className={cn(
        "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('csv-upload')?.click()}
    >
      <FileUp className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-1">
        {isDragging ? "Drop CSV file here" : "Upload CSV File"}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Drag and drop or click to select a CSV file
      </p>
      
      <div className="mt-2">
        <Button type="button" variant="secondary" size="sm">
          Select File
        </Button>
      </div>
      
      <input
        type="file"
        id="csv-upload"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
