import { vetOnboardingStatus } from '@/lib/vet-onboarding';
import { uploadVeterinaryLicense } from '@/lib/services/license-service';
import { PageHeading } from '@/components/layout/PageHeading';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const {user}=useAuth();
  return <ProfileEditor key={user?.id||'guest'}/>;
}
function ProfileEditor() {
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
  const ownerReady=!!user?.id&&profile?.user_id===user.id;
  const active=useRef(true);
  const saveLock=useRef(false);
  const [saveError,setSaveError]=useState('');
  const [saveNotice,setSaveNotice]=useState('');
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const profileDirty = useRef(false);
  const profileRevision = useRef(0);
  const loadedProfileId = useRef<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const isVet = role === 'veterinarian';
  const isServiceProvider = role === 'service_provider';

  useEffect(() => {
    if (profile && profile.user_id===user?.id && (loadedProfileId.current !== profile.id || !profileDirty.current)) {
      if (loadedProfileId.current !== profile.id) { profileDirty.current = false; profileRevision.current = 0; }
      loadedProfileId.current = profile.id;
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
  }, [profile,user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSaveNotice('');setSaveError('');
    profileDirty.current = true; profileRevision.current++;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!ownerReady||!profile?.id||saveLock.current) return;
    setSaveError('');setSaveNotice('');
    if (!formData.first_name.trim() || !formData.last_name.trim()) { setSaveError('Enter your first and last names.');document.getElementById(!formData.first_name.trim()?'first_name':'last_name')?.focus(); return; }
    const digits = formData.phone.replace(/\D/g, '');
    if (formData.phone.trim() && (digits.length < 7 || digits.length > 15)) { setSaveError('Enter a valid contact phone number with 7–15 digits.');document.getElementById('phone')?.focus(); return; }
    saveLock.current=true;
    const savingRevision = profileRevision.current;
    setIsSaving(true);
    try {
      const updateData: Record<string, string> = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
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

      const { data:saved,error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id).eq('user_id',user!.id).select('id').single();

      if (error||!saved) throw error||new Error('No profile update acknowledged');
      if(!active.current)return;

      if (profileRevision.current === savingRevision) profileDirty.current = false;
      let refreshFailed=false;try{await refreshProfile();}catch{refreshFailed=true;}
      if(!active.current)return;
      setSaveNotice(profileRevision.current!==savingRevision?'Submitted changes were saved. Newer edits are still unsaved.':refreshFailed?'Your changes were saved. Refresh this page to reload your profile.':'Your profile changes have been saved.');
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      if(active.current)setSaveError('We couldn’t confirm your profile update. Your entries are still here. Please try again.');
    } finally {
      saveLock.current=false;if(active.current)setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !profile?.id || !ownerReady || isUploadingAvatar) return;

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

      const { data:avatarSaved,error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id).eq('user_id',user.id).select('id').single();

      if (updateError||!avatarSaved) throw updateError||new Error('Avatar update not acknowledged');
      if(!active.current)return;

      await refreshProfile();
      if(active.current)toast.success('Avatar updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      if(active.current)toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !profile?.id || !ownerReady || isUploadingLicense) return;

    if (!formData.license_number.trim() || formData.license_number.trim().length > 100) { toast.error('Enter your license number before uploading a document.'); e.target.value = ''; return; }

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
      await uploadVeterinaryLicense(user.id, profile.id, file, formData.license_number);
      if(!active.current)return;

      await refreshProfile();
      if(active.current)toast.success('License uploaded! Pending verification.');
    } catch (error) {
      console.error('Error uploading license:', error);
      if(active.current)toast.error('Failed to upload license');
    } finally {
      setIsUploadingLicense(false);
      if (licenseInputRef.current) licenseInputRef.current.value = '';
    }
  };

  const getInitials = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const { hash } = useLocation();
  useEffect(() => {
    if (ownerReady && hash === '#credentials') document.getElementById('credentials')?.scrollIntoView({ block: 'start' });
  }, [ownerReady, hash]);
  const professionalStatus = vetOnboardingStatus(profile);
  const verificationStatus = { label: professionalStatus.label, color: professionalStatus.approved ? 'default' as const : 'outline' as const };
  const VerificationIcon = professionalStatus.approved ? CheckCircle : Clock;

  if(!ownerReady)return <div className="min-h-screen bg-background"><Navbar/><main id="main-content" className="container-wide pt-32"><p role="status">Checking your account profile…</p></main></div>;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container-wide py-12 pt-28 md:pt-32 pb-20">
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
            <PageHeading size="workspace" className="mb-2" title={<> Profile Settings </>}/>
            <p className="text-muted-foreground font-medium">
              Keep your contact details ready for care requests and conversations.
            </p>
          </div>

          <div className="space-y-8">
            {/* Avatar Section */}
            <Card className="card-elevated overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  {isVet||isServiceProvider?'Professional identity':'Your profile'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex flex-col sm:flex-row items-center gap-8 p-4 rounded-[2rem] bg-primary/5 border border-primary/10">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-elevated transition-transform duration-500 group-hover:scale-105">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={formData.first_name} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold">
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
                          <span className="text-[10px] font-semibold text-white uppercase tracking-wider">Update</span>
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
                    <p className="text-2xl font-semibold text-foreground tracking-tight">{formData.first_name} {formData.last_name}</p>
                    <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">{user?.email}</p>
                    <Badge className="rounded-full px-5 py-1.5 font-semibold uppercase tracking-widest text-[10px] shadow-soft">{role?.replace('_', ' ')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-bold tracking-tight">Core Information</CardTitle>
                <CardDescription className="font-medium">Public and contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">First Name</Label>
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
                    <Label htmlFor="last_name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Last Name</Label>
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
                    <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                    <Input
                      id="phone" type="tel" autoComplete="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234 XXX XXX XXXX"
                      className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Location</Label>
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
                  <Label htmlFor="bio" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">{isVet||isServiceProvider?'Professional Bio':'About you'}</Label>
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
              <Card className="card-elevated overflow-hidden">
                <CardHeader className="bg-primary/5 pb-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <CardTitle id="credentials" className="scroll-mt-28 flex items-center justify-center sm:justify-start gap-2 font-bold tracking-tight">
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
                  <div className="rounded-2xl border bg-muted/20 p-5" aria-label="Professional onboarding progress">
                    <p className="font-semibold">{professionalStatus.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{professionalStatus.description}</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      {professionalStatus.checklist.map(item => <li key={item.label} className="flex items-start gap-2">
                        {item.complete ? <CheckCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                        <span>{item.label}: <strong>{item.complete ? 'Complete' : 'Still needed'}</strong></span>
                      </li>)}
                    </ul>
                    {professionalStatus.href === '/contact' && <Button variant="link" className="mt-3 h-auto p-0" asChild><Link to="/contact">Contact support</Link></Button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="specialty" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Medical Specialty</Label>
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
                      <Label htmlFor="license_number" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">License ID (VCN)</Label>
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
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">License Documentation</Label>
                    {profile?.license_url ? (
                      <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 shadow-soft">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-sm">
                              <FileText className="h-8 w-8" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">Saved licence document</p>
                              <p className="text-sm text-muted-foreground font-medium">
                                {professionalStatus.checklist[1]?.complete ? 'A document is attached to your account.' : 'Upload a valid document belonging to your account.'}
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
                      <button type="button" disabled={isUploadingLicense} aria-label="Upload veterinary license"
                        onClick={() => licenseInputRef.current?.click()}
                        className="p-12 rounded-[2rem] border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer text-center group"
                      >
                        {isUploadingLicense ? (
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="font-semibold text-sm uppercase tracking-widest text-primary">Uploading...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4">
                            <div className="p-5 rounded-[2rem] bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-soft group-hover:shadow-sm group-hover:-translate-y-1">
                              <Upload className="h-10 w-10" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg tracking-tight">Upload Digital License</p>
                              <p className="text-sm text-muted-foreground font-medium">
                                High-quality PDF or JPG recommended (Max 10MB)
                              </p>
                            </div>
                          </div>
                        )}
                      </button>
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
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-bold tracking-tight">Professional Services</CardTitle>
                  <CardDescription className="font-medium">Information about your establishment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="business_name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Facility / Business Name</Label>
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
                    <Label htmlFor="business_address" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Physical Address</Label>
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

            {saveError&&<p role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{saveError}</p>}
            {saveNotice?<p role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">{saveNotice}</p>:profileDirty.current&&!isSaving?<p role="status" className="text-sm text-muted-foreground">You have unsaved profile changes.</p>:null}
            {/* Save Button */}
            <div className="flex justify-center sm:justify-end pt-4">
              <Button onClick={handleSaveProfile} disabled={isSaving} size="xl" className="rounded-full font-semibold px-12 shadow-sm hover:scale-105 transition-all">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Saving Changes
                  </>
                ) : (
                  <>
                    <Save className="mr-3 h-6 w-6" />
                    Save profile
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
