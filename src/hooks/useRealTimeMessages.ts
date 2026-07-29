import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

interface Message {
  id: string;
  consultation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface UseRealTimeMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => Promise<void>;
}

export function useRealTimeMessages(consultationId: string | undefined): UseRealTimeMessagesReturn {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!consultationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, first_name, last_name, avatar_url)
        `)
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!consultationId) return;

    fetchMessages();

    const channel = supabase
      .channel(`consultation-messages-${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `consultation_id=eq.${consultationId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id(id, first_name, last_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!consultationId || !profile?.id || !content.trim()) return;

    const { error: sendError } = await supabase.from('messages').insert({
      consultation_id: consultationId,
      sender_id: profile.id,
      content: content.trim(),
    });

    if (sendError) {
      console.error('Error sending message:', sendError);
      throw sendError;
    }
  };

  const markAsRead = async () => {
    if (!consultationId || !profile?.id) return;

    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('consultation_id', consultationId)
      .neq('sender_id', profile.id)
      .eq('is_read', false);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
  };
}
