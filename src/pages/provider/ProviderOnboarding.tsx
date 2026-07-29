import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { providerService, CreateProviderOrgInput } from '@/lib/services/provider-service';
import { ProviderType } from '@/types/platform';
import { toast } from 'sonner';
import { Building2, Stethoscope, Scissors, TestTube, Pill, Store, GraduationCap, Truck, CheckCircle2 } from 'lucide-react';

const PROVIDER_TYPES: { type: ProviderType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    type: 'veterinary_clinic',
    label: 'Veterinary Clinic',
    description: 'Full-service veterinary hospital, clinic or surgical centre.',
    icon: Building2,
  },
  {
    type: 'independent_veterinarian',
    label: 'Independent Veterinarian',
    description: 'Licensed solo practitioner providing online or mobile care.',
    icon: Stethoscope,
  },
  {
    type: 'grooming_business',
    label: 'Grooming Salon & Spa',
    description: 'Pet grooming salon, bath house, or mobile grooming service.',
    icon: Scissors,
  },
  {
    type: 'diagnostic_laboratory',
    label: 'Diagnostic Laboratory',
    description: 'Veterinary diagnostic testing, pathology and sample analysis.',
    icon: TestTube,
  },
  {
    type: 'pharmacy',
    label: 'Veterinary Pharmacy',
    description: 'Licensed pharmacy fulfilling pet prescriptions and medicines.',
    icon: Pill,
  },
  {
    type: 'pet_store',
    label: 'Pet Store / Vendor',
    description: 'Retailer selling pet food, supplements, care products and supplies.',
    icon: Store,
  },
  {
    type: 'pet_trainer',
    label: 'Pet Trainer & Behaviourist',
    description: 'Certified dog trainer, obedience school, or behaviourist.',
    icon: GraduationCap,
  },
  {
    type: 'mobile_service_provider',
    label: 'Mobile Service Provider',
    description: 'On-demand home visit vet, mobile salon or ambulatory care.',
    icon: Truck,
  },
];

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateProviderOrgInput>({
    name: '',
    slug: '',
    provider_type: 'veterinary_clinic',
    description: '',
    email: user?.email || '',
    phone: '',
    website: '',
    country: 'Nigeria',
    state: '',
    city: '',
    address: '',
    primary_location_name: '',
    primary_location_address: '',
  });

  const handleTypeSelect = (type: ProviderType) => {
    setFormData((prev) => ({
      ...prev,
      provider_type: type,
    }));
  };

  const handleNameChange = (name: string) => {
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    setFormData((prev) => ({
      ...prev,
      name,
      slug: generatedSlug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to register a provider organization');
      return;
    }

    if (!formData.name || !formData.email || !formData.city) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);

    try {
      const result = await providerService.createOrganization(formData, user.id);
      toast.success('Provider organization registered successfully!');
      navigate(`/provider/organization/${result.organization.slug}`);
    } catch (err: unknown) {
      console.error('Organization registration failed:', err);
      toast.error((err as Error).message || 'Failed to register provider organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Register Provider Organization</h1>
          <p className="text-muted-foreground">
            Join the 1vet multi-provider pet healthcare ecosystem as an approved service provider.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <span>1</span> Select Provider Category
          </div>
          <div className="h-px w-8 bg-border" />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <span>2</span> Organization Profile & Details
          </div>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROVIDER_TYPES.map((item) => {
              const Icon = item.icon;
              const isSelected = formData.provider_type === item.type;
              return (
                <Card
                  key={item.type}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : ''
                  }`}
                  onClick={() => handleTypeSelect(item.type)}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary mb-2">
                      <Icon className="h-6 w-6" />
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-1">{item.label}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}

            <div className="md:col-span-2 flex justify-end mt-4">
              <Button size="lg" onClick={() => setStep(2)}>
                Continue to Organization Details
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Organization & Location Details</CardTitle>
              <CardDescription>
                Provide details for your business entity and primary branch location.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization / Business Name *</Label>
                    <Input
                      id="name"
                      required
                      placeholder="e.g. Apex Pet Hospital & Clinic"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Public Portal Identifier (Slug) *</Label>
                    <Input
                      id="slug"
                      required
                      placeholder="apex-pet-hospital"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">About Your Organization</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="Brief description of your healthcare services, facilities, and care philosophy..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Official Business Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="contact@apexvet.com"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+234 800 000 0000"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      placeholder="https://apexvet.com"
                      value={formData.website}
                      onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold text-lg">Primary Branch Location</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State / Region</Label>
                      <Input
                        id="state"
                        placeholder="Lagos"
                        value={formData.state}
                        onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City / Town *</Label>
                      <Input
                        id="city"
                        required
                        placeholder="Ikeja"
                        value={formData.city}
                        onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Physical Street Address</Label>
                    <Input
                      id="address"
                      placeholder="12 Commercial Avenue, Ikeja, Lagos"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                          primary_location_address: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" size="lg" disabled={loading}>
                    {loading ? 'Registering Organization...' : 'Submit Provider Registration'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
