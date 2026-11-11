import { petBookingReturn } from '@/lib/pet-booking-return';
import {PageHeading} from '@/components/layout/PageHeading';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
        else navigate(`/pets/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating pet:', error);
      setSaveError('Your pet could not be saved. Your entries are still here. Please try again.');
    } finally {
      lock.current=false;setIsSubmitting(false);
    }
  };

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
