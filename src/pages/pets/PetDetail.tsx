import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, MessageCircle, PawPrint, Calendar, Weight, Stethoscope } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PetForm } from '@/components/pets/PetForm';
import { PetPhotoUpload } from '@/components/pets/PetPhotoUpload';
import { PetValues } from '@/lib/validation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type SpeciesType = Database['public']['Enums']['species_type'];

interface Pet {
  id: string;
  name: string;
  species: SpeciesType;
  breed: string | null;
  date_of_birth: string | null;
  weight: number | null;
  gender: string | null;
  is_livestock: boolean | null;
  livestock_count: number | null;
  medical_notes: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Consultation {
  id: string;
  status: string;
  chief_complaint: string;
  created_at: string;
}

const PetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id && profile?.id) {
      fetchPet();
      fetchConsultations();
    }
  }, [id, profile?.id]);

  const fetchPet = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', id!)
        .eq('owner_id', profile!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Pet not found');
        navigate('/pets');
        return;
      }
      setPet(data as Pet);
    } catch (error) {
      console.error('Error fetching pet:', error);
      toast.error('Failed to load pet details');
      navigate('/pets');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('id, status, chief_complaint, created_at')
        .eq('pet_id', id!)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  const handleUpdate = async (values: PetValues) => {
    if (!pet) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('pets')
        .update({
          name: values.name,
          species: values.species as SpeciesType,
          breed: values.breed || null,
          date_of_birth: values.dateOfBirth || null,
          weight: values.weight || null,
          gender: values.gender || null,
          is_livestock: values.isLivestock,
          livestock_count: values.isLivestock ? values.livestockCount : 1,
          medical_notes: values.medicalNotes || null,
        })
        .eq('id', pet.id);

      if (error) throw error;

      toast.success('Pet profile updated');
      setIsEditing(false);
      fetchPet();
    } catch (error) {
      console.error('Error updating pet:', error);
      toast.error('Failed to update pet profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (url: string) => {
    if (!pet) return;
    
    try {
      const { error } = await supabase
        .from('pets')
        .update({ avatar_url: url })
        .eq('id', pet.id);

      if (error) throw error;
      setPet({ ...pet, avatar_url: url });
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update photo');
    }
  };

  const handleDelete = async () => {
    if (!pet) return;

    setIsDeleting(true);
    try {
      // Delete avatar from storage if exists
      if (pet.avatar_url) {
        const path = pet.avatar_url.split('/pet-avatars/')[1];
        if (path) {
          await supabase.storage.from('pet-avatars').remove([path]);
        }
      }

      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', pet.id);

      if (error) throw error;

      toast.success(`${pet.name} has been removed`);
      navigate('/pets');
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.error('Failed to delete pet');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-2xl py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-[600px]" />
        </main>
      </div>
    );
  }

  if (!pet) return null;

  const petAge = pet.date_of_birth ? (() => {
    const dob = new Date(pet.date_of_birth);
    const now = new Date();
    const years = now.getFullYear() - dob.getFullYear();
    const months = now.getMonth() - dob.getMonth();
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} old`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} old`;
    return 'Less than a month old';
  })() : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-2xl py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/pets')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Pets
            </Button>

            <div className="flex gap-2">
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {pet.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete {pet.name}'s 
                      profile and remove all associated records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {isEditing ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Edit {pet.name}</CardTitle>
                <CardDescription>Update your pet's information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {profile?.id && (
                  <PetPhotoUpload
                    currentUrl={pet.avatar_url}
                    profileId={profile.id}
                    petId={pet.id}
                    onUpload={handlePhotoUpload}
                    onRemove={() => handlePhotoUpload('')}
                  />
                )}
                
                <PetForm
                  defaultValues={{
                    name: pet.name,
                    species: pet.species,
                    breed: pet.breed || '',
                    dateOfBirth: pet.date_of_birth || '',
                    weight: pet.weight || undefined,
                    gender: pet.gender as 'male' | 'female' | 'unknown' | undefined,
                    isLivestock: pet.is_livestock || false,
                    livestockCount: pet.livestock_count || 1,
                    medicalNotes: pet.medical_notes || '',
                  }}
                  onSubmit={handleUpdate}
                  isSubmitting={isSubmitting}
                  submitLabel="Save Changes"
                />

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Pet Profile Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mx-auto md:mx-0">
                        {pet.avatar_url ? (
                          <img 
                            src={pet.avatar_url} 
                            alt={pet.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PawPrint className="h-16 w-16 text-primary" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                        <h1 className="text-2xl font-bold">{pet.name}</h1>
                        {pet.is_livestock && pet.livestock_count && pet.livestock_count > 1 && (
                          <Badge variant="secondary">×{pet.livestock_count}</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground capitalize mb-4">
                        {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {petAge && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{petAge}</span>
                          </div>
                        )}
                        {pet.weight && (
                          <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-muted-foreground" />
                            <span>{pet.weight} kg</span>
                          </div>
                        )}
                        {pet.gender && pet.gender !== 'unknown' && (
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{pet.gender}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Notes */}
              {pet.medical_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Medical Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{pet.medical_notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Recent Consultations */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Recent Consultations
                  </CardTitle>
                  <Link to="/consultations/new">
                    <Button size="sm">New Consultation</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {consultations.length > 0 ? (
                    <div className="space-y-3">
                      {consultations.map((consultation) => (
                        <Link
                          key={consultation.id}
                          to={`/consultations/${consultation.id}`}
                          className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm line-clamp-2">{consultation.chief_complaint}</p>
                            <Badge variant={getStatusColor(consultation.status)}>
                              {consultation.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(consultation.created_at), 'PPP')}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No consultations yet for {pet.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default PetDetail;
