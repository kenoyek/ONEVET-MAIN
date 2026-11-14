import { petBookingReturn } from '@/lib/pet-booking-return';
import {PageHeading} from '@/components/layout/PageHeading';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PetForm } from '@/components/pets/PetForm';
import { PetPhotoUpload } from '@/components/pets/PetPhotoUpload';
import { PetValues } from '@/lib/validation';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type SpeciesType = Database['public']['Enums']['species_type'];

const PetNew = () => {
  const { user }=useAuth();
  return <PetNewForm key={user?.id || 'guest'}/>;
};
const PetNewForm = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [params]=useSearchParams();
  const returnTo=petBookingReturn(params.get('returnTo'));
  const [petId]=useState(()=>crypto.randomUUID());
  const lock=useRef(false);
  const active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  const [saved,setSaved]=useState<{id:string;name:string}|null>(null);
  useEffect(()=>{if(saved)document.getElementById('pet-saved-title')?.focus();},[saved]);
  const [photoBusy,setPhotoBusy]=useState(false);
  const [saveError,setSaveError]=useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleSubmit = async (values: PetValues) => {
    if(lock.current||photoBusy)return;
    if (!profile?.id || profile.user_id!==user?.id || !profile.is_active) {
      toast.error('You must be logged in to add a pet');
      return;
    }

    lock.current=true;setSaveError('');
    setIsSubmitting(true);
    try {
      let { data, error } = await supabase
        .from('pets')
        .insert({
          id:petId,
          owner_id: profile.id,
          name: values.name,
          species: values.species as SpeciesType,
          breed: values.breed || null,
          date_of_birth: values.dateOfBirth || null,
          weight: values.weight || null,
          gender: values.gender || null,
          is_livestock: values.isLivestock,
          livestock_count: values.isLivestock ? values.livestockCount : 1,
          medical_notes: values.medicalNotes || null,
          avatar_url: avatarUrl,
        })
        .select('id')
        .single();

      if(error?.code==='23505'){
        const recovered=await supabase.from('pets').select('id').eq('id',petId).eq('owner_id',profile.id).maybeSingle();
        if(!recovered.error&&recovered.data){data=recovered.data;error=null;}
      }
      if (error) throw error;
      if(!data)throw new Error('No pet profile returned');

      toast.success(`${values.name} has been added!`);
      if(active.current){
        if(returnTo){const target=new URL(returnTo,'https://1vet.store');target.searchParams.set('animal',`pet:${data.id}`);navigate(target.pathname+target.search);}
        else setSaved({id:data.id,name:values.name});
      }
    } catch (error) {
      console.error('Error creating pet:', error);
      setSaveError('Your pet could not be saved. Your entries are still here. Please try again.');
    } finally {
      lock.current=false;setIsSubmitting(false);
    }
  };

  if(saved) return <div className="min-h-screen bg-background"><Navbar/><main id="main-content" tabIndex={-1} className="container max-w-2xl pt-28 md:pt-36 pb-20">
    <section className="rounded-3xl border bg-card p-6 sm:p-10" aria-labelledby="pet-saved-title">
      <p className="eyebrow mb-3">Profile created</p><h1 tabIndex={-1} id="pet-saved-title" className="text-3xl sm:text-4xl break-words">{saved.name} is part of your care workspace.</h1>
      <p role="status" className="mt-4 text-muted-foreground leading-relaxed">Your animal’s profile has been saved. Choose what you’d like to do next—you can add more details later.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <Link to={`/pets/${saved.id}`} className="care-path"><h2 className="text-lg">Open the saved profile</h2><p className="mt-2 text-sm text-muted-foreground">Review details and start an owner-reported health journal.</p></Link>
        <Link to="/provider-marketplace" className="care-path"><h2 className="text-lg">Find care services</h2><p className="mt-2 text-sm text-muted-foreground">Explore providers and request an appointment. Your request needs provider confirmation.</p></Link>
        <Link to="/marketplace" className="care-path"><h2 className="text-lg">Browse the marketplace</h2><p className="mt-2 text-sm text-muted-foreground">Explore food, supplies and everyday animal care products.</p></Link>
        <Link to="/dashboard" className="care-path"><h2 className="text-lg">Return to your dashboard</h2><p className="mt-2 text-sm text-muted-foreground">See your setup progress, animal records and care activity.</p></Link>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Creating a profile does not book an appointment or confirm a treatment plan.</p>
    </section>
  </main></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container max-w-2xl pt-28 md:pt-36 pb-20"><PageHeading title="Add a new pet" eyebrow="Your animal’s story" description="Start with the essentials. You can update their profile and add owner observations as you go." className="mb-8"/>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate(returnTo || '/pets')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Pet details</CardTitle>
              <CardDescription>
                Create a profile for your pet to manage their health records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {returnTo&&<p className="rounded-xl border bg-muted/30 p-4 text-sm">Add your animal’s details, then continue your appointment request. Availability will be checked again.</p>}
              {profile?.id && (
                <PetPhotoUpload
                  currentUrl={avatarUrl}
                  disabled={isSubmitting}
                  onBusyChange={setPhotoBusy}
                  profileId={profile.id}
                  onUpload={setAvatarUrl}
                  onRemove={() => setAvatarUrl(null)}
                />
              )}
              
              <PetForm 
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting||photoBusy}
                submitLabel="Add Pet"
              />
              {saveError&&<p role="alert" className="text-sm text-destructive">{saveError}</p>}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default PetNew;
