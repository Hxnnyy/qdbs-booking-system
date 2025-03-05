
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { Barber, Service } from '@/supabase-types';
import { useBookingImport } from '@/hooks/useBookingImport';
import { ParsedBookingEntry } from '@/utils/csvParser';
import { ImportInstructions } from './import/ImportInstructions';
import { FileUploadArea } from './import/FileUploadArea';
import { ParsedDataTable } from './import/ParsedDataTable';

interface ImportFromCsvProps {
  barbers: Barber[];
  services: Service[];
}

export const ImportFromCsv: React.FC<ImportFromCsvProps> = ({ barbers, services }) => {
  const { importBookingsFromCsv, isImporting } = useBookingImport();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBookingEntry[]>([]);
  
  const handleFileProcessed = (file: File, data: ParsedBookingEntry[]) => {
    setFile(file);
    setParsedData(data);
  };
  
  const handleImport = async () => {
    if (!parsedData.length) {
      toast.error("No data to import");
      return;
    }
    
    const validEntries = parsedData.filter(entry => entry.isValid);
    if (validEntries.length === 0) {
      toast.error("No valid bookings to import");
      return;
    }
    
    try {
      const result = await importBookingsFromCsv(validEntries);
      toast.success(`Successfully imported ${result.successCount} bookings`);
      
      if (result.failedCount > 0) {
        toast.warning(`Failed to import ${result.failedCount} bookings`);
      }
      
      // Reset after successful import
      setFile(null);
      setParsedData([]);
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    }
  };
  
  return (
    <div className="space-y-6">
      <ImportInstructions />
      
      {!parsedData.length && (
        <FileUploadArea 
          barbers={barbers} 
          services={services} 
          onFileProcessed={handleFileProcessed}
        />
      )}
      
      {parsedData.length > 0 && (
        <>
          <ParsedDataTable parsedData={parsedData} fileName={file?.name || 'Uploaded file'} />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setFile(null);
                setParsedData([]);
              }}
            >
              Cancel
            </Button>
            
            <Button 
              type="button" 
              onClick={handleImport}
              disabled={parsedData.filter(d => d.isValid).length === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Importing...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Import {parsedData.filter(d => d.isValid).length} Booking(s)
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
