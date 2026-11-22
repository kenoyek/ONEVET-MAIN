import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type SupportMessage = Database['public']['Tables']['contact_messages']['Row'] & { resolved_at: string | null };
export type SupportMessageCursor = Pick<SupportMessage, 'created_at' | 'id'>;
export type SupportMessageFilter = 'open' | 'unread' | 'resolved' | 'all';
const pageSize = 25;

export async function listSupportMessages(filter: SupportMessageFilter, cursor?: SupportMessageCursor) {
  const { data, error } = await supabase.rpc('list_support_messages', {
    message_filter: filter,
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
