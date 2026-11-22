import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type SupportMessage = Database['public']['Tables']['contact_messages']['Row'] & { resolved_at: string | null };
export type SupportMessageCursor = Pick<SupportMessage, 'created_at' | 'id'>;
export type SupportMessageFilter = 'open' | 'unread' | 'resolved' | 'all';
export const MAX_SUPPORT_SEARCH_LENGTH = 254;
const pageSize = 25;
export const supportInboxKey = (userId: string) => ['support-inbox', userId] as const;

export async function getSupportInboxTotals() {
  const { data, error } = await supabase.rpc('support_inbox_totals');
  if (error) throw error;
  const totals = data as { open: number; unread: number; resolved: number } | null;
  if (!totals || ![totals.open, totals.unread, totals.resolved].every(value => Number.isSafeInteger(value) && value >= 0)) {
    throw Error('Support inbox totals unavailable');
  }
  return totals;
}

export async function listSupportMessages(filter: SupportMessageFilter, search: string, cursor?: SupportMessageCursor) {
  const { data, error } = await supabase.rpc('list_support_messages', {
    message_filter: filter,
    search_text: search || null,
    before_created_at: cursor?.created_at ?? null,
    before_id: cursor?.id ?? null,
  });
  if (error) throw error;
  if (!Array.isArray(data)) throw Error('Support inbox unavailable');

  const records = data as SupportMessage[];
  return { records: records.slice(0, pageSize), hasMore: records.length > pageSize };
}

export async function markSupportMessageRead(id: string, isRead: boolean) {
  const { data, error } = await supabase.rpc('set_support_message_read', {
    message_id: id, read_state: isRead,
  });
  if (error) throw error;
  if (data !== true) throw Error('Support message unavailable');
}

export async function setSupportMessageResolved(id: string, resolved: boolean) {
  const { data, error } = await supabase.rpc('set_support_message_resolved', {
    message_id: id, resolved_state: resolved,
  });
  if (error) throw error;
  return data;
}

export type SupportMessageNote = {
  id: number;
  author_name: string;
  body: string;
  created_at: string;
};

export async function listSupportMessageNotes(id: string, before?: number) {
  const { data, error } = await supabase.rpc('list_support_message_notes', {
    target_message: id, before_note: before ?? null,
  });
  if (error) throw error;
  if (!Array.isArray(data)) throw Error('Private notes unavailable');
  const notes = data as SupportMessageNote[];
  return { notes: notes.slice(0, pageSize), hasMore: notes.length > pageSize };
}

export async function addSupportMessageNote(id: string, requestId: string, body: string) {
  const { error } = await supabase.rpc('add_support_message_note', {
    target_message: id, note_request: requestId, note_body: body,
  });
  if (error) throw error;
}
