import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Stethoscope, MessageCircle, Clock, CheckCircle, XCircle,
  Users, Star, ToggleLeft, ToggleRight, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Consultation {
  id: string;
  status: string;
  chief_complaint: string;
  created_at: string;
  pet_owner: {
    first_name: string;
    last_name: string;
  } | null;
  pet: {
    name: string;
    species: string;
  } | null;
}

interface Stats {
  totalConsultations: number;
  completedToday: number;
  pendingRequests: number;
  averageRating: number;
}

const VetDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [pendingConsultations, setPendingConsultations] = useState<Consultation[]>([]);
  const [activeConsultations, setActiveConsultations] = useState<Consultation[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalConsultations: 0,
    completedToday: 0,
    pendingRequests: 0,
    averageRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(profile?.is_available || false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  useEffect(() => {
    setIsAvailable(profile?.is_available || false);
  }, [profile?.is_available]);

  const fetchData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      // Fetch pending consultation requests (unassigned)
      const { data: pendingData, error: pendingError } = await supabase
        .from('consultations')
        .select(`
          id, status, chief_complaint, created_at,
          pet_owner:profiles!consultations_pet_owner_id_fkey(first_name, last_name),
          pet:pets(name, species)
        `)
        .eq('status', 'pending')
        .is('veterinarian_id', null)
        .order('created_at', { ascending: true })
        .limit(10);

      if (pendingError) throw pendingError;
      setPendingConsultations(pendingData as unknown as Consultation[]);

      // Fetch active consultations for this vet
      const { data: activeData, error: activeError } = await supabase
        .from('consultations')
        .select(`
          id, status, chief_complaint, created_at,
          pet_owner:profiles!consultations_pet_owner_id_fkey(first_name, last_name),
          pet:pets(name, species)
        `)
        .eq('veterinarian_id', profile.id)
        .in('status', ['accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (activeError) throw activeError;
      setActiveConsultations(activeData as unknown as Consultation[]);

      // Fetch stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: totalCount } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('veterinarian_id', profile.id);

      const { count: todayCount } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('veterinarian_id', profile.id)
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', profile.id);

      const avgRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length
        : 0;

      setStats({
        totalConsultations: totalCount || 0,
        completedToday: todayCount || 0,
        pendingRequests: pendingData?.length || 0,
        averageRating: Math.round(avgRating * 10) / 10,
      });
    } catch (error) {
      console.error('Error fetching vet dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  const subscribeToConsultations = useCallback(() => {
    const channel = supabase
      .channel('vet-consultations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultations',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
      const unsubscribe = subscribeToConsultations();
      return () => {
        unsubscribe();
      };
    }
  }, [profile?.id, fetchData, subscribeToConsultations]);

  const toggleAvailability = async () => {
    setIsTogglingAvailability(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: !isAvailable })
        .eq('id', profile!.id);

      if (error) throw error;

      setIsAvailable(!isAvailable);
      await refreshProfile();
      toast.success(isAvailable ? 'You are now offline' : 'You are now available');
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const acceptConsultation = async (consultationId: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ 
          veterinarian_id: profile!.id,
          status: 'accepted',
          started_at: new Date().toISOString(),
        })
        .eq('id', consultationId)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('Consultation accepted! Opening chat...');
      navigate(`/consultations/${consultationId}`);
    } catch (error) {
      console.error('Error accepting consultation:', error);
      toast.error('Failed to accept consultation');
    }
  };

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
                Welcome, Dr. {profile?.last_name || 'Vet'}! 👋
              </h1>
              <div className="flex items-center gap-2">
                {isAvailable ? (
                  <span className="status-online font-bold uppercase tracking-widest text-[10px]">Online & Ready</span>
                ) : (
                  <span className="status-offline font-bold uppercase tracking-widest text-[10px]">Currently Offline</span>
                )}
              </div>
            </div>
            <Button 
              size="lg" 
              variant={isAvailable ? 'default' : 'outline'}
              onClick={toggleAvailability}
              disabled={isTogglingAvailability}
              className="gap-3 font-bold rounded-full shadow-soft px-8 min-w-[160px]"
            >
              {isAvailable ? (
                <>
                  <ToggleRight className="h-6 w-6" />
                  Online
                </>
              ) : (
                <>
                  <ToggleLeft className="h-6 w-6" />
                  Go Online
                </>
              )}
            </Button>
          </div>

          {/* Verification Status */}
          {!profile?.license_verified && (
            <Card className="mb-10 border-warning/50 bg-warning/5 glass-card">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between py-6 px-8 gap-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-3 rounded-2xl bg-warning/10 text-warning">
                    <Stethoscope className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">License verification pending</p>
                    <p className="text-sm text-muted-foreground font-medium">
                      Please upload your veterinary license to start accepting consultations.
                    </p>
                  </div>
                </div>
                <Button variant="default" className="rounded-full font-bold px-8" asChild>
                  <Link to="/profile">Complete Profile</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-4 mb-10">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-foreground tracking-tighter">{stats.totalConsultations}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Consults</p>
                </div>
              </div>
            </Card>
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-success/10 text-success shadow-sm">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-foreground tracking-tighter">{stats.completedToday}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Done Today</p>
                </div>
              </div>
            </Card>
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-warning/10 text-warning shadow-sm">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-foreground tracking-tighter">{stats.pendingRequests}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Waiting</p>
                </div>
              </div>
            </Card>
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-accent/10 text-accent shadow-sm">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-foreground tracking-tighter">{stats.averageRating || '-'}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg. Rating</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pending Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pending Consultation Requests
                </CardTitle>
                <CardDescription>
                  New requests waiting for a veterinarian
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : pendingConsultations.length > 0 ? (
                  <div className="space-y-3">
                    {pendingConsultations.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">
                              {consultation.pet_owner?.first_name} {consultation.pet_owner?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Pet: {consultation.pet?.name} ({consultation.pet?.species})
                            </p>
                            <p className="text-sm mt-2 line-clamp-2">
                              {consultation.chief_complaint}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(consultation.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => acceptConsultation(consultation.id)}
                              disabled={!isAvailable}
                            >
                              Accept
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No pending requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Consultations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Active Consultations
                </CardTitle>
                <CardDescription>
                  Your ongoing consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : activeConsultations.length > 0 ? (
                  <div className="space-y-3">
                    {activeConsultations.map((consultation) => (
                      <Link
                        key={consultation.id}
                        to={`/consultations/${consultation.id}`}
                        className="block p-4 rounded-lg border hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {consultation.pet_owner?.first_name} {consultation.pet_owner?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {consultation.pet?.name} ({consultation.pet?.species})
                            </p>
                            <Badge className="mt-2 bg-info">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              In Progress
                            </Badge>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No active consultations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default VetDashboard;
