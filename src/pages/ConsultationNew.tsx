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
      <div className="min-h-screen">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="pt-24 pb-16">
          <div className="container-tight py-8">
            <Card className="card-elevated max-w-md mx-auto overflow-hidden">
              <div className="h-2 bg-primary" />
              <CardHeader className="text-center pt-8">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Subscription Required</CardTitle>
                <CardDescription className="text-base mt-2">
                  You need an active subscription to start a consultation with our expert veterinarians.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8 px-8">
                <Button onClick={() => navigate('/pricing')} className="w-full h-12 text-lg shadow-lg shadow-primary/20">
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
    <div className="min-h-screen">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="pt-24 pb-16">
        <div className="container-wide py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-elevated overflow-hidden">
              <div className="h-1.5 bg-primary" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-primary/10 shadow-inner">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Start a Consultation</CardTitle>
                    <CardDescription className="text-base">
                      Describe your pet's symptoms and connect with a licensed vet
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Online Vets Indicator */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-sm font-semibold text-primary">
                      Live Support Available
                    </span>
                  </div>
                  <span className="text-xs font-medium bg-white/50 px-2 py-1 rounded-full border border-primary/10">
                    {onlineVetsCount} {onlineVetsCount === 1 ? 'vet' : 'vets'} online
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
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <PawPrint className="h-4 w-4 text-primary" />
                            Select Pet (Optional)
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-white/50 border-primary/20 hover:border-primary/40 focus:ring-primary/20 transition-all">
                                <SelectValue placeholder={loadingPets ? 'Loading pets...' : 'Choose a pet'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="card-elevated">
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
                          <FormLabel className="text-sm font-semibold">What's the issue?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your pet's symptoms, behavior changes, or any concerns you have..."
                              className="min-h-[160px] bg-white/50 border-primary/20 hover:border-primary/40 focus:ring-primary/20 transition-all resize-none p-4"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-semibold bg-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 disabled:opacity-70"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="mr-2 h-5 w-5" />
                          Connect with a Vet
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="pt-4 border-t border-primary/10">
                  <p className="text-[11px] text-muted-foreground text-center uppercase tracking-wider font-medium">
                    Secure & Confidential • Licensed Veterinarians • 24/7 Support
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

