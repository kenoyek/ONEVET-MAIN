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
          verification_status: 'pending',
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
    if (!profile?.license_number && !profile?.license_url) {
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
    <div className="min-h-screen bg-background bg-mesh-gradient">
      <Navbar />
      
      <main className="container-wide py-12 pt-28 md:pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="mb-10 text-center sm:text-left">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold bg-background">
              Settings
            </Badge>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Profile Settings</h1>
            <p className="text-muted-foreground font-medium">
              Update your presence and professional identity on the platform.
            </p>
          </div>

          <div className="space-y-8">
            {/* Avatar Section */}
            <Card className="glass-card overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  Professional Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex flex-col sm:flex-row items-center gap-8 p-4 rounded-[2rem] bg-primary/5 border border-primary/10">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-elevated transition-transform duration-500 group-hover:scale-105">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={formData.first_name} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-black">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Camera className="h-6 w-6 text-white" />
                          <span className="text-[10px] font-black text-white uppercase tracking-wider">Update</span>
                        </div>
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
                  <div className="text-center sm:text-left">
                    <p className="text-2xl font-black text-foreground tracking-tight">{formData.first_name} {formData.last_name}</p>
                    <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">{user?.email}</p>
                    <Badge className="rounded-full px-5 py-1.5 font-black uppercase tracking-widest text-[10px] shadow-soft">{role?.replace('_', ' ')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-bold tracking-tight">Core Information</CardTitle>
                <CardDescription className="font-medium">Public and contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="John"
                      className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234 XXX XXX XXXX"
                      className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Lagos, Nigeria"
                      className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vet-specific: License Verification */}
            {isVet && (
              <Card className="glass-card overflow-hidden">
                <CardHeader className="bg-primary/5 pb-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <CardTitle className="flex items-center justify-center sm:justify-start gap-2 font-bold tracking-tight">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Shield className="h-5 w-5" />
                        </div>
                        Credential Verification
                      </CardTitle>
                      <CardDescription className="font-medium mt-1">
                        Professional licenses must be verified before consultations.
                      </CardDescription>
                    </div>
                    <Badge variant={verificationStatus.color} className="gap-2 rounded-full px-4 py-1.5 font-bold shadow-sm">
                      <VerificationIcon className="h-3.5 w-3.5" />
                      {verificationStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="specialty" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Medical Specialty</Label>
                      <Input
                        id="specialty"
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleInputChange}
                        placeholder="e.g., Small Animals, Livestock"
                        className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license_number" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">License ID (VCN)</Label>
                      <Input
                        id="license_number"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleInputChange}
                        placeholder="VET-XXXX-XXXX"
                        className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">License Documentation</Label>
                    {profile?.license_url ? (
                      <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 shadow-soft">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-white shadow-glow">
                              <FileText className="h-8 w-8" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">Active File Uploaded</p>
                              <p className="text-sm text-muted-foreground font-medium">
                                Your current license is being processed.
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => licenseInputRef.current?.click()}
                            disabled={isUploadingLicense}
                            className="rounded-full font-bold px-8 border-2"
                          >
                            {isUploadingLicense ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              'Replace File'
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => licenseInputRef.current?.click()}
                        className="p-12 rounded-[2rem] border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer text-center group"
                      >
                        {isUploadingLicense ? (
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="font-black text-sm uppercase tracking-widest text-primary">Uploading...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4">
                            <div className="p-5 rounded-[2rem] bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-soft group-hover:shadow-glow group-hover:-translate-y-1">
                              <Upload className="h-10 w-10" />
                            </div>
                            <div>
                              <p className="font-black text-lg tracking-tight">Upload Digital License</p>
                              <p className="text-sm text-muted-foreground font-medium">
                                High-quality PDF or JPG recommended (Max 10MB)
                              </p>
                            </div>
                          </div>
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
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-bold tracking-tight">Professional Services</CardTitle>
                  <CardDescription className="font-medium">Information about your establishment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="business_name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Facility / Business Name</Label>
                    <Input
                      id="business_name"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Lagos Pet Haven"
                      className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_address" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Physical Address</Label>
                    <Textarea
                      id="business_address"
                      name="business_address"
                      value={formData.business_address}
                      onChange={handleInputChange}
                      placeholder="Complete street address, City, State"
                      rows={3}
                      className="rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex justify-center sm:justify-end pt-4">
              <Button onClick={handleSaveProfile} disabled={isSaving} size="xl" className="rounded-full font-black px-12 shadow-glow hover:scale-105 transition-all">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Saving Changes
                  </>
                ) : (
                  <>
                    <Save className="mr-3 h-6 w-6" />
                    Synchronize Profile
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
