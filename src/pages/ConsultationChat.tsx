import { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Clock, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ConsultationHeader } from '@/components/chat/ConsultationHeader';
import { ConsultationSummary } from '@/components/chat/ConsultationSummary';
import { ClinicalSOAPWorkspace } from '@/components/clinical/ClinicalSOAPWorkspace';
import { useAuth } from '@/lib/auth-context';
import { useRealTimeMessages } from '@/hooks/useRealTimeMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Consultation } from '@/hooks/useConsultations';

export default function ConsultationChat() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, role } = useAuth();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const { messages, loading: messagesLoading, sendMessage, markAsRead } = useRealTimeMessages(id);
  const { requestPermission, sendNotification } = useNotifications();

  const isVet = role === 'veterinarian';
  const isPetOwner = role === 'pet_owner' || role === 'service_provider';

  // Fetch consultation details
  const fetchConsultation = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('consultations')
        .select(`
          *,
          pet:pets(*),
          pet_owner:profiles!pet_owner_id(id, first_name, last_name, avatar_url, specialty, is_available, license_verified),
          veterinarian:profiles!veterinarian_id(id, first_name, last_name, avatar_url, specialty, is_available, license_verified)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setConsultation(data);
    } catch (err) {
      console.error('Error fetching consultation:', err);
      setError('Failed to load consultation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchConsultation();

    // Request notification permission
    requestPermission();

    // Subscribe to consultation updates
    if (!id) return;

    const channel = supabase
      .channel(`consultation-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultations',
          filter: `id=eq.${id}`,
        },
        () => {
          fetchConsultation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchConsultation, requestPermission]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0 && consultation?.status === 'in_progress') {
      markAsRead();
    }
  }, [messages.length, consultation?.status, markAsRead]);

  // Send browser notification for new messages
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender_id !== profile?.id) {
      const senderName = lastMessage.sender
        ? `${lastMessage.sender.first_name} ${lastMessage.sender.last_name}`
        : isVet ? 'Pet Owner' : 'Veterinarian';

      sendNotification(`New message from ${senderName}`, {
        body: lastMessage.content.substring(0, 100),
        tag: `consultation-${id}`,
      });
    }
  }, [messages, profile?.id, isVet, sendNotification, id]);

  const handleAcceptConsultation = async () => {
    if (!consultation || !profile?.id) return;

    try {
      const { error: updateError } = await supabase
        .from('consultations')
        .update({
          veterinarian_id: profile.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', consultation.id)
        .eq('status', 'pending');

      if (updateError) throw updateError;

      toast.success('Consultation accepted!');
      fetchConsultation();
    } catch (err) {
      console.error('Error accepting consultation:', err);
      toast.error('Failed to accept consultation');
    }
  };

  const handleCompleteConsultation = async (data: { diagnosis?: string; prescription?: string; notes?: string }) => {
    if (!consultation) return;

    try {
      const { error: updateError } = await supabase
        .from('consultations')
        .update({
          ...data,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', consultation.id);

      if (updateError) throw updateError;

      toast.success('Consultation completed!');
      fetchConsultation();
    } catch (err) {
      console.error('Error completing consultation:', err);
      toast.error('Failed to complete consultation');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container-wide py-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Consultation Not Found</h1>
            <p className="text-muted-foreground">{error || 'This consultation does not exist or you do not have access.'}</p>
          </div>
        </main>
      </div>
    );
  }

  // Check authorization
  const isParticipant =
    consultation.pet_owner_id === profile?.id ||
    consultation.veterinarian_id === profile?.id ||
    role === 'admin';

  // For vets, also allow if consultation is pending (so they can accept it)
  const canAccess = isParticipant || (isVet && consultation.status === 'pending');

  if (!canAccess) {
    return <Navigate to="/consultations" replace />;
  }

  // Pending state - waiting for vet
  if (consultation.status === 'pending' && isPetOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container-wide py-8 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="text-center">
                <CardContent className="py-12">
                  <div className="relative inline-block mb-6">
                    <div className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                    <Clock className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Waiting for a Veterinarian</h2>
                  <p className="text-muted-foreground mb-6">
                    A licensed veterinarian will connect with you shortly. Please stay on this page.
                  </p>

                  {consultation.pet && (
                    <div className="p-4 rounded-lg bg-muted inline-block mb-6">
                      <p className="text-sm">
                        <span className="font-medium">Pet:</span> {consultation.pet.name} ({consultation.pet.species})
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-muted max-w-md mx-auto">
                    <p className="text-sm font-medium mb-1">Your concern:</p>
                    <p className="text-sm text-muted-foreground">{consultation.chief_complaint}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // Pending state - vet can accept
  if (consultation.status === 'pending' && isVet) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container-wide py-8 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-1">New Consultation Request</h2>
                      <p className="text-muted-foreground">
                        From: {consultation.pet_owner?.first_name} {consultation.pet_owner?.last_name}
                      </p>
                    </div>
                  </div>

                  {consultation.pet && (
                    <div className="p-4 rounded-lg bg-muted mb-4">
                      <p className="text-sm">
                        <span className="font-medium">Pet:</span> {consultation.pet.name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Species:</span> {consultation.pet.species}
                      </p>
                      {consultation.pet.breed && (
                        <p className="text-sm">
                          <span className="font-medium">Breed:</span> {consultation.pet.breed}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-muted mb-6">
                    <p className="text-sm font-medium mb-1">Chief Complaint:</p>
                    <p className="text-sm">{consultation.chief_complaint}</p>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={handleAcceptConsultation} className="flex-1">
                      Accept Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // Active or completed consultation - show chat
  const isChatDisabled = consultation.status !== 'in_progress';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col pt-16 md:pt-20">
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto border-x">
          <ConsultationHeader
            consultation={consultation}
            isVet={isVet}
            onComplete={isVet && consultation.status === 'in_progress' ? () => setShowSummary(true) : undefined}
          />

          {consultation.status === 'completed' && (
            <div className="p-4 bg-muted border-b">
              <Badge variant="outline" className="mb-2">Consultation Completed</Badge>
              {consultation.diagnosis && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Diagnosis:</p>
                  <p className="text-sm text-muted-foreground">{consultation.diagnosis}</p>
                </div>
              )}
              {consultation.prescription && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Prescription:</p>
                  <p className="text-sm text-muted-foreground">{consultation.prescription}</p>
                </div>
              )}
            </div>
          )}

          {isVet && profile?.id && (
            <div className="p-4 border-b bg-background">
              <ClinicalSOAPWorkspace
                consultation={consultation}
                vetProfileId={profile.id}
                currentUserId={user?.id || ''}
                onRefresh={fetchConsultation}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <ChatWindow
              messages={messages}
              loading={messagesLoading}
              onSendMessage={sendMessage}
              disabled={isChatDisabled}
              placeholder={isChatDisabled ? 'This consultation has ended' : 'Type your message...'}
            />
          </div>
        </div>
      </main>

      <ConsultationSummary
        open={showSummary}
        onOpenChange={setShowSummary}
        onComplete={handleCompleteConsultation}
        petName={consultation.pet?.name}
      />
    </div>
  );
}
