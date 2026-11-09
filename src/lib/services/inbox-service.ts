import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
export type InboxNotification = Database['public']['Tables']['notifications']['Row'];
export function notificationDestination(notification: Pick<InboxNotification,'booking_id'|'link'> & Partial<Pick<InboxNotification,'booking_message_id'>>): string | null {
  if (notification.booking_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(notification.booking_id)) return `/appointments/${notification.booking_id}${notification.booking_message_id?'#messages':''}`;
  const link = notification.link;
  if (!link || !link.startsWith('/') || link.startsWith('//') || (link.includes('\\') || link.includes('%') || Array.from(link).some(character=>character.charCodeAt(0)<=32 || character.charCodeAt(0)===127))) return null;
  let target: URL;
  try { target = new URL(link,'https://onevet.invalid'); } catch { return null; }
  if (target.origin !== 'https://onevet.invalid') return null;
  const staticRoutes = ['/', '/dashboard','/my-bookings','/notifications','/provider/invitations','/profile','/consultations','/vet-dashboard','/admin','/contact'];
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  if (!staticRoutes.includes(target.pathname) && !new RegExp(`^/(appointments|consultations|pets)/${uuid}$`,'i').test(target.pathname) && !/^\/provider\/organization\/[a-z0-9]+(-[a-z0-9]+)*$/.test(target.pathname)) return null;
  return target.pathname + target.search + target.hash;
}
export const inboxService = {
  async list(userId: string, page: number, pageSize: number, unreadOnly: boolean) {
    let query = supabase.from('notifications').select('*').eq('user_id',userId).order('created_at',{ascending:false}).order('id');
    if (unreadOnly) query = query.eq('is_read',false);
    const {data,error} = await query.range(page*pageSize,page*pageSize+pageSize);
    if(error)throw error;
    return {rows:data.slice(0,pageSize),hasNext:data.length>pageSize};
  },
  async unread(userId: string) {
    const {data,error} = await supabase.rpc('get_unread_notification_count',{_user_id:userId});
    if(error)throw error;
    if(typeof data!=='number' || !Number.isInteger(data) || data<0)throw new Error('Unread count unavailable');
    return data;
  },
  async markRead(userId: string, id?: string) {
    let query = supabase.from('notifications').update({is_read:true}).eq('user_id',userId).eq('is_read',false);
    if(id!==undefined)query=query.eq('id',id);
    const {error}=await query;
    if(error)throw error;
  },
};
