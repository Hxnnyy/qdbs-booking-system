
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ImageUpload from './ImageUpload';

interface EditBarberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    name: string;
    specialty: string;
    bio: string;
    image_url: string;
    color: string;
  };
  barberId: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onImageUploaded: (url: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const EditBarberDialog: React.FC<EditBarberDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  barberId,
  onInputChange,
  onImageUploaded,
  onSubmit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Barber</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-specialty">Specialty</Label>
              <Input
                id="edit-specialty"
                name="specialty"
                value={formData.specialty}
                onChange={onInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                name="bio"
                value={formData.bio}
                onChange={onInputChange}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-image">Profile Image</Label>
              <ImageUpload 
                currentImageUrl={formData.image_url} 
                onImageUploaded={onImageUploaded}
                barberId={barberId}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Calendar Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
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
            <Button type="submit">Update Barber</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
