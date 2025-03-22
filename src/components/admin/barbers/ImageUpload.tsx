
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { Upload, ImageOff } from 'lucide-react';

interface ImageUploadProps {
  currentImageUrl: string | null;
  onImageUploaded: (url: string) => void;
  barberId: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImageUrl, 
  onImageUploaded,
  barberId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image file size must be less than 2MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a unique file name using barber ID and timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${barberId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log("Attempting to upload file:", filePath);
      
      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('barber_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      
      console.log("File uploaded successfully:", data);
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('barber_images')
        .getPublicUrl(filePath);
      
      console.log("Image uploaded successfully, public URL:", publicUrl);
      
      // Return the public URL to parent component
      onImageUploaded(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-center mb-4">
        {currentImageUrl ? (
          <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-gray-200">
            <img 
              src={currentImageUrl} 
              alt="Barber" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/150?text=No+Image';
              }}
            />
          </div>
        ) : (
          <div className="w-40 h-40 rounded-full flex items-center justify-center bg-muted">
            <ImageOff className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        <div className="relative">
          <Button 
            type="button" 
            variant="outline" 
            className="relative"
            disabled={isUploading}
            onClick={() => {
              // Trigger file input click when button is clicked
              const fileInput = document.getElementById('file-upload') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
          >
            {isUploading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </>
            )}
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
