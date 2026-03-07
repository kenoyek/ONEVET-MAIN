import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PawPrint, MessageCircle, Calendar, ChevronRight, Plus,
  Clock, CheckCircle, AlertCircle, Bell
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  avatar_url: string | null;
}

interface Consultation {
  id: string;
  status: string;
  chief_complaint: string;
  created_at: string;
  veterinarian_id: string | null;
}

interface Subscription {
  id: string;
  status: string;
  expires_at: string | null;
  plan: {
    name: string;
  } | null;
}

const Dashboard = () => {
  const { profile, user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);

  const fetchData = async () => {
    try {
      // Fetch pets
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('id, name, species, breed, avatar_url')
        .eq('owner_id', profile!.id)
        .limit(4);

      if (petsError) throw petsError;
      setPets(petsData || []);

      // Fetch recent consultations
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('consultations')
        .select('id, status, chief_complaint, created_at, veterinarian_id')
        .eq('pet_owner_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (consultationsError) throw consultationsError;
      setConsultations(consultationsData || []);

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('id, status, expires_at, plan:subscription_plans(name)')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (subError) throw subError;
      setSubscription(subData as unknown as Subscription);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-info"><MessageCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trial';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold">
                Welcome back, {profile?.first_name || 'there'}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your pets today.
              </p>
            </div>
            <Link to="/consultations/new">
              <Button size="lg" className="gap-2" disabled={!hasActiveSubscription}>
                <MessageCircle className="h-5 w-5" />
                Talk to a Vet
              </Button>
            </Link>
          </div>

          {/* Subscription Status Banner */}
          {!hasActiveSubscription && (
            <Card className="mb-8 border-warning/50 bg-warning/5">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium">Upgrade to connect with vets</p>
                    <p className="text-sm text-muted-foreground">
                      Subscribe to get 24/7 access to licensed veterinarians
                    </p>
                  </div>
                </div>
                <Link to="/subscription">
                  <Button variant="default">View Plans</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Stats */}
            <Card className="card-feature">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-primary" />
                  My Pets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : pets.length > 0 ? (
                  <div className="space-y-3">
                    {pets.slice(0, 3).map((pet) => (
                      <Link
                        key={pet.id}
                        to={`/pets/${pet.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <PawPrint className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                    <Link to="/pets">
                      <Button variant="outline" className="w-full mt-2">
                        View All Pets
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <PawPrint className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No pets added yet</p>
                    <Link to="/pets/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Pet
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Consultations */}
            <Card className="card-feature">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Recent Consultations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : consultations.length > 0 ? (
                  <div className="space-y-3">
                    {consultations.slice(0, 3).map((consultation) => (
                      <Link
                        key={consultation.id}
                        to={`/consultations/${consultation.id}`}
                        className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm line-clamp-2">{consultation.chief_complaint}</p>
                          {getStatusBadge(consultation.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(consultation.created_at).toLocaleDateString()}
                        </p>
                      </Link>
                    ))}
                    <Link to="/consultations">
                      <Button variant="outline" className="w-full mt-2">
                        View All Consultations
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No consultations yet</p>
                    {hasActiveSubscription && (
                      <Link to="/consultations/new">
                        <Button>Start a Consultation</Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card className="card-feature">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{subscription.plan?.name || 'Basic'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={hasActiveSubscription ? 'default' : 'secondary'}>
                        {subscription.status}
                      </Badge>
                    </div>
                    {subscription.expires_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Expires</span>
                        <span className="text-sm">
                          {new Date(subscription.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <Link to="/subscription">
                      <Button variant="outline" className="w-full">
                        Manage Subscription
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No active subscription</p>
                    <Link to="/subscription">
                      <Button>Subscribe Now</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications/Tips Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Tips & Resources
              </CardTitle>
              <CardDescription>
                Helpful information for pet owners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link
                  to="/education"
                  className="p-4 rounded-lg border hover:bg-muted transition-colors group"
                >
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    Pet Health Articles
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse our library of pet care guides and health tips
                  </p>
                </Link>
                <div className="p-4 rounded-lg border bg-primary/5">
                  <h3 className="font-medium">24/7 Vet Support</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our veterinarians are available around the clock for your pet emergencies
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <h3 className="font-medium">Keep Records Updated</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Regular updates help vets provide better care for your pets
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
