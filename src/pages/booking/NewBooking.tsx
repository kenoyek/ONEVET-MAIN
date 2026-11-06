import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { plannedSupabase as supabase } from '@/integrations/supabase/planned-client';
import type { ServiceDeliveryMode } from '@/types/platform';
import { bookingService } from '@/lib/services/booking-service';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface ServiceRecord {
  id: string;
  provider_id: string;
  location_id?: string | null;
  name: string;
  description?: string | null;
  category: string;
  delivery_mode: ServiceDeliveryMode;
  base_price: number | string;
  currency: string;
  duration_minutes: number;
  organization?: {
    name?: string | null;
    address?: string | null;
    city?: string | null;
  } | null;
  location?: {
    address?: string | null;
  } | null;
}

interface PetRecordItem {
  id: string;
  name: string;
  species: string;
  avatar_url?: string | null;
}

export default function NewBooking() {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service_id');
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [service, setService] = useState<ServiceRecord | null>(null);
  const [pets, setPets] = useState<PetRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Booking Form State
  const [selectedPetId, setSelectedPetId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [clientNotes, setClientNotes] = useState('');

  useEffect(() => {
    if (!serviceId || !profile) return;
    const fetchInitialData = async () => {
      try {
        const [
          { data: serviceData, error: sErr },
          { data: petsData, error: pErr },
        ] = await Promise.all([
          supabase
            .from('provider_services')
            .select('*, organization:provider_organizations(*), location:provider_locations(*)')
            .eq('id', serviceId)
            .single(),
          supabase.from('pets').select('id, name, species, avatar_url').eq('owner_id', profile.id),
        ]);

        if (sErr) throw sErr;
        if (pErr) throw pErr;
        setService(serviceData as unknown as ServiceRecord);
        setPets((petsData || []) as PetRecordItem[]);
        if (petsData && petsData.length > 0) {
          setSelectedPetId(petsData[0]?.id || '');
        }
      } catch (err: unknown) {
        console.error('Failed to load booking service details:', err);
        toast.error('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [serviceId, profile]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !service) {
      toast.error('Please sign in to complete booking');
      return;
    }

    if (!bookingDate || !bookingTime) {
      toast.error('Please select an appointment date and time');
      return;
    }

    const startAtIso = `${bookingDate}T${bookingTime}:00Z`;
    const durationMs = (service.duration_minutes || 30) * 60 * 1000;
    const endAtIso = new Date(new Date(startAtIso).getTime() + durationMs).toISOString();

    setSubmitting(true);
    try {
      await bookingService.createBooking({
        client_id: profile.id,
        user_id: user.id,
        pet_id: selectedPetId || undefined,
        provider_id: service.provider_id,
        provider_service_id: service.id,
        location_id: service.location_id || undefined,
        start_at: startAtIso,
        end_at: endAtIso,
        delivery_mode: service.delivery_mode,
        client_notes: clientNotes,
      });

      toast.success('Appointment booked successfully!');
      navigate(`/consultations`);
    } catch (err: unknown) {
      console.error('Booking creation error:', err);
      toast.error((err as Error).message || 'Failed to complete booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Service Not Found</h2>
          <p className="text-muted-foreground">The requested service is no longer available for booking.</p>
        </div>
      </div>
    );
  }

  const pricing = bookingService.calculatePricing(Number(service.base_price));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Booking Wizard */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="capitalize">{service.category}</Badge>
                  <Badge variant="secondary" className="capitalize">{service.delivery_mode.replace('_', ' ')}</Badge>
                </div>
                <CardTitle className="text-2xl">{service.name}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {/* Select Pet */}
                  <div className="space-y-2">
                    <Label htmlFor="petSelect">Select Pet for Appointment *</Label>
                    {pets.length === 0 ? (
                      <div className="p-4 border rounded-lg text-center space-y-2">
                        <p className="text-sm text-muted-foreground">You have not added any pets to your profile yet.</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate('/pets/new')}>
                          + Add New Pet
                        </Button>
                      </div>
                    ) : (
                      <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose pet" />
                        </SelectTrigger>
                        <SelectContent>
                          {pets.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.species})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Date & Time Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bDate">Appointment Date *</Label>
                      <Input
                        id="bDate"
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bTime">Preferred Time Slot *</Label>
                      <Select value={bookingTime} onValueChange={setBookingTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">09:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="13:00">01:00 PM</SelectItem>
                          <SelectItem value="14:00">02:00 PM</SelectItem>
                          <SelectItem value="15:00">03:00 PM</SelectItem>
                          <SelectItem value="16:00">04:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Client Notes / Chief Complaint */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Symptoms for Provider</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      placeholder="Describe symptoms, grooming preferences, or specific notes for the care provider..."
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? 'Confirming Booking...' : 'Confirm & Book Appointment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Pricing & Provider Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Provider Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Organization</span>
                  <span className="font-semibold text-base">{service.organization?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Location / City</span>
                  <span>{service.location?.address || service.organization?.address || service.organization?.city}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Duration</span>
                  <span>{service.duration_minutes} minutes</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Price Summary</CardTitle>
                <CardDescription>Server-calculated pricing summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Service Fee</span>
                  <span>{service.currency} {pricing.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Service Fee (5%)</span>
                  <span>{service.currency} {pricing.platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Tax (7.5%)</span>
                  <span>{service.currency} {pricing.taxAmount.toLocaleString()}</span>
                </div>

                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base text-primary">
                  <span>Total Amount</span>
                  <span>{service.currency} {pricing.totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
