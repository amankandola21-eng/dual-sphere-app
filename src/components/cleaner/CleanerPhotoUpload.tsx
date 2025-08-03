import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, Trash2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CleanerPhotoUploadProps {
  currentPhotoUrl?: string;
  cleanerName?: string;
  onPhotoUpdated: (newPhotoUrl: string | null) => void;
}

export const CleanerPhotoUpload = ({ 
  currentPhotoUrl, 
  cleanerName = "Cleaner",
  onPhotoUpdated 
}: CleanerPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to upload a photo",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Delete old photo if it exists
      if (currentPhotoUrl) {
        await deleteCurrentPhoto(false); // Don't show toast for automatic deletion
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cleaner-photos')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cleaner-photos')
        .getPublicUrl(fileName);

      // Update cleaner profile with new photo URL
      const { error: updateError } = await supabase
        .from('cleaners')
        .update({ profile_photo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Photo Uploaded",
        description: "Your profile photo has been updated successfully.",
      });

      onPhotoUpdated(publicUrl);
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteCurrentPhoto = async (showToast: boolean = true) => {
    if (!user || !currentPhotoUrl) return;

    setDeleting(true);
    try {
      // Extract file path from URL
      const urlParts = currentPhotoUrl.split('/');
      const fileName = `${user.id}/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('cleaner-photos')
        .remove([fileName]);

      if (deleteError) throw deleteError;

      // Update cleaner profile to remove photo URL
      const { error: updateError } = await supabase
        .from('cleaners')
        .update({ profile_photo_url: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      if (showToast) {
        toast({
          title: "Photo Deleted",
          description: "Your profile photo has been removed.",
        });
      }

      onPhotoUpdated(null);
    } catch (error: any) {
      if (showToast) {
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete photo",
          variant: "destructive",
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Profile Photo (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Photo Display */}
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage src={currentPhotoUrl || undefined} alt={cleanerName} />
              <AvatarFallback className="text-2xl">
                {currentPhotoUrl ? (
                  <User className="h-16 w-16" />
                ) : (
                  getInitials(cleanerName)
                )}
              </AvatarFallback>
            </Avatar>
            
            {currentPhotoUrl && (
              <Button
                onClick={() => deleteCurrentPhoto(true)}
                disabled={deleting}
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Upload Controls */}
          <div className="w-full max-w-sm space-y-3">
            <div>
              <Label htmlFor="photo-upload" className="sr-only">
                Upload Profile Photo
              </Label>
              <Input
                id="photo-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : currentPhotoUrl ? 'Change Photo' : 'Upload Photo'}
              </Button>
              
              {currentPhotoUrl && (
                <Button
                  onClick={() => deleteCurrentPhoto(true)}
                  disabled={deleting}
                  variant="outline"
                  size="icon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Info Text */}
          <div className="text-center text-sm text-muted-foreground max-w-sm">
            <p>
              Adding a profile photo helps customers feel more comfortable and builds trust. 
              Photos are optional but recommended.
            </p>
            <p className="mt-2 text-xs">
              Supported formats: JPEG, PNG, WebP. Maximum size: 5MB.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};