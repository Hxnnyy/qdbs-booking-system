
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Barber } from '@/supabase-types';

interface ColorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentBarber: Barber | null;
  formData: {
    color: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const ColorDialog: React.FC<ColorDialogProps> = ({
  isOpen,
  onOpenChange,
  currentBarber,
  formData,
  onInputChange,
  onSubmit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set {currentBarber?.name}'s Calendar Color</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="barber-color">Select Color</Label>
              <div className="flex gap-2 items-center mt-2">
                <Input
                  id="barber-color"
                  name="color"
                  type="color"
                  value={formData.color || '#3B82F6'}
                  onChange={onInputChange}
                  className="w-16 h-10 p-1"
                />
                <Input
                  name="color"
                  value={formData.color || '#3B82F6'}
                  onChange={onInputChange}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="p-4 border rounded-md">
              <p className="text-sm mb-2">Preview:</p>
              <div 
                className="h-12 rounded-md flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: formData.color || '#3B82F6' }}
              >
                {currentBarber?.name}'s Appointments
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Color</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
