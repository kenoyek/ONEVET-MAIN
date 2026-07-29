import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, MessageCircle, PawPrint, Calendar, Weight, Stethoscope, Shield, Syringe, Activity, Pill, Users, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PetForm } from '@/components/pets/PetForm';
import { PetPhotoUpload } from '@/components/pets/PetPhotoUpload';
import { PetPassportTimeline } from '@/components/pets/PetPassportTimeline';
import { PetCaregiversManager } from '@/components/pets/PetCaregiversManager';
import { petPassportService } from '@/lib/services/pet-passport-service';
import { PetValues } from '@/lib/validation';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [pet, setPet] = useState<any | null>(null);
  const [passportData, setPassportData] = useState<any | null>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dialog state for records
  const [vaccineOpen, setVaccineOpen] = useState(false);
  const [vaccineName, setVaccineName] = useState('');
  const [adminDate, setAdminDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');

  const [weightOpen, setWeightOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const fetchPetAndPassport = useCallback(async () => {
    if (!id || !user) return;
    try {
      const data = await petPassportService.getPetPassport(id);
      if (!data.pet) {
        toast.error('Pet not found');
        navigate('/pets');
        return;
      }
      setPet(data.pet);
      setPassportData(data);
    } catch (error) {
      console.error('Error fetching pet passport:', error);
      toast.error('Failed to load pet health passport');
    } finally {
      setIsLoading(false);
    }
  }, [id, user, navigate]);

  const fetchConsultations = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('id, status, chief_complaint, created_at')
        .eq('pet_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id && user) {
      fetchPetAndPassport();
      fetchConsultations();
    }
  }, [id, user, fetchPetAndPassport, fetchConsultations]);

  const handleUpdate = async (values: PetValues) => {
    if (!pet) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('pets')
        .update({
          name: values.name,
          species: values.species as any,
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
      fetchPetAndPassport();
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
      if (pet.avatar_url) {
        const path = pet.avatar_url.split('/pet-avatars/')[1];
        if (path) await supabase.storage.from('pet-avatars').remove([path]);
      }

      const { error } = await supabase.from('pets').delete().eq('id', pet.id);
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

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !vaccineName || !adminDate) return;
    try {
      await petPassportService.addVaccination({
        pet_id: pet.id,
        vaccine_name: vaccineName,
        administered_date: adminDate,
        next_due_date: nextDueDate || undefined,
      });
      toast.success('Vaccination record added to digital passport');
      setVaccineOpen(false);
      setVaccineName('');
      setAdminDate('');
      setNextDueDate('');
      fetchPetAndPassport();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record vaccination');
    }
  };

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !weightInput) return;
    try {
      await petPassportService.logWeight({
        pet_id: pet.id,
        weight: parseFloat(weightInput),
        unit: 'kg',
        recorded_by: user?.id,
      });
      toast.success('Weight log updated');
      setWeightOpen(false);
      setWeightInput('');
      fetchPetAndPassport();
    } catch (err: any) {
      toast.error(err.message || 'Failed to log weight');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-4xl py-8">
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
      
      <main className="container max-w-5xl py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/pets')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to My Pets
            </Button>

            <div className="flex gap-2">
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit className="h-4 w-4" /> Edit Profile
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {pet.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete {pet.name}'s profile and medical passport records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Pet'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Profile Header Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  {pet.avatar_url ? (
                    <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="h-16 w-16 text-primary" />
                  )}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{pet.name}</h1>
                    <Badge variant="default">Digital Passport Active</Badge>
                    {pet.is_livestock && pet.livestock_count && pet.livestock_count > 1 && (
                      <Badge variant="secondary">×{pet.livestock_count} Herd</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground capitalize text-lg mb-4">
                    {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/40 p-4 rounded-lg">
                    <div>
                      <span className="text-xs text-muted-foreground block">Age</span>
                      <span className="font-semibold">{petAge || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Weight</span>
                      <span className="font-semibold">{pet.weight ? `${pet.weight} kg` : 'Not recorded'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Gender</span>
                      <span className="font-semibold capitalize">{pet.gender || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Microchip #</span>
                      <span className="font-semibold">{pet.microchip_number || 'Unregistered'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

                <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="timeline" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 max-w-xl">
                <TabsTrigger value="timeline" className="gap-2">
                  <Activity className="h-4 w-4" /> Timeline
                </TabsTrigger>
                <TabsTrigger value="vaccines" className="gap-2">
                  <Syringe className="h-4 w-4" /> Vaccines
                </TabsTrigger>
                <TabsTrigger value="caregivers" className="gap-2">
                  <Users className="h-4 w-4" /> Caregivers
                </TabsTrigger>
                <TabsTrigger value="consultations" className="gap-2">
                  <MessageCircle className="h-4 w-4" /> Consults
                </TabsTrigger>
              </TabsList>

              {/* Timeline Tab */}
              <TabsContent value="timeline">
                <PetPassportTimeline timeline={passportData?.timeline || []} />
              </TabsContent>

              {/* Vaccines & Weight Tab */}
              <TabsContent value="vaccines">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vaccination Records */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Syringe className="h-5 w-5 text-emerald-500" /> Vaccination Log
                        </CardTitle>
                        <CardDescription>Active and historical vaccine records</CardDescription>
                      </div>

                      <Dialog open={vaccineOpen} onOpenChange={setVaccineOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" /> Add Vaccine
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Record Vaccination</DialogTitle>
                            <DialogDescription>Add a completed vaccine record to pet passport.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddVaccination} className="space-y-4 py-2">
                            <div className="space-y-2">
                              <Label htmlFor="vName">Vaccine Name *</Label>
                              <Input
                                id="vName"
                                required
                                placeholder="e.g. Rabies / DHPP"
                                value={vaccineName}
                                onChange={(e) => setVaccineName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="aDate">Date Administered *</Label>
                              <Input
                                id="aDate"
                                type="date"
                                required
                                value={adminDate}
                                onChange={(e) => setAdminDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="nDate">Next Booster Due Date</Label>
                              <Input
                                id="nDate"
                                type="date"
                                value={nextDueDate}
                                onChange={(e) => setNextDueDate(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button type="button" variant="outline" onClick={() => setVaccineOpen(false)}>Cancel</Button>
                              <Button type="submit">Save Vaccine Record</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {passportData?.vaccinations?.length > 0 ? (
                        <div className="space-y-3">
                          {passportData.vaccinations.map((vac: any) => (
                            <div key={vac.id} className="p-3 border rounded-lg flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-sm">{vac.vaccine_name}</p>
                                <p className="text-xs text-muted-foreground">Administered: {format(new Date(vac.administered_date), 'MMM d, yyyy')}</p>
                              </div>
                              {vac.next_due_date && (
                                <Badge variant="outline">Due: {format(new Date(vac.next_due_date), 'MMM yyyy')}</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">No vaccinations logged yet.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Weight Log */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Weight className="h-5 w-5 text-cyan-500" /> Weight Tracking
                        </CardTitle>
                        <CardDescription>Log and monitor pet body weight</CardDescription>
                      </div>

                      <Dialog open={weightOpen} onOpenChange={setWeightOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" /> Log Weight
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Log Weight Measurement</DialogTitle>
                            <DialogDescription>Record new weight in kilograms (kg).</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleLogWeight} className="space-y-4 py-2">
                            <div className="space-y-2">
                              <Label htmlFor="weightIn">Weight (kg) *</Label>
                              <Input
                                id="weightIn"
                                type="number"
                                step="0.1"
                                required
                                placeholder="e.g. 14.5"
                                value={weightInput}
                                onChange={(e) => setWeightInput(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button type="button" variant="outline" onClick={() => setWeightOpen(false)}>Cancel</Button>
                              <Button type="submit">Log Weight</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {passportData?.weightRecords?.length > 0 ? (
                        <div className="space-y-3">
                          {passportData.weightRecords.map((w: any) => (
                            <div key={w.id} className="p-3 border rounded-lg flex justify-between items-center">
                              <div>
                                <p className="font-bold text-base">{w.weight} {w.unit || 'kg'}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(w.recorded_at), 'MMM d, yyyy • h:mm a')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">No weight entries logged yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Caregivers Tab */}
              <TabsContent value="caregivers">
                <PetCaregiversManager
                  petId={pet.id}
                  ownerId={pet.owner_id}
                  currentUserId={user?.id || ''}
                  caregivers={passportData?.caregivers || []}
                  onRefresh={fetchPetAndPassport}
                />
              </TabsContent>

              {/* Consultations Tab */}
              <TabsContent value="consultations">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" /> Recent Consultations
                      </CardTitle>
                      <CardDescription>Tele-veterinary cases and clinic visits</CardDescription>
                    </div>
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
                              <Badge variant="outline">{consultation.status.replace('_', ' ')}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(consultation.created_at), 'PPP')}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-6 text-sm">
                        No consultations recorded yet for {pet.name}.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default PetDetail;
