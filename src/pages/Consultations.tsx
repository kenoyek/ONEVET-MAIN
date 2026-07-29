import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { useConsultations, type Consultation } from '@/hooks/useConsultations';
import { SubscriptionGate } from '@/components/shared/SubscriptionGate';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type ConsultationStatus = Database['public']['Enums']['consultation_status'];

const statusConfig: Record<ConsultationStatus, { label: string; icon: typeof Clock; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Waiting', icon: Clock, variant: 'secondary' },
  accepted: { label: 'Accepted', icon: CheckCircle, variant: 'default' },
  in_progress: { label: 'Active', icon: MessageCircle, variant: 'default' },
  completed: { label: 'Completed', icon: CheckCircle, variant: 'outline' },
  cancelled: { label: 'Cancelled', icon: XCircle, variant: 'destructive' },
};

function ConsultationCard({ consultation, isVet }: { consultation: Consultation; isVet: boolean }) {
  const otherParty = isVet ? consultation.pet_owner : consultation.veterinarian;
  const otherName = otherParty
    ? `${otherParty.first_name} ${otherParty.last_name}`
    : isVet
    ? 'Pet Owner'
    : 'Awaiting Vet';

  const initials = otherParty
    ? `${otherParty.first_name[0]}${otherParty.last_name[0]}`.toUpperCase()
    : 'U';

  const status = statusConfig[consultation.status];
  const StatusIcon = status.icon;

  return (
    <Link to={`/consultations/${consultation.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherParty?.avatar_url || undefined} alt={otherName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold truncate">{otherName}</h3>
                <Badge variant={status.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
              </div>

              {consultation.pet && (
                <p className="text-sm text-muted-foreground mb-1">
                  Pet: {consultation.pet.name} ({consultation.pet.species})
                </p>
              )}

              <p className="text-sm text-muted-foreground line-clamp-1">
                {consultation.chief_complaint}
              </p>

              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(consultation.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Consultations() {
  const { role } = useAuth();
  const isVet = role === 'veterinarian';
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const statusFilter: ConsultationStatus[] | undefined = 
    activeTab === 'all' ? undefined :
    activeTab === 'active' ? ['pending', 'in_progress'] :
    activeTab === 'completed' ? ['completed'] :
    undefined;

  const { consultations, loading } = useConsultations(statusFilter);

  const filteredConsultations = consultations.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const otherParty = isVet ? c.pet_owner : c.veterinarian;
    const otherName = otherParty ? `${otherParty.first_name} ${otherParty.last_name}`.toLowerCase() : '';
    const petName = c.pet?.name?.toLowerCase() || '';
    const complaint = c.chief_complaint.toLowerCase();
    return otherName.includes(query) || petName.includes(query) || complaint.includes(query);
  });

  return (
    <div className="min-h-screen bg-background bg-mesh-gradient">
      <Navbar />
      
      <main className="pt-28 md:pt-32 pb-20">
        <div className="container-wide">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
          >
            <div>
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold bg-background">
                Medical Records
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-2">Consultations</h1>
              <p className="text-muted-foreground font-medium">
                {isVet ? 'Review and manage your patient consultation history.' : 'Access your professional medical consultation history.'}
              </p>
            </div>

            {!isVet && (
              <Button size="lg" className="rounded-full font-black px-8 shadow-glow" asChild>
                <Link to="/consultations/new">
                  <Plus className="mr-3 h-5 w-5" />
                  New Consultation
                </Link>
              </Button>
            )}
          </motion.div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 p-2 rounded-2xl bg-card border border-border/40 shadow-soft">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 rounded-xl bg-muted/30 border-transparent focus:bg-background transition-all"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto">
                <TabsTrigger value="all" className="rounded-lg font-bold data-[state=active]:shadow-soft">All Records</TabsTrigger>
                <TabsTrigger value="active" className="rounded-lg font-bold data-[state=active]:shadow-soft">In Progress</TabsTrigger>
                <TabsTrigger value="completed" className="rounded-lg font-bold data-[state=active]:shadow-soft">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          {!isVet ? (
            <SubscriptionGate>
              <ConsultationsList 
                consultations={filteredConsultations} 
                loading={loading} 
                isVet={isVet} 
              />
            </SubscriptionGate>
          ) : (
            <ConsultationsList 
              consultations={filteredConsultations} 
              loading={loading} 
              isVet={isVet} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

function ConsultationsList({ 
  consultations, 
  loading, 
  isVet 
}: { 
  consultations: Consultation[]; 
  loading: boolean; 
  isVet: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No consultations found</h3>
        <p className="text-muted-foreground">
          {isVet 
            ? 'No consultation requests at the moment.' 
            : 'Start a new consultation to get help from a vet.'}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid gap-4"
    >
      {consultations.map((consultation) => (
        <ConsultationCard 
          key={consultation.id} 
          consultation={consultation} 
          isVet={isVet} 
        />
      ))}
    </motion.div>
  );
}
