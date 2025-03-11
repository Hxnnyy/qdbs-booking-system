
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (color: string) => void;
  initialColor?: string;
}

export const ColorPickerDialog: React.FC<ColorPickerDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialColor = '#9b87f5'
}) => {
  const [color, setColor] = React.useState(initialColor);

  const handleSave = () => {
    onSave(color);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Barber Color</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="color">Calendar Color</Label>
          <div className="flex items-center gap-4 mt-2">
            <Input
              type="color"
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-24 h-12"
            />
            <div 
              className="w-full h-12 rounded border"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Color</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
