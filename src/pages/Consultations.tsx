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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container-wide py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="font-display text-3xl font-bold">Consultations</h1>
              <p className="text-muted-foreground">
                {isVet ? 'Manage your patient consultations' : 'Your vet consultation history'}
              </p>
            </div>

            {!isVet && (
              <Button asChild>
                <Link to="/consultations/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Consultation
                </Link>
              </Button>
            )}
          </motion.div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search consultations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
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
