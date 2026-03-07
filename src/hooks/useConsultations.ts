import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Database } from '@/integrations/supabase/types';

type ConsultationStatus = Database['public']['Enums']['consultation_status'];

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  avatar_url: string | null;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  specialty: string | null;
  is_available: boolean;
  license_verified: boolean;
}

export interface Consultation {
  id: string;
  pet_owner_id: string;
  veterinarian_id: string | null;
  pet_id: string | null;
  status: ConsultationStatus;
  chief_complaint: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  pet?: Pet;
  pet_owner?: Profile;
  veterinarian?: Profile | null;
}

interface UseConsultationsReturn {
  consultations: Consultation[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  acceptConsultation: (consultationId: string) => Promise<void>;
  declineConsultation: (consultationId: string) => Promise<void>;
  completeConsultation: (consultationId: string, data: { diagnosis?: string; prescription?: string; notes?: string }) => Promise<void>;
}

export function useConsultations(statusFilter?: ConsultationStatus | ConsultationStatus[]): UseConsultationsReturn {
  const { user, profile, role } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConsultations = useCallback(async () => {
    if (!user || !profile) {
      setConsultations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('consultations')
        .select(`
          *,
          pet:pets(*),
          pet_owner:profiles!pet_owner_id(id, first_name, last_name, avatar_url, specialty, is_available, license_verified),
          veterinarian:profiles!veterinarian_id(id, first_name, last_name, avatar_url, specialty, is_available, license_verified)
        `)
        .order('created_at', { ascending: false });

      // Filter by status if provided
      if (statusFilter) {
        if (Array.isArray(statusFilter)) {
          query = query.in('status', statusFilter);
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setConsultations(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, profile, statusFilter]);

  useEffect(() => {
    fetchConsultations();

    if (!user) return;

    // Subscribe to consultation changes
    const channel = supabase
      .channel('consultations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultations',
        },
        () => {
          fetchConsultations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConsultations]);

  const acceptConsultation = async (consultationId: string) => {
    if (!profile?.id || role !== 'veterinarian') return;

    const { error: updateError } = await supabase
      .from('consultations')
      .update({
        veterinarian_id: profile.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', consultationId)
      .eq('status', 'pending');

    if (updateError) throw updateError;
  };

  const declineConsultation = async (consultationId: string) => {
    if (role !== 'veterinarian') return;

    // For now, just mark as cancelled if the vet declines
    // In a real app, you might want to just remove the vet and keep it pending
    const { error: updateError } = await supabase
      .from('consultations')
      .update({
        status: 'cancelled',
      })
      .eq('id', consultationId)
      .eq('status', 'pending');

    if (updateError) throw updateError;
  };

  const completeConsultation = async (
    consultationId: string,
    data: { diagnosis?: string; prescription?: string; notes?: string }
  ) => {
    if (!profile?.id) return;

    const { error: updateError } = await supabase
      .from('consultations')
      .update({
        ...data,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', consultationId);

    if (updateError) throw updateError;
  };

  return {
    consultations,
    loading,
    error,
    refetch: fetchConsultations,
    acceptConsultation,
    declineConsultation,
    completeConsultation,
  };
}
