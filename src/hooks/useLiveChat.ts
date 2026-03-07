import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRealTimeMessages } from '@/hooks/useRealTimeMessages';

type LiveChatStatus = 'idle' | 'waiting' | 'active' | 'completed';

interface Consultation {
  id: string;
  status: string;
  is_urgent: boolean;
  chief_complaint: string;
  veterinarian_id: string | null;
}

export function useLiveChat() {
  const { user, profile } = useAuth();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [status, setStatus] = useState<LiveChatStatus>('idle');
  const [loading, setLoading] = useState(false);

  const consultationId = consultation?.id;
  const { messages, sendMessage: sendRealTimeMessage, loading: messagesLoading } = useRealTimeMessages(consultationId);

  // Check for existing active urgent consultation on mount
  useEffect(() => {
    if (!profile?.id) return;

    const fetchExisting = async () => {
      const { data } = await supabase
        .from('consultations')
        .select('id, status, is_urgent, chief_complaint, veterinarian_id')
        .eq('pet_owner_id', profile.id)
        .eq('is_urgent', true)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setConsultation(data as Consultation);
        if (data.status === 'pending') setStatus('waiting');
        else setStatus('active');
      }
    };

    fetchExisting();
  }, [profile?.id]);

  // Subscribe to consultation status changes
  useEffect(() => {
    if (!consultationId) return;

    const channel = supabase
      .channel(`urgent-consultation-${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultations',
          filter: `id=eq.${consultationId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setConsultation((prev) => prev ? { ...prev, ...updated } : null);

          if (['accepted', 'in_progress'].includes(updated.status)) {
            setStatus('active');
          } else if (['completed', 'cancelled'].includes(updated.status)) {
            setStatus('completed');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId]);

  const startChat = useCallback(async (message: string) => {
    if (!profile?.id || !user?.id) return;

    setLoading(true);
    try {
      // Create urgent consultation
      const { data, error } = await supabase
        .from('consultations')
        .insert({
          pet_owner_id: profile.id,
          chief_complaint: message,
          is_urgent: true,
          status: 'pending',
        })
        .select('id, status, is_urgent, chief_complaint, veterinarian_id')
        .single();

      if (error) throw error;

      setConsultation(data as Consultation);
      setStatus('waiting');

      // Send the first message
      await supabase.from('messages').insert({
        consultation_id: data.id,
        sender_id: profile.id,
        content: message,
      });
    } catch (err) {
      console.error('Failed to start live chat:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profile?.id, user?.id]);

  const sendMessage = useCallback(async (content: string) => {
    if (!consultationId) return;
    await sendRealTimeMessage(content);
  }, [consultationId, sendRealTimeMessage]);

  const closeChat = useCallback(() => {
    if (status === 'completed' || status === 'idle') {
      setConsultation(null);
      setStatus('idle');
    }
  }, [status]);

  return {
    status,
    consultation,
    messages,
    messagesLoading,
    loading,
    startChat,
    sendMessage,
    closeChat,
  };
}
