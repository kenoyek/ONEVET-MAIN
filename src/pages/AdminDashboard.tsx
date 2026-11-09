import { PageHeading } from '@/components/layout/PageHeading';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Stethoscope, MessageCircle, FileText, CreditCard,
  Shield, TrendingUp, Search, ChevronRight, AlertCircle,
  CheckCircle, Clock, XCircle, RefreshCcw, Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  totalVets: number;
  pendingVets: number;
  activeSubscriptions: number;
  totalConsultations: number;
  consultationsToday: number;
}

interface PendingVet {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  license_number: string | null;
  license_url: string | null;
  created_at: string;
  vendor_type: string | null;
}

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVets: 0,
    pendingVets: 0,
    activeSubscriptions: 0,
    totalConsultations: 0,
    consultationsToday: 0,
  });
  const [pendingVets, setPendingVets] = useState<PendingVet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch user counts
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (usersError) throw new Error(`Profiles: ${usersError.message}`);

      // Fetch vet counts
      const { count: vetsCount, error: vetsError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'veterinarian');
      if (vetsError) throw new Error(`User Roles: ${vetsError.message}`);

      // Fetch pending vendors
      const { data: pendingVetsData, error: pendingError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, license_number, license_url, created_at, vendor_type')
        .eq('verification_status', 'pending');
      if (pendingError) throw new Error(`Pending Vendors: ${pendingError.message}`);

      // Fetch active subscriptions
      const { count: activeSubsCount, error: subsError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trial']);
      if (subsError) throw new Error(`Subscriptions: ${subsError.message}`);

      // Fetch consultation counts
      const { count: consultationsCount, error: consError } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true });
      if (consError) throw new Error(`Consultations: ${consError.message}`);

      const { count: consultationsTodayCount, error: todayError } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      if (todayError) throw new Error(`Today's Consultations: ${todayError.message}`);

      setStats({
        totalUsers: usersCount || 0,
        totalVets: vetsCount || 0,
        pendingVets: pendingVetsData?.length || 0,
        activeSubscriptions: activeSubsCount || 0,
        totalConsultations: consultationsCount || 0,
        consultationsToday: consultationsTodayCount || 0,
      });

      setPendingVets(pendingVetsData || []);
    } catch (err: unknown) {
      console.error('Error fetching admin dashboard data:', err);
      setError((err as Error).message || 'An unexpected error occurred');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyVet = async (vetId: string, approve: boolean) => {
    try {
      const newStatus = approve ? 'approved' : 'rejected';

      // 1. Update profiles table
      const { data: updatedProfiles, error: profileErr } = await supabase
        .from('profiles')
        .update({
          verification_status: newStatus,
          license_verified: approve
        })
        .eq('id', vetId)
        .select('id, user_id');

      if (profileErr) throw profileErr;

      if (!updatedProfiles || updatedProfiles.length === 0) {
        throw new Error('This action could not be completed. Your access may have changed; refresh and try again.');
      }

      // Verification changes are audited atomically by the trusted database trigger.
      // Organization verification has a separate reviewed workflow.

      toast.success(approve ? 'Vendor approved!' : 'Vendor rejected');
      fetchDashboardData();
    } catch (error: unknown) {
      console.error('Error verifying vendor:', error);
      toast.error((error as Error).message || 'Failed to update verification status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container-wide py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Loading Admin Panel</h2>
          <p className="text-muted-foreground font-medium">Fetching platform statistics...</p>
          <p className="text-xs text-muted-foreground mt-2 italic max-w-xs">
            Loading the latest records for your account.
          </p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container-wide py-20 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Dashboard Error</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <div className="flex gap-4">
            <Button onClick={() => fetchDashboardData()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container-wide py-12 pt-28 md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <PageHeading size="workspace" className="mb-2" title={<> Admin Center </>}/>
              <p className="text-muted-foreground font-medium">
                Comprehensive platform management and oversight.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild><Link to="/admin/verifications">Organization verification</Link></Button>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Global Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 w-64 rounded-full bg-card border-border/50 shadow-soft"
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-10">
            <Card className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight">{stats.totalUsers}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Users</p>
                </div>
              </div>
            </Card>
            <Card className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-info/10 text-info shadow-sm">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight">{stats.totalVets}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vets</p>
                </div>
              </div>
            </Card>
            <Card className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-warning/10 text-warning shadow-sm">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight">{stats.pendingVets}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending</p>
                </div>
              </div>
            </Card>
            <Card className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10 text-success shadow-sm">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight">{stats.activeSubscriptions}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subs</p>
                </div>
              </div>
            </Card>
            <Card className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary shadow-sm">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight">{stats.totalConsultations}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Consults</p>
                </div>
              </div>
            </Card>
            <Card className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent shadow-sm">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight">{stats.consultationsToday}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Today</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="vets" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
              <TabsTrigger value="analytics" className="gap-2" asChild>
                <Link to="/admin/analytics">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="vets" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Vet Verification</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Subscriptions</span>
              </TabsTrigger>
              <TabsTrigger value="conversations" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Monitor</span>
              </TabsTrigger>
            </TabsList>

            {/* Vet Verification Tab */}
            <TabsContent value="vets">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Veterinarian Verifications</CardTitle>
                  <CardDescription>
                    Review and verify veterinarian licenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : pendingVets.length > 0 ? (
                    <div className="space-y-4">
                      {pendingVets.map((vet) => (
                        <div
                          key={vet.id}
                          className="p-4 rounded-lg border bg-card flex items-start justify-between gap-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {vet.first_name} {vet.last_name}
                              </p>
                              <Badge variant="outline" className="capitalize text-[10px]">
                                {vet.vendor_type || 'provider'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{vet.email}</p>
                            <p className="text-sm mt-1">
                              License: {vet.license_number || 'Not provided'}
                            </p>
                            {vet.license_url && (
                              <a
                                href={vet.license_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                View License Document
                              </a>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Applied: {new Date(vet.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => verifyVet(vet.id, true)}
                              className="gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => verifyVet(vet.id, false)}
                              className="gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No pending verifications</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    View and manage all users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">User management interface</p>
                    <Link to="/admin/users">
                      <Button>
                        Manage Users
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>Content Management</CardTitle>
                  <CardDescription>
                    Manage articles and educational content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">Article management interface</p>
                    <Link to="/admin/articles">
                      <Button>
                        Manage Articles
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Management</CardTitle>
                  <CardDescription>
                    Manage subscription plans and user subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">Subscription management interface</p>
                    <Link to="/admin/subscriptions">
                      <Button>
                        Manage Subscriptions
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conversation Monitor Tab */}
            <TabsContent value="conversations">
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Monitor</CardTitle>
                  <CardDescription>
                    Monitor consultations for moderation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">Conversation monitoring interface</p>
                    <Link to="/admin/conversations">
                      <Button>
                        Monitor Conversations
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
