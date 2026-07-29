import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { marketplaceService, SearchProvidersFilter } from '@/lib/services/marketplace-service';
import { Search, MapPin, ShieldCheck, Stethoscope, Scissors, TestTube, GraduationCap, Video, Home, Building2, Clock, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'all', label: 'All Services' },
  { value: 'veterinary', label: 'Veterinary Care' },
  { value: 'grooming', label: 'Grooming & Spa' },
  { value: 'diagnostics', label: 'Diagnostics & Labs' },
  { value: 'training', label: 'Training & Behaviour' },
];

export default function ProviderMarketplace() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState('all');
  const [cityQuery, setCityQuery] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  const fetchMarketplace = async () => {
    setLoading(true);
    try {
      const filter: SearchProvidersFilter = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        delivery_mode: selectedDeliveryMode !== 'all' ? (selectedDeliveryMode as any) : undefined,
        is_emergency_service: emergencyOnly ? true : undefined,
        query: searchQuery.trim() || undefined,
        city: cityQuery.trim() || undefined,
      };

      const data = await marketplaceService.searchMarketplace(filter);
      setServices(data || []);
    } catch (err: any) {
      console.error('Failed to search marketplace:', err);
      toast.error('Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, [selectedCategory, selectedDeliveryMode, emergencyOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMarketplace();
  };

  const getDeliveryIcon = (mode: string) => {
    switch (mode) {
      case 'video': return <Video className="h-4 w-4 text-blue-500" />;
      case 'home_visit': return <Home className="h-4 w-4 text-emerald-500" />;
      default: return <Building2 className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Banner */}
      <div className="bg-primary/5 border-b py-12 px-4">
        <div className="container max-w-6xl mx-auto text-center space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-sm bg-background">
            Multi-Provider Pet Healthcare Marketplace
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">Find & Book Verified Pet Care Providers</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with verified veterinary clinics, independent doctors, groomers, diagnostic labs, and trainers.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services, clinics, or doctor specialties..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative sm:w-48">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="City (e.g. Ikeja)"
                className="pl-9 bg-background"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg">Search</Button>
          </form>
        </div>
      </div>

      {/* Main Marketplace Area */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-xl bg-card mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Service Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select value={selectedDeliveryMode} onValueChange={setSelectedDeliveryMode}>
                <SelectTrigger>
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
              <Switch id="emergency" checked={emergencyOnly} onCheckedChange={setEmergencyOnly} />
              <Label htmlFor="emergency" className="text-sm font-medium flex items-center gap-1 cursor-pointer">
                <Zap className="h-4 w-4 text-amber-500" /> 24/7 Emergency Care
              </Label>
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-medium">
            Showing {services.length} bookable services
          </p>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : services.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent className="space-y-3">
              <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">No Provider Services Found</h3>
              <p className="text-muted-foreground">Try relaxing your search query or location filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="capitalize flex items-center gap-1">
                      {getDeliveryIcon(item.delivery_mode)}
                      {item.delivery_mode.replace('_', ' ')}
                    </Badge>

                    {item.is_emergency_service && (
                      <Badge variant="destructive" className="gap-1">
                        <Zap className="h-3 w-3" /> Emergency
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-xl">{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Provider Org Details */}
                  <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/provider/public/${item.organization?.slug}`}
                          className="font-semibold text-sm hover:underline"
                        >
                          {item.organization?.name}
                        </Link>
                        {item.organization?.verification_status === 'approved' && (
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.location?.city || item.organization?.city}, {item.organization?.country}
                      </p>
                    </div>

                    <Badge variant="secondary" className="capitalize text-xs">
                      {item.organization?.provider_type?.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{item.duration_minutes} mins</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Base Fee</span>
                      <span className="font-bold text-lg text-primary">
                        {item.currency} {Number(item.base_price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Link to={`/booking/new?service_id=${item.id}`} className="w-full">
                    <Button className="w-full">Book Appointment</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
