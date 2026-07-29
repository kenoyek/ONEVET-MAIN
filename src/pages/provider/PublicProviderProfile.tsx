import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { marketplaceService } from '@/lib/services/marketplace-service';
import { ShieldCheck, MapPin, Phone, Mail, Globe, Clock, Stethoscope, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProviderProfileData {
  id: string;
  name: string;
  provider_type: string;
  verification_status?: string | null;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  services?: {
    id: string;
    name: string;
    description?: string | null;
    delivery_mode: string;
    base_price: number | string;
    currency: string;
    duration_minutes: number;
  }[];
  locations?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state?: string | null;
    country: string;
    phone?: string | null;
  }[];
}

export default function PublicProviderProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [provider, setProvider] = useState<ProviderProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchProfile = async () => {
      try {
        const data = await marketplaceService.getPublicProviderProfile(slug);
        setProvider((data || null) as unknown as ProviderProfileData | null);
      } catch (err: unknown) {
        console.error('Failed to load provider profile:', err);
        toast.error('Provider profile not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [slug]);

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

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Provider Profile Not Found</h2>
          <p className="text-muted-foreground">The requested provider profile does not exist or is inactive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header Profile Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold tracking-tight">{provider.name}</h1>
                  {provider.verification_status === 'approved' && (
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <ShieldCheck className="h-4 w-4" /> Verified Provider
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground text-lg mb-4 capitalize">
                  {provider.provider_type.replace(/_/g, ' ')} • {provider.city}, {provider.country}
                </p>

                {provider.description && (
                  <p className="text-sm max-w-2xl text-foreground leading-relaxed">{provider.description}</p>
                )}
              </div>

              <div className="space-y-2 text-sm bg-background p-4 rounded-lg border w-full md:w-auto">
                {provider.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.email}</span>
                  </div>
                )}
                {provider.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.phone}</span>
                  </div>
                )}
                {provider.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={provider.website} target="_blank" rel="noreferrer" className="text-primary underline">
                      {provider.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services & Locations Tabs */}
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="services" className="gap-2">
              <Stethoscope className="h-4 w-4" /> Bookable Services
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="h-4 w-4" /> Locations & Branches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {provider.services && provider.services.length > 0 ? (
                provider.services.map((service) => (
                  <Card key={service.id} className="flex flex-col justify-between">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">
                          {service.delivery_mode.replace('_', ' ')}
                        </Badge>
                        <span className="font-bold text-lg text-primary">
                          {service.currency} {Number(service.base_price).toLocaleString()}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Duration: {service.duration_minutes} mins</span>
                      </div>
                      <Link to={`/booking/new?service_id=${service.id}`}>
                        <Button size="sm">Book Now</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground col-span-2 text-center py-8">
                  No public services published yet for this provider.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="locations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {provider.locations && provider.locations.length > 0 ? (
                provider.locations.map((loc) => (
                  <Card key={loc.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{loc.name}</CardTitle>
                      <CardDescription>{loc.address}, {loc.city}, {loc.state}, {loc.country}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      Phone: {loc.phone || provider.phone || 'N/A'}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground col-span-2 text-center py-8">
                  No branch locations registered.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
