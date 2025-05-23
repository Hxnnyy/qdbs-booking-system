
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ImageUpload from './ImageUpload';

interface AddBarberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    name: string;
    specialty: string;
    bio: string;
    image_url: string;
    color: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onImageUploaded: (url: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const AddBarberDialog: React.FC<AddBarberDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  onInputChange,
  onImageUploaded,
  onSubmit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Barber</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                name="specialty"
                value={formData.specialty}
                onChange={onInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={onInputChange}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="image_upload">Profile Image</Label>
              <ImageUpload 
                currentImageUrl={formData.image_url} 
                onImageUploaded={onImageUploaded}
                barberId="new" // Temporary ID for new barbers
              />
            </div>
            <div>
              <Label htmlFor="color">Calendar Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
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
          </div>
          <DialogFooter>
            <Button type="submit">Add Barber</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
