
import { useState } from 'react';
import { Client } from '@/types/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const useClientExport = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Export clients data to Excel
  const exportClientsData = (clientsToExport: Client[], fields: string[]) => {
    try {
      setIsLoading(true);
      // Map client data to include only the selected fields
      const data = clientsToExport.map(client => {
        const row: Record<string, any> = {};
        
        fields.forEach(field => {
          if (field === 'isGuest') {
            // Format isGuest as a string
            row['Client Type'] = client.isGuest ? 'Guest' : 'Registered';
          } else if (field === 'bookingCount') {
            row['Appointment Count'] = client[field];
          } else {
            // Use the field name as the column header with proper capitalization
            const headerName = field.charAt(0).toUpperCase() + field.slice(1);
            row[headerName] = client[field as keyof Client] || 'N/A';
          }
        });
        
        return row;
      });
      
      // Create a new workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');
      
      // Generate the Excel file
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const fileName = `client_data_export_${timestamp}.xlsx`;
      
      // Save the file
      XLSX.writeFile(wb, fileName);
      
      toast.success('Client data exported successfully');
      return true;
    } catch (err: any) {
      console.error('Error exporting client data:', err);
      toast.error(`Failed to export client data: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    exportClientsData,
    isLoading
  };
};
