
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileUp, Download, HelpCircle } from 'lucide-react';
import { Barber, Service } from '@/supabase-types';
import { useBookingImport } from '@/hooks/useBookingImport';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ImportFromCsvProps {
  barbers: Barber[];
  services: Service[];
}

interface ParsedBookingEntry {
  guestName: string;
  guestPhone: string;
  barberName: string;
  barberId?: string;
  serviceName: string;
  serviceId?: string;
  dateRaw: string;
  date?: Date;
  time: string;
  notes: string;
  isValid: boolean;
  errors: string[];
}

export const ImportFromCsv: React.FC<ImportFromCsvProps> = ({ barbers, services }) => {
  const { importBookingsFromCsv, isImporting } = useBookingImport();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBookingEntry[]>([]);
  
  const downloadTemplate = () => {
    const headers = "Guest Name,Phone Number,Barber Name,Service Name,Date (DD/MM/YYYY),Time (HH:MM),Notes\n";
    const exampleRow = "John Smith,07700900000,David Allen,Haircut,01/05/2023,14:30,Regular client\n";
    
    const blob = new Blob([headers, exampleRow], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'booking_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    if (lines.length < 2) {
      toast.error("CSV file appears to be empty or improperly formatted");
      return [];
    }
    
    const headers = lines[0].split(',');
    const expectedHeaders = ["Guest Name", "Phone Number", "Barber Name", "Service Name", "Date (DD/MM/YYYY)", "Time (HH:MM)", "Notes"];
    
    // Check if headers are as expected
    const allHeadersPresent = expectedHeaders.every(header => 
      headers.some(h => h.trim().toLowerCase() === header.toLowerCase())
    );
    
    if (!allHeadersPresent) {
      toast.error("CSV headers don't match the expected format. Download the template for reference.");
      return [];
    }
    
    const results: ParsedBookingEntry[] = [];
    
    // Skip header row, process each data row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = lines[i].split(',');
      if (values.length < 6) continue; // Skip invalid lines
      
      const guestName = values[0].trim();
      const guestPhone = values[1].trim();
      const barberName = values[2].trim();
      const serviceName = values[3].trim();
      const dateRaw = values[4].trim();
      const time = values[5].trim();
      const notes = values[6] ? values[6].trim() : '';
      
      const errors: string[] = [];
      
      // Find matching barber and service
      const matchedBarber = barbers.find(b => 
        b.name.toLowerCase() === barberName.toLowerCase()
      );
      
      const matchedService = services.find(s => 
        s.name.toLowerCase() === serviceName.toLowerCase()
      );
      
      if (!matchedBarber) errors.push(`Barber "${barberName}" not found`);
      if (!matchedService) errors.push(`Service "${serviceName}" not found`);
      
      // Parse date
      let date: Date | undefined;
      try {
        // Try to parse date in DD/MM/YYYY format
        const [day, month, year] = dateRaw.split('/').map(Number);
        date = new Date(year, month - 1, day);
        
        if (isNaN(date.getTime())) {
          errors.push("Invalid date format");
          date = undefined;
        }
      } catch (e) {
        errors.push("Invalid date format");
      }
      
      // Validate time format (HH:MM)
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        errors.push("Invalid time format");
      }
      
      results.push({
        guestName,
        guestPhone,
        barberName,
        barberId: matchedBarber?.id,
        serviceName,
        serviceId: matchedService?.id,
        dateRaw,
        date,
        time,
        notes,
        isValid: errors.length === 0,
        errors
      });
    }
    
    return results;
  };
  
  const handleFileUpload = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }
    
    setFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        setParsedData(parsed);
        
        const validCount = parsed.filter(entry => entry.isValid).length;
        const totalCount = parsed.length;
        
        if (validCount === 0) {
          toast.error("No valid bookings found in the CSV file");
        } else if (validCount < totalCount) {
          toast.warning(`Found ${validCount} valid bookings out of ${totalCount} entries`);
        } else {
          toast.success(`Found ${validCount} valid bookings ready to import`);
        }
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
          onClick={downloadTemplate} 
          className="mt-2 p-0 h-auto text-sm text-primary"
        >
          <Download className="h-3 w-3 mr-1" />
          Download CSV Template
        </Button>
      </div>
      
      {!parsedData.length && (
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
      )}
      
      {parsedData.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableCaption>
                {file?.name} - {parsedData.filter(d => d.isValid).length} valid bookings out of {parsedData.length} entries
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Barber</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.slice(0, 10).map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {entry.isValid ? (
                        <span className="text-green-500 text-xs font-medium inline-block py-1 px-2 rounded-full bg-green-100">
                          Valid
                        </span>
                      ) : (
                        <span className="text-red-500 text-xs font-medium inline-block py-1 px-2 rounded-full bg-red-100">
                          Error
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.guestName}</div>
                      <div className="text-xs text-muted-foreground">{entry.guestPhone}</div>
                    </TableCell>
                    <TableCell>
                      {entry.barberId ? (
                        entry.barberName
                      ) : (
                        <span className="text-red-500">{entry.barberName || "Missing"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.serviceId ? (
                        entry.serviceName
                      ) : (
                        <span className="text-red-500">{entry.serviceName || "Missing"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.date ? (
                        <>
                          <div>{format(entry.date, "MMM d, yyyy")}</div>
                          <div className="text-xs text-muted-foreground">{entry.time}</div>
                        </>
                      ) : (
                        <span className="text-red-500">{entry.dateRaw || "Missing"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.errors.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500">
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="w-80">
                              <ul className="list-disc pl-4 py-1">
                                {entry.errors.map((error, i) => (
                                  <li key={i} className="text-xs">{error}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {parsedData.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {parsedData.length - 10} more entries not shown
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
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
