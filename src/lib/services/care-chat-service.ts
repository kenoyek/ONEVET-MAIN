import type { careSearchCategories } from '@/lib/care-search';
import { supabase } from '@/integrations/supabase/client';

export type CareChatBookingCategory = typeof careSearchCategories[number][0];

export type CareChat = {
  closed: boolean;
  owner_id?: string | null;
  owned_by_me?: boolean;
  messages: {
    id: number;
    sender: 'visitor' | 'team';
    body: string;
    created_at: string;
    booking_category?: CareChatBookingCategory | null;
  }[];
};
export type CareChatInboxItem = {
  id: string;
  closed: boolean;
  updated_at: string;
  preview: string;
  awaiting_reply: boolean;
  assignment: 'unassigned' | 'mine' | 'teammate';
};

export type CareChatSend = {
  message_key: string;
  message_body: string;
  booking_category?: CareChatBookingCategory;
};

export async function visitCareChat(key: string, message?: CareChatSend) {
  const { data, error } = await supabase.rpc('care_chat_visitor', {
    guest_key: key, message_key: message?.message_key, message_body: message?.message_body,
  });
  if (error) throw error;
  return data as CareChat | null;
}

export type CareChatInboxFilter = 'waiting' | 'replied' | 'closed';
export type CareChatInboxAssignment = 'all' | 'mine' | 'unassigned';
export type CareChatInboxCursor = Pick<CareChatInboxItem, 'id' | 'updated_at'>;
const careChatInboxPageSize = 25;

export async function listCareChats(filter: CareChatInboxFilter, assignment: CareChatInboxAssignment, cursor?: CareChatInboxCursor) {
  const { data, error } = await supabase.rpc('care_chat_inbox_page', {
    filter_status: filter,
    filter_assignment: assignment,
    after_updated_at: cursor?.updated_at ?? null,
    after_chat_id: cursor?.id ?? null,
  });
  if (error) throw error;
  if (!Array.isArray(data)) throw Error('Inbox unavailable');
  const items = data as CareChatInboxItem[];
  return { items: items.slice(0, careChatInboxPageSize), hasMore: items.length > careChatInboxPageSize };
}

export async function staffCareChat(id: string, message?: CareChatSend, close = false) {
  const { data, error } = await supabase.rpc('care_chat_staff', {
    chat_id: id,
    message_key: message?.message_key ?? null,
    message_body: message?.message_body ?? null,
    close_chat: close,
    booking_category_arg: message?.booking_category ?? null,
  });
  if (error) throw error;
  return data as CareChat | null;
}

export const careChatAvailabilityKey = ['care-chat', 'availability'] as const;

export async function isCareChatAvailable() {
  const { data, error } = await supabase.rpc('care_chat_is_available');
  if (error) throw error;
  if (typeof data !== 'boolean') throw Error('Chat availability could not be confirmed');
  return data;
}

export async function staffCareChatAvailability(accepting?: boolean) {
  const { data, error } = await supabase.rpc(
    'care_chat_staff_availability',
    accepting === undefined ? {} : { accepting },
  );
  if (error) throw error;
  return data;
}

export const careChatWaitingKey = (userId: string) => ['care-chat', 'waiting', userId] as const;

export async function countWaitingCareChats() {
  const { data, error } = await supabase.rpc('care_chat_waiting_count');
  if (error) throw error;
  if (!Number.isSafeInteger(data) || data < 0) throw Error('Chat count could not be confirmed');
  return data;
}

export async function hasCareChatReply(key: string, after: number) {
  const { data, error } = await supabase.rpc('care_chat_reply_pending', { guest_key: key, after_id: after });
  if (error) throw error;
  if (typeof data !== 'boolean') throw Error('Chat reply status could not be confirmed');
  return data;
}

export async function assignCareChat(id: string, expectedOwner: string | null, release: boolean) {
  const { data, error } = await supabase.rpc('care_chat_assign', {
    chat_id: id, expected_owner: expectedOwner, release_chat: release,
  });
  if (error) throw error;
  return data as CareChat | null;
}
