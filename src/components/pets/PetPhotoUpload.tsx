import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PetPhotoUploadProps {
  currentUrl: string | null;
  profileId: string;
  petId?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
}

export const PetPhotoUpload = ({ 
  currentUrl, 
  profileId, 
  petId,
  onUpload,
  onRemove 
}: PetPhotoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to storage
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = petId || `temp-${Date.now()}`;
      const filePath = `${profileId}/${fileName}.${fileExt}`;

      // Delete old file if exists
      if (currentUrl) {
        const oldPath = currentUrl.split('/pet-avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('pet-avatars').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('pet-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-avatars')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (currentUrl) {
      const path = currentUrl.split('/pet-avatars/')[1];
      if (path) {
        await supabase.storage.from('pet-avatars').remove([path]);
      }
    }
    setPreviewUrl(null);
    onRemove?.();
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className={cn(
          "relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30",
          "flex items-center justify-center bg-muted cursor-pointer group transition-all",
          "hover:border-primary/50"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {displayUrl ? (
          <>
            <img 
              src={displayUrl} 
              alt="Pet photo" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <Upload className="h-8 w-8" />
                <span className="text-xs text-center px-2">Upload Photo</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {displayUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4 mr-1" />
          Remove Photo
        </Button>
      )}
    </div>
  );
};
