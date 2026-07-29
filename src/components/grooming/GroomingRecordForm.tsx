import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { groomingService } from '@/lib/services/grooming-service';
import { toast } from 'sonner';
import { Scissors, AlertTriangle, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GroomingRecordFormProps {
  bookingId?: string;
  petId: string;
  petName: string;
  groomerProfileId: string;
  currentUserId: string;
  onSuccess?: () => void;
}

const GROOMING_SERVICES = [
  { id: 'bath', label: 'Hydro-Bath & Blow Dry' },
  { id: 'haircut', label: 'Full Haircut & Styling' },
  { id: 'nail_trim', label: 'Nail Clipping & Filing' },
  { id: 'ear_cleaning', label: 'Ear Cleaning & Plucking' },
  { id: 'de_shedding', label: 'De-shedding Treatment' },
  { id: 'flea_treatment', label: 'Flea & Tick Dip' },
];

export const GroomingRecordForm: React.FC<GroomingRecordFormProps> = ({
  bookingId,
  petId,
  petName,
  groomerProfileId,
  currentUserId,
  onSuccess,
}) => {
  const [coatCondition, setCoatCondition] = useState('normal');
  const [selectedServices, setSelectedServices] = useState<string[]>(['bath']);
  const [productsUsed, setProductsUsed] = useState('');
  const [behaviourNotes, setBehaviourNotes] = useState('calm');
  const [skinObservations, setSkinObservations] = useState('');
  const [hasHealthIssue, setHasHealthIssue] = useState(false);
  const [nextDate, setNextDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedRecord, setCompletedRecord] = useState<Record<string, unknown> | null>(null);

  const toggleService = (svcId: string) => {
    setSelectedServices((prev) =>
      prev.includes(svcId) ? prev.filter((s) => s !== svcId) : [...prev, svcId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      toast.error('Please select at least one completed service');
      return;
    }

    setSubmitting(true);
    try {
      const record = await groomingService.createGroomingRecord({
        booking_id: bookingId,
        pet_id: petId,
        groomer_id: groomerProfileId,
        user_id: currentUserId,
        coat_condition: coatCondition,
        skin_observations: skinObservations,
        services_completed: selectedServices,
        products_used: productsUsed,
        behaviour_notes: behaviourNotes,
        next_recommended_date: nextDate || undefined,
        has_health_escalation: hasHealthIssue,
      });

      toast.success('Grooming record saved to pet health passport');
      setCompletedRecord(record as unknown as Record<string, unknown>);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to save grooming record');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedRecord && hasHealthIssue) {
    return (
      <Card className="border-amber-500/30 bg-amber-50/20">
        <CardHeader>
          <CardTitle className="text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Non-Diagnostic Health Observation Recorded
          </CardTitle>
          <CardDescription>
            Grooming record saved. The owner has been notified of your non-diagnostic health observation for {petName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-background border rounded-lg text-sm space-y-1">
            <p className="font-semibold text-foreground">Groomer Observation:</p>
            <p className="text-muted-foreground">{skinObservations}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to={`/consultations/new?pet_id=${petId}`} className="flex-1">
              <Button className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                <Stethoscope className="h-4 w-4" /> Recommend Vet Consultation
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setCompletedRecord(null)}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" /> Grooming Service Record for {petName}
        </CardTitle>
        <CardDescription>
          Record completed services, coat condition, products used, and health observations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Services Completed Checkboxes */}
          <div className="space-y-2">
            <Label className="font-semibold">Completed Services *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg">
              {GROOMING_SERVICES.map((s) => (
                <div key={s.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={s.id}
                    checked={selectedServices.includes(s.id)}
                    onCheckedChange={() => toggleService(s.id)}
                  />
                  <label htmlFor={s.id} className="text-sm font-medium leading-none cursor-pointer">
                    {s.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Coat Condition & Behaviour */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coat">Coat Condition</Label>
              <Select value={coatCondition} onValueChange={setCoatCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coat condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Healthy / Normal</SelectItem>
                  <SelectItem value="matted">Matted / Severe Tangles</SelectItem>
                  <SelectItem value="dry">Dry / Flaky Skin</SelectItem>
                  <SelectItem value="oily">Oily / Excessive Sebum</SelectItem>
                  <SelectItem value="shedding">Heavy Seasonal Shedding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beh">Pet Behaviour During Session</Label>
              <Select value={behaviourNotes} onValueChange={setBehaviourNotes}>
                <SelectTrigger>
                  <SelectValue placeholder="Select behaviour" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calm">Calm & Cooperative</SelectItem>
                  <SelectItem value="nervous">Anxious / Nervous</SelectItem>
                  <SelectItem value="energetic">Energetic / Playful</SelectItem>
                  <SelectItem value="muzzle_required">Muzzle Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Used */}
          <div className="space-y-2">
            <Label htmlFor="prod">Products & Shampoos Used</Label>
            <Input
              id="prod"
              placeholder="e.g. Hypoallergenic Oatmeal Shampoo, Lavender Conditioning Spray"
              value={productsUsed}
              onChange={(e) => setProductsUsed(e.target.value)}
            />
          </div>

          {/* Health Observation Escalation */}
          <div className="border p-4 rounded-xl space-y-3 bg-amber-50/10 border-amber-200">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="healthEsc"
                checked={hasHealthIssue}
                onCheckedChange={(checked) => setHasHealthIssue(!!checked)}
              />
              <label htmlFor="healthEsc" className="text-sm font-semibold text-amber-800 cursor-pointer flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Record Non-Diagnostic Health Observation
              </label>
            </div>

            {hasHealthIssue && (
              <div className="space-y-2 pt-1">
                <Textarea
                  rows={3}
                  placeholder="Record observations (e.g. skin irritation noticed on flank, ear discharge, small lump on paw, fleas observed)..."
                  value={skinObservations}
                  onChange={(e) => setSkinObservations(e.target.value)}
                />
                <p className="text-xs text-muted-foreground italic">
                  Note: Groomer observations are non-diagnostic and trigger a prompt for the owner to schedule a vet visit.
                </p>
              </div>
            )}
          </div>

          {/* Next Recommended Date */}
          <div className="space-y-2">
            <Label htmlFor="nDate">Next Recommended Grooming Date</Label>
            <Input
              id="nDate"
              type="date"
              className="w-48"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Saving Service Record...' : 'Complete Grooming Session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
