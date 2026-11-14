import {careSearchFilters} from '@/lib/care-search';
import { PageHeading } from '@/components/layout/PageHeading';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/shared/SEO';
import { Navbar } from '@/components/layout/Navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SearchProvidersFilter } from '@/lib/services/marketplace-service';
import { ServiceDeliveryMode } from '@/types/platform';
import { useProviderMarketplace } from '@/hooks/useProviderMarketplace';
import {
  Search,
  MapPin,
  ShieldCheck,
  Video,
  Home,
  Building2,
  Clock,
  Zap,
  Loader2,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Services' },
  { value: 'veterinary', label: 'Veterinary Care' },
  { value: 'grooming', label: 'Grooming & Spa' },
  { value: 'diagnostics', label: 'Diagnostics & Labs' },
  { value: 'training', label: 'Training & Behaviour' },
];

export default function ProviderMarketplace() {
  const location=useLocation();
  return <ProviderMarketplaceContent key={location.pathname+location.search}/>;
}
function ProviderMarketplaceContent() {
  const location=useLocation();
  const initial=careSearchFilters(new URLSearchParams(location.search));
  const veterinaryOnly = location.pathname === '/find-a-vet';
  const [submittedSearch, setSubmittedSearch] = useState({
    query: initial.query,
    city: initial.city,
  });
  // Filter states
  const [searchQuery, setSearchQuery] = useState(initial.query);
  const [selectedCategory, setSelectedCategory] = useState(initial.category);
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState('all');
  const [cityQuery, setCityQuery] = useState(initial.city);
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  const filter: SearchProvidersFilter = {
    category: veterinaryOnly
      ? 'veterinary'
      : selectedCategory !== 'all'
        ? selectedCategory
        : undefined,
    delivery_mode:
      selectedDeliveryMode !== 'all'
        ? (selectedDeliveryMode as ServiceDeliveryMode)
        : undefined,
    is_emergency_service: emergencyOnly ? true : undefined,
    query: submittedSearch.query || undefined,
    city: submittedSearch.city || undefined,
  };

  const {
    marketplaceItems: services,
    isLoading: loading,
    isError,
    refetch,
  } = useProviderMarketplace(filter);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch({ query: searchQuery.trim(), city: cityQuery.trim() });
  };

  const getDeliveryIcon = (mode: string) => {
    switch (mode) {
      case 'video':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'home_visit':
        return <Home className="h-4 w-4 text-emerald-500" />;
      default:
        return <Building2 className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={veterinaryOnly ? 'Find a veterinarian' : 'Find care services'}
        description="Browse veterinary and animal care services. Review provider details and fees, and confirm availability before booking."
      />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="pt-20">
        {/* Hero Banner */}
        <div className="discovery-intro">
          <div className="container-wide space-y-4">
            <Badge
              variant="outline"
              className="px-3 py-1 text-sm bg-background"
            >
              Care for pets & livestock
            </Badge>
            <PageHeading size="display" className="" title={<> {veterinaryOnly
                ? 'Find the right veterinary care.'
                : 'Find care for your animal.'} </>}/>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              Explore provider services and listed fees. Confirm species
              expertise and availability directly with the provider.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="discovery-search flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Search services or providers"
                  placeholder="Service or provider name"
                  className="pl-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative sm:w-48">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="City"
                  placeholder="City (e.g. Lagos)"
                  className="pl-9 bg-background"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg">
                Search
              </Button>
            </form>
          </div>
        </div>

        {/* Main Marketplace Area */}
        <div className="container max-w-6xl mx-auto px-4 py-8">
          {/* Filters Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-xl bg-card mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-48">
                <Select
                  disabled={veterinaryOnly}
                  value={veterinaryOnly ? 'veterinary' : selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger aria-label="Service category">
                    <SelectValue placeholder="Service Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Select
                  value={selectedDeliveryMode}
                  onValueChange={setSelectedDeliveryMode}
                >
                  <SelectTrigger aria-label="Consultation delivery mode">
                    <SelectValue placeholder="Delivery Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Delivery Modes</SelectItem>
                    <SelectItem value="clinic_visit">Clinic Visit</SelectItem>
                    <SelectItem value="video">Telehealth Video</SelectItem>
                    <SelectItem value="home_visit">Home Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="emergency"
                  checked={emergencyOnly}
                  onCheckedChange={setEmergencyOnly}
                />
                <Label
                  htmlFor="emergency"
                  className="text-sm font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="h-4 w-4 text-amber-500" /> Listed urgent-care
                  services
                </Label>
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              {isError
                ? 'Service listings unavailable'
                : loading
                  ? 'Loading service listings…'
                  : `${services.length} listed services`}
            </p>
          </div>

          {/* Services Grid */}
          {isError ? (
            <Card role="alert" className="p-8 text-center">
              <h2 className="text-xl mb-3">We couldn’t load care services.</h2>
              <p className="text-muted-foreground mb-5">
                Check your connection and try again. This does not mean there
                are no providers.
              </p>
              <Button onClick={() => refetch()}>Try again</Button>
            </Card>
          ) : loading ? (
            <div
              role="status"
              aria-label="Loading care services"
              className="flex justify-center py-16"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent className="space-y-3">
                <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-xl font-semibold">
                  No services match your search
                </h3>
                <p className="text-muted-foreground">
                  Try another search or city. Availability must be confirmed
                  with the provider.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((item) => (
                <Card
                  key={item.id}
                  className="flex flex-col justify-between hover:border-primary/50 transition-all"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className="capitalize flex items-center gap-1"
                      >
                        {getDeliveryIcon(item.delivery_mode)}
                        {item.legacy
                          ? 'Confirm care options with provider'
                          : item.delivery_mode.replace('_', ' ')}
                      </Badge>

                      {item.is_emergency_service && (
                        <Badge variant="destructive" className="gap-1">
                          <Zap className="h-3 w-3" /> Emergency
                        </Badge>
                      )}
                    </div>

                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {item.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Provider Org Details */}
                    <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1">
                          {item.legacy ? (
                            <span className="font-semibold text-sm">
                              {String(item.organization?.name ?? 'Provider')}
                            </span>
                          ) : (
                            <Link
                              to={`/provider/public/${item.organization?.slug}`}
                              className="font-semibold text-sm hover:underline"
                            >
                              {String(item.organization?.name ?? 'Provider')}
                            </Link>
                          )}
                          {item.organization?.verification_status ===
                            'approved' && (
                            <ShieldCheck
                              aria-label="Provider verification approved"
                              className="h-4 w-4 text-primary"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.location?.city || item.organization?.city},{' '}
                          {String(item.organization?.country ?? '')}
                        </p>
                      </div>

                      <Badge variant="secondary" className="capitalize text-xs">
                        {String(
                          item.organization?.provider_type ?? 'provider',
                        ).replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {item.legacy
                            ? 'Confirm session details'
                            : `${String(item.duration_minutes ?? '—')} mins`}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          Base Fee
                        </span>
                        <span className="font-bold text-lg text-primary">
                          {item.currency}{' '}
                          {Number(item.base_price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Link
                      to={
                        item.legacy
                          ? item.category === 'vet_clinic'
                            ? '/consultations/new'
                            : '/contact'
                          : `/provider/public/${item.organization?.slug}`
                      }
                      className="w-full"
                    >
                      <Button className="w-full">
                        {item.legacy
                          ? item.category === 'vet_clinic'
                            ? 'Request veterinary care'
                            : 'Ask about this service'
                          : 'View provider'}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div className="container-wide pb-12 text-sm text-muted-foreground">
          <Link to="/urgent-care" className="underline underline-offset-4">
            Need urgent care?
          </Link>{' '}
          Seek an in-person veterinarian if your animal is in distress. Online
          availability is not guaranteed.
        </div>
      </main>
      <Footer />
    </div>
  );
}
