
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Client } from '@/types/client';
import { FileSpreadsheet } from 'lucide-react';

interface ExportField {
  key: keyof Client | 'bookingCount';
  label: string;
  selected: boolean;
}

interface ExportClientsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (fields: string[]) => void;
  selectedClientsCount: number;
}

export const ExportClientsDialog: React.FC<ExportClientsDialogProps> = ({
  isOpen,
  onOpenChange,
  onExport,
  selectedClientsCount,
}) => {
  const [fields, setFields] = useState<ExportField[]>([
    { key: 'name', label: 'Name', selected: true },
    { key: 'email', label: 'Email', selected: true },
    { key: 'phone', label: 'Phone', selected: true },
    { key: 'isGuest', label: 'Client Type', selected: true },
    { key: 'bookingCount', label: 'Appointment Count', selected: true },
  ]);

  const handleToggleField = (index: number) => {
    setFields(prevFields => {
      const newFields = [...prevFields];
      newFields[index] = { ...newFields[index], selected: !newFields[index].selected };
      return newFields;
    });
  };

  const handleExport = () => {
    const selectedFields = fields
      .filter(field => field.selected)
      .map(field => field.key as string);
    
    if (selectedFields.length > 0) {
      onExport(selectedFields);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Client Data</DialogTitle>
          <DialogDescription>
            Select which fields to include in the export for {selectedClientsCount} selected client{selectedClientsCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fields to export</Label>
            <div className="grid gap-3">
              {fields.map((field, index) => (
                <div key={field.key as string} className="flex items-center gap-2">
                  <Checkbox 
                    id={`field-${field.key}`}
                    checked={field.selected}
                    onCheckedChange={() => handleToggleField(index)}
                  />
                  <Label htmlFor={`field-${field.key}`} className="cursor-pointer">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as Excel file (.xlsx)
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleExport}
              disabled={!fields.some(f => f.selected) || selectedClientsCount === 0}
            >
              Export
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
