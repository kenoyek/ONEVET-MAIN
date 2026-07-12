import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Stethoscope, MessageCircle, FileText, CreditCard,
  Shield, TrendingUp, Search, ChevronRight, AlertCircle,
  CheckCircle, Clock, XCircle
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch user counts
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch vet counts
      const { count: vetsCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'veterinarian');

      // Fetch pending vendors
      const { data: pendingVetsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, license_number, license_url, created_at, vendor_type')
        .eq('verification_status', 'pending');

      // Fetch active subscriptions
      const { count: activeSubsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trial']);

      // Fetch consultation counts
      const { count: consultationsCount } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true });

      const { count: consultationsTodayCount } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        totalUsers: usersCount || 0,
        totalVets: vetsCount || 0,
        pendingVets: pendingVetsData?.length || 0,
        activeSubscriptions: activeSubsCount || 0,
        totalConsultations: consultationsCount || 0,
        consultationsToday: consultationsTodayCount || 0,
      });

      setPendingVets(pendingVetsData || []);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyVet = async (vetId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: approve ? 'approved' : 'rejected',
          license_verified: approve
        })
        .eq('id', vetId);

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert({
        action: approve ? 'vendor_approved' : 'vendor_rejected',
        entity_type: 'profile',
        entity_id: vetId,
        details: { approved: approve },
        user_id: profile?.user_id
      });

      toast.success(approve ? 'Vendor approved!' : 'Vendor rejected');
      fetchDashboardData();
    } catch (error) {
      console.error('Error verifying vendor:', error);
      toast.error('Failed to update verification status');
    }
  };

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
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage users, vets, content, and subscriptions
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-info/10">
                    <Stethoscope className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalVets}</p>
                    <p className="text-xs text-muted-foreground">Veterinarians</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <AlertCircle className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingVets}</p>
                    <p className="text-xs text-muted-foreground">Pending Vets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CreditCard className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                    <p className="text-xs text-muted-foreground">Active Subs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <MessageCircle className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalConsultations}</p>
                    <p className="text-xs text-muted-foreground">Consultations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.consultationsToday}</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </div>
              </CardContent>
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
