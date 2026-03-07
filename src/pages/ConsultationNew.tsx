import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageCircle, Loader2, PawPrint, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { useSubscription } from '@/hooks/useSubscription';
import { useVetPresence } from '@/hooks/useVetPresence';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const consultationSchema = z.object({
  pet_id: z.string().optional(),
  chief_complaint: z.string().min(10, 'Please describe your concern in at least 10 characters'),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
}

export default function ConsultationNew() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isActive, loading: subscriptionLoading } = useSubscription();
  const { onlineVetsCount } = useVetPresence();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      pet_id: '',
      chief_complaint: '',
    },
  });

  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('pets')
          .select('id, name, species, breed')
          .eq('owner_id', profile.id)
          .order('name');

        if (error) throw error;
        setPets(data || []);
      } catch (err) {
        console.error('Error fetching pets:', err);
      } finally {
        setLoadingPets(false);
      }
    };

    fetchPets();
  }, [profile?.id]);

  const onSubmit = async (data: ConsultationFormData) => {
    if (!profile?.id) return;

    setSubmitting(true);
    try {
      const { data: consultation, error } = await supabase
        .from('consultations')
        .insert({
          pet_owner_id: profile.id,
          pet_id: data.pet_id || null,
          chief_complaint: data.chief_complaint,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Consultation request submitted!', {
        description: 'A veterinarian will be with you shortly.',
      });

      navigate(`/consultations/${consultation.id}`);
    } catch (err) {
      console.error('Error creating consultation:', err);
      toast.error('Failed to create consultation', {
        description: 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect if no subscription
  if (!subscriptionLoading && !isActive) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container-wide py-8">
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <CardTitle>Subscription Required</CardTitle>
                <CardDescription>
                  You need an active subscription to start a consultation with a veterinarian.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => navigate('/pricing')} className="w-full">
                  View Subscription Plans
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container-wide py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Start a Consultation</CardTitle>
                    <CardDescription>
                      Describe your pet's symptoms and connect with a licensed vet
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Online Vets Indicator */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success mb-6">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium">
                    {onlineVetsCount} {onlineVetsCount === 1 ? 'vet' : 'vets'} available now
                  </span>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Pet Selection */}
                    <FormField
                      control={form.control}
                      name="pet_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <PawPrint className="h-4 w-4" />
                            Select Pet (Optional)
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={loadingPets ? 'Loading pets...' : 'Choose a pet'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {pets.map((pet) => (
                                <SelectItem key={pet.id} value={pet.id}>
                                  {pet.name} ({pet.species})
                                </SelectItem>
                              ))}
                              {pets.length === 0 && !loadingPets && (
                                <SelectItem value="none" disabled>
                                  No pets added yet
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Chief Complaint */}
                    <FormField
                      control={form.control}
                      name="chief_complaint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What's the issue?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your pet's symptoms, behavior changes, or any concerns you have..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Start Consultation
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  By starting a consultation, you agree to our terms of service.
                  A veterinarian will respond as soon as possible.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
