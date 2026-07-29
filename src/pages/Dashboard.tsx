import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PawPrint, MessageCircle, Calendar, ChevronRight, Plus,
  Clock, CheckCircle, AlertCircle, Bell, ShoppingBag
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

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { profile, user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      // Fetch pets
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('id, name, species, breed, avatar_url')
        .eq('owner_id', profile.id)
        .limit(4);

      if (petsError) throw petsError;
      setPets(petsData || []);

      // Fetch recent consultations
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('consultations')
        .select('id, status, chief_complaint, created_at')
        .eq('pet_owner_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (consultationsError) throw consultationsError;
      setConsultations(consultationsData as unknown as Consultation[]);

      // Fetch active subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select(`
          status, expires_at,
          plan:subscription_plans(name, price)
        `)
        .eq('user_id', profile.user_id)
        .eq('status', 'active')
        .maybeSingle();

      if (subData) {
        setSubscription(subData as unknown as Subscription);
      }

      // Fetch recent marketplace orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (ordersData) {
        setOrders(ordersData as unknown as Order[]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, profile?.user_id]);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id, fetchData]);

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
    <div className="min-h-screen bg-background bg-mesh-gradient">
      <Navbar />
      
      <main className="container-wide py-12 pt-28 md:pt-32">
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
            <Card className="glass-card overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <PawPrint className="h-5 w-5" />
                  </div>
                  My Pets
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : pets.length > 0 ? (
                  <div className="space-y-3">
                    {pets.slice(0, 3).map((pet) => (
                      <Link
                        key={pet.id}
                        to={`/pets/${pet.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all group border border-transparent hover:border-primary/10"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-background shadow-sm">
                          {pet.avatar_url ? (
                            <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                          ) : (
                            <PawPrint className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">{pet.name}</p>
                          <p className="text-xs text-muted-foreground capitalize font-medium">
                            {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </Link>
                    ))}
                    <Button variant="ghost" className="w-full mt-2 font-bold text-xs" asChild>
                      <Link to="/pets">View All Pets</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
                      <PawPrint className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">No pets added yet</p>
                    <Link to="/pets/new">
                      <Button size="sm" className="rounded-full font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Pet
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Consultations */}
            <Card className="glass-card overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  Consultations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                ) : consultations.length > 0 ? (
                  <div className="space-y-3">
                    {consultations.slice(0, 3).map((consultation) => (
                      <Link
                        key={consultation.id}
                        to={`/consultations/${consultation.id}`}
                        className="block p-4 rounded-xl border border-border/50 hover:border-secondary/20 hover:bg-secondary/5 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-bold line-clamp-1 group-hover:text-secondary transition-colors">{consultation.chief_complaint}</p>
                          {getStatusBadge(consultation.status)}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {new Date(consultation.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </Link>
                    ))}
                    <Button variant="ghost" className="w-full mt-2 font-bold text-xs" asChild>
                      <Link to="/consultations">View History</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
                      <MessageCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">No consultations yet</p>
                    {hasActiveSubscription && (
                      <Link to="/consultations/new">
                        <Button size="sm" className="rounded-full font-bold">Start Chat</Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card className="glass-card overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <Calendar className="h-5 w-5" />
                  </div>
                  Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <Skeleton className="h-32 w-full rounded-xl" />
                ) : subscription ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Plan</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-foreground">{subscription.plan?.name || 'Basic'}</span>
                        <Badge variant={hasActiveSubscription ? 'default' : 'secondary'} className="rounded-full px-3">
                          {subscription.status}
                        </Badge>
                      </div>
                    </div>

                    {subscription.expires_at && (
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-semibold">Valid until</span>
                          <span className="font-bold">
                            {new Date(subscription.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                    <Button variant="outline" className="w-full rounded-full font-bold border-2 border-accent/20 hover:bg-accent hover:text-white hover:border-accent transition-all" asChild>
                      <Link to="/subscription">Manage Subscription</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">No active membership</p>
                    <Link to="/subscription">
                      <Button size="sm" className="rounded-full font-bold">Explore Plans</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="glass-card overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-info/10 text-info">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card hover:border-info/30 transition-all shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-sm tracking-tight">₦{order.total_amount.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize text-[10px] font-bold">
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full mt-2 font-bold text-xs" asChild>
                      <Link to="/marketplace">Shop More</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">No orders yet</p>
                    <Link to="/marketplace">
                      <Button size="sm" className="rounded-full font-bold">Go to Shop</Button>
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
