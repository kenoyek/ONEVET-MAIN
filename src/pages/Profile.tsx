import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Camera, Upload, Loader2, CheckCircle, XCircle, Clock,
  Shield, FileText, Save
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  bio: string;
  specialty: string;
  business_name: string;
  business_address: string;
  license_number: string;
}

export default function Profile() {
  const { user, profile, role, refreshProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    bio: '',
    specialty: '',
    business_name: '',
    business_address: '',
    license_number: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const isVet = role === 'veterinarian';
  const isServiceProvider = role === 'service_provider';

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        specialty: profile.specialty || '',
        business_name: profile.business_name || '',
        business_address: profile.business_address || '',
        license_number: profile.license_number || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;

    setIsSaving(true);
    try {
      const updateData: Record<string, string> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
      };

      if (isVet) {
        updateData.specialty = formData.specialty;
        updateData.license_number = formData.license_number;
      }

      if (isServiceProvider) {
        updateData.business_name = formData.business_name;
        updateData.business_address = formData.business_address;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !profile?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Avatar updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !profile?.id) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }

    setIsUploadingLicense(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/license.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('licenses')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get signed URL for private bucket
      const { data: signedData } = await supabase.storage
        .from('licenses')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          license_url: signedData?.signedUrl || filePath,
          license_verified: false, // Reset verification on new upload
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('License uploaded! Pending verification.');
    } catch (error) {
      console.error('Error uploading license:', error);
      toast.error('Failed to upload license');
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const getInitials = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getVerificationStatus = () => {
    if (!profile?.license_number && !(profile as any)?.license_url) {
      return { status: 'none', label: 'Not Submitted', color: 'secondary' as const, icon: Clock };
    }
    if (profile?.license_verified) {
      return { status: 'verified', label: 'Verified', color: 'default' as const, icon: CheckCircle };
    }
    return { status: 'pending', label: 'Pending Review', color: 'outline' as const, icon: Clock };
  };

  const verificationStatus = getVerificationStatus();
  const VerificationIcon = verificationStatus.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal information and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Photo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={formData.first_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{formData.first_name} {formData.last_name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge className="mt-2 capitalize">{role?.replace('_', ' ')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Lagos, Nigeria"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vet-specific: License Verification */}
            {isVet && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        License Verification
                      </CardTitle>
                      <CardDescription>
                        Upload your veterinary license for verification
                      </CardDescription>
                    </div>
                    <Badge variant={verificationStatus.color} className="gap-1">
                      <VerificationIcon className="h-3 w-3" />
                      {verificationStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      placeholder="e.g., Small Animals, Livestock, Exotic"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      placeholder="VET-XXXX-XXXX"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label>License Document</Label>
                    {(profile as any)?.license_url ? (
                      <div className="p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium">License document uploaded</p>
                              <p className="text-sm text-muted-foreground">
                                Click to replace with a new document
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => licenseInputRef.current?.click()}
                            disabled={isUploadingLicense}
                          >
                            {isUploadingLicense ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Replace'
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => licenseInputRef.current?.click()}
                        className="p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer text-center"
                      >
                        {isUploadingLicense ? (
                          <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="font-medium">Upload License Document</p>
                            <p className="text-sm text-muted-foreground">
                              PDF, JPG, or PNG up to 10MB
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={licenseInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleLicenseUpload}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Provider-specific */}
            {isServiceProvider && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>Details about your pet service business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      placeholder="Your Business Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_address">Business Address</Label>
                    <Textarea
                      id="business_address"
                      name="business_address"
                      value={formData.business_address}
                      onChange={handleInputChange}
                      placeholder="Full business address"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving} size="lg">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
