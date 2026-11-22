import { supabase } from '@/integrations/supabase/client';

export type CareChat = {
  closed: boolean;
  messages: { id: number; sender: 'visitor' | 'team'; body: string; created_at: string }[];
};
export type CareChatInboxItem = {
  id: string;
  closed: boolean;
  updated_at: string;
  preview: string;
  awaiting_reply: boolean;
};

export type CareChatSend = { message_key: string; message_body: string };

export async function visitCareChat(key: string, message?: CareChatSend) {
  const { data, error } = await supabase.rpc('care_chat_visitor', { guest_key: key, ...message });
  if (error) throw error;
  return data as CareChat | null;
}

export async function listCareChats() {
  const { data, error } = await supabase.rpc('care_chat_inbox');
  if (error) throw error;
  if (!Array.isArray(data)) throw Error('Inbox unavailable');
  return data as CareChatInboxItem[];
}

export async function staffCareChat(id: string, message?: CareChatSend, close = false) {
  const { data, error } = await supabase.rpc('care_chat_staff', { chat_id: id, ...message, close_chat: close });
  if (error) throw error;
  return data as CareChat | null;
}
