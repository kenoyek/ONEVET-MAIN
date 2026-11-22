import { PageHeading } from '@/components/layout/PageHeading';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, MessageCircle, Search, Filter, Loader2, 
  Eye, Clock, CheckCircle, XCircle, User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageItem, MessageTranscript } from '@/components/chat/MessageTranscript';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Database } from '@/integrations/supabase/types';

type ConsultationStatus = Database['public']['Enums']['consultation_status'];

interface Consultation {
  id: string;
  status: ConsultationStatus;
  chief_complaint: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  pet_owner: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  veterinarian: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  pet: {
    name: string;
    species: string;
  } | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

const statusConfig: Record<ConsultationStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Clock }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  accepted: { label: 'Accepted', variant: 'default', icon: CheckCircle },
  in_progress: { label: 'In Progress', variant: 'default', icon: MessageCircle },
  completed: { label: 'Completed', variant: 'outline', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

export default function AdminConversations() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // View dialog state
  const [viewingConsultation, setViewingConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesFailed, setMessagesFailed] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          pet_owner:profiles!pet_owner_id(id, first_name, last_name, avatar_url),
          veterinarian:profiles!veterinarian_id(id, first_name, last_name, avatar_url),
          pet:pets(name, species)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setConsultations(data as unknown as Consultation[]);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewClick = async (consultation: Consultation) => {
    const version = ++requestVersion.current;
    setViewingConsultation(consultation);
    setMessages([]);
    setMessagesFailed(false);
    setIsLoadingMessages(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, content, created_at, sender_id,
          sender:profiles!sender_id(first_name, last_name, avatar_url)
        `)
        .eq('consultation_id', consultation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (version === requestVersion.current) setMessages((data ?? []) as unknown as Message[]);
    } catch {
      if (version === requestVersion.current) setMessagesFailed(true);
    } finally {
      if (version === requestVersion.current) setIsLoadingMessages(false);
    }
  };

  const filteredConsultations = consultations.filter(c => {
    const matchesSearch = searchQuery === '' ||
      c.pet_owner?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pet_owner?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.veterinarian?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.veterinarian?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chief_complaint?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container-wide py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <PageHeading size="workspace" className="" title={<> Conversation Monitor </>}/>
              <p className="text-muted-foreground mt-1">
                View and moderate consultations (read-only)
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    aria-label="Search consultations"
                    placeholder="Search by participant or complaint"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger aria-label="Consultation status" className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Consultations Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Consultations ({filteredConsultations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredConsultations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No consultations found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pet Owner</TableHead>
                        <TableHead>Veterinarian</TableHead>
                        <TableHead>Pet</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConsultations.map((consultation) => {
                        const status = statusConfig[consultation.status];
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={consultation.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={consultation.pet_owner?.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {consultation.pet_owner?.first_name?.[0]}
                                    {consultation.pet_owner?.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {consultation.pet_owner?.first_name} {consultation.pet_owner?.last_name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {consultation.veterinarian ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={consultation.veterinarian.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {consultation.veterinarian.first_name?.[0]}
                                      {consultation.veterinarian.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    Dr. {consultation.veterinarian.first_name} {consultation.veterinarian.last_name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {consultation.pet?.name} ({consultation.pet?.species})
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(consultation.created_at), 'MMM d, yyyy h:mm a')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewClick(consultation)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* View Dialog */}
      <Dialog open={!!viewingConsultation} onOpenChange={open => {
        if (open) return;
        requestVersion.current++;
        setViewingConsultation(null);
        setMessages([]);
      }}>
        <DialogContent className="flex max-h-[85dvh] max-w-2xl flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consultation Details</DialogTitle>
            <DialogDescription>
              Read-only view of the consultation and messages
            </DialogDescription>
          </DialogHeader>

          {viewingConsultation && (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Consultation Info */}
              <div className="space-y-4 pb-4 border-b">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Pet Owner</p>
                    <p>{viewingConsultation.pet_owner?.first_name} {viewingConsultation.pet_owner?.last_name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Veterinarian</p>
                    <p>
                      {viewingConsultation.veterinarian 
                        ? `Dr. ${viewingConsultation.veterinarian.first_name} ${viewingConsultation.veterinarian.last_name}`
                        : 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Pet</p>
                    <p>{viewingConsultation.pet?.name} ({viewingConsultation.pet?.species})</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Status</p>
                    <Badge variant={statusConfig[viewingConsultation.status].variant}>
                      {statusConfig[viewingConsultation.status].label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-sm">Chief Complaint</p>
                  <p className="text-sm">{viewingConsultation.chief_complaint}</p>
                </div>
                {viewingConsultation.diagnosis && (
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">Diagnosis</p>
                    <p className="text-sm">{viewingConsultation.diagnosis}</p>
                  </div>
                )}
                {viewingConsultation.prescription && (
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">Prescription</p>
                    <p className="text-sm">{viewingConsultation.prescription}</p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 pt-4">
                <p className="font-medium text-sm mb-3">Messages ({messages.length})</p>
                {isLoadingMessages ? (
                  <p role="status" className="rounded-xl border p-4 text-sm">Loading messages…</p>
                ) : messagesFailed ? (
                  <div className="rounded-xl border p-4 text-sm">
                    <p role="alert">Could not load this conversation.</p>
                    <Button variant="link" onClick={() => void handleViewClick(viewingConsultation)}>Retry messages</Button>
                  </div>
                ) : (
                  <MessageTranscript label="Consultation messages" lastId={messages.at(-1)?.id}
                    empty="No messages in this consultation." followLatest={false} className="max-h-[min(42dvh,22rem)]">
                    {messages.map(message => {
                      const owner = message.sender_id === viewingConsultation.pet_owner?.id;
                      const name = [message.sender?.first_name, message.sender?.last_name].filter(Boolean).join(' ');
                      return <MessageItem key={message.id} sender={name || (owner ? 'Pet owner' : 'Veterinarian')}
                        body={message.content} sentAt={message.created_at} own={!owner} />;
                    })}
                  </MessageTranscript>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
