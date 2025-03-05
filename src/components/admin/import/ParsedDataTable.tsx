
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ParsedBookingEntry } from '@/utils/csvParser';
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

interface ParsedDataTableProps {
  parsedData: ParsedBookingEntry[];
  fileName: string;
}

export const ParsedDataTable: React.FC<ParsedDataTableProps> = ({ parsedData, fileName }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>
          {fileName} - {parsedData.filter(d => d.isValid).length} valid bookings out of {parsedData.length} entries
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
  );
};
