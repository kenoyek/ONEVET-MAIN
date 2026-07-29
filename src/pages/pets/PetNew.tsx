import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleSubmit = async (values: PetValues) => {
    if (!profile?.id) {
      toast.error('You must be logged in to add a pet');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('pets')
        .insert({
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

      if (error) throw error;

      toast.success(`${values.name} has been added!`);
      navigate(`/pets/${data.id}`);
    } catch (error) {
      console.error('Error creating pet:', error);
      toast.error('Failed to create pet profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-2xl py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Add a New Pet</CardTitle>
              <CardDescription>
                Create a profile for your pet to manage their health records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {profile?.id && (
                <PetPhotoUpload
                  currentUrl={avatarUrl}
                  profileId={profile.id}
                  onUpload={setAvatarUrl}
                  onRemove={() => setAvatarUrl(null)}
                />
              )}
              
              <PetForm 
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel="Add Pet"
              />
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default PetNew;
